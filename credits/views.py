from rest_framework import viewsets, status, filters
from django.http import HttpResponse
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from .models import DossierCredit, LigneEcheancier
from .serializers import (
    DossierCreditSerializer,
    DossierCreditListSerializer,
    LigneEcheancierSerializer
)

class DossierCreditViewSet(viewsets.ModelViewSet):
    queryset = DossierCredit.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'frequence_remboursement', 'mode_deblocage']
    search_fields = ['numero_dossier', 'membre__nom', 'membre__prenom']
    ordering_fields = ['created_at', 'montant_accorde']

    def get_serializer_class(self):
        if self.action == 'list':
            return DossierCreditListSerializer
        return DossierCreditSerializer

    def perform_create(self, serializer):
        membre = serializer.validated_data['membre']
        if membre.a_credit_actif:
            raise serializers.ValidationError(
                'Ce membre a déjà un crédit actif.'
            )
        serializer.save()

    @action(detail=True, methods=['post'])
    def soumettre(self, request, pk=None):
        dossier = self.get_object()
        if dossier.statut != 'BROUILLON':
            return Response(
                {'error': 'Seul un brouillon peut être soumis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        dossier.statut = 'SOUMIS'
        dossier.date_soumission = timezone.now().date()
        dossier.save()
        return Response({'message': f'Dossier {dossier.numero_dossier} soumis.'})

    @action(detail=True, methods=['post'])
    def approuver(self, request, pk=None):
        dossier = self.get_object()
        if dossier.statut not in ['SOUMIS', 'EN_ETUDE']:
            return Response(
                {'error': 'Dossier non approuvable dans cet état.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        montant = request.data.get('montant_accorde')
        if not montant:
            return Response(
                {'error': 'Le montant accordé est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        from decimal import Decimal
        dossier.montant_accorde = Decimal(str(montant))
        dossier.statut = 'APPROUVE'
        dossier.date_approbation = timezone.now().date()
        dossier.save()
        return Response({'message': f'Dossier {dossier.numero_dossier} approuvé.'})

    @action(detail=True, methods=['post'])
    def debloquer(self, request, pk=None):
        dossier = self.get_object()
        if dossier.statut != 'APPROUVE':
            return Response(
                {'error': 'Seul un dossier approuvé peut être débloqué.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not dossier.frg_verse:
            return Response(
                {'error': 'Le FRG doit être versé avant le déblocage du crédit.'},
                status=400
            )
        dossier.statut = 'DEBLOQUE'
        dossier.date_deblocage = timezone.now().date()
        dossier.save()
        # Génération automatique de l'échéancier
        self._generer_echeancier(dossier)

        # Écriture de sortie en caisse pour le déblocage
        from caisse.models import EcritureCompteGlobal
        EcritureCompteGlobal.objects.create(
            type_ecriture='SORTIE',
            categorie='DEBLOCAGE',
            montant=dossier.montant_accorde,
            dossier_credit=dossier,
            description=f'Déblocage crédit {dossier.numero_dossier} — {dossier.membre.nom_complet}',
            saisi_par=request.user
        )
        return Response({'message': f'Crédit {dossier.numero_dossier} débloqué et échéancier généré.'})

    def _generer_echeancier(self, dossier):
        montant_echeance = round(dossier.montant_accorde / dossier.nombre_echeances, 2)
        date_debut = dossier.date_deblocage
        for i in range(1, dossier.nombre_echeances + 1):
            if dossier.frequence_remboursement == 'MENSUEL':
                date_echeance = date_debut + relativedelta(months=i)
            else:
                from datetime import timedelta
                date_echeance = date_debut + timedelta(weeks=i)
            LigneEcheancier.objects.create(
                dossier=dossier,
                numero_echeance=i,
                date_echeance=date_echeance,
                montant_echeance=montant_echeance,
            )
        dossier.statut = 'EN_COURS'
        dossier.date_echeance_finale = date_echeance
        dossier.save()

    @action(detail=True, methods=['get'])
    def contrat_pdf(self, request, pk=None):
        from .pdf_generator import generer_contrat_credit
        dossier = self.get_object()
        buffer = generer_contrat_credit(dossier)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Contrat_{dossier.numero_dossier}.pdf"'
        return response

    @action(detail=True, methods=['get'])
    def recu_pdf(self, request, pk=None):
        from .pdf_generator import generer_recu_deblocage
        dossier = self.get_object()
        if dossier.statut not in ['DEBLOQUE', 'EN_COURS', 'SOLDE']:
            return Response({'error': 'Le crédit n\'a pas encore été débloqué.'}, status=400)
        buffer = generer_recu_deblocage(dossier)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Recu_{dossier.numero_dossier}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def verser_frg(self, request, pk=None):
        from decimal import Decimal
        from django.utils import timezone
        dossier = self.get_object()
        if dossier.frg_verse:
            return Response({'error': 'Le FRG a déjà été versé.'}, status=400)
        if dossier.statut not in ['APPROUVE', 'EN_COURS', 'DEBLOQUE', 'SOLDE']:
            return Response({'error': 'Le dossier doit être approuvé pour verser le FRG.'}, status=400)

        mode = request.data.get('mode_versement', 'ESPECES')
        dossier.frg_verse = True
        dossier.frg_date_versement = timezone.now().date()
        dossier.frg_mode_versement = mode
        dossier.save()

        # Écriture en caisse
        from caisse.models import EcritureCompteGlobal
        EcritureCompteGlobal.objects.create(
            type_ecriture='ENTREE',
            categorie='FRG',
            montant=dossier.frg,
            dossier_credit=dossier,
            description=f'Versement FRG — {dossier.numero_dossier} — {dossier.membre.nom_complet}',
            saisi_par=request.user
        )
        return Response({'message': f'FRG de {int(dossier.frg):,} FCFA versé avec succès.'.replace(",", " ")})

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        dossier = self.get_object()
        motif = request.data.get('motif', '')
        dossier.statut = 'REJETE'
        dossier.motif_rejet = motif
        dossier.save()
        return Response({'message': f'Dossier {dossier.numero_dossier} rejeté.'})

    @action(detail=True, methods=['post'])
    def ouvrir_recouvrement(self, request, pk=None):
        from recouvrement.models import DossierRecouvrement
        from core.models import Utilisateur
        credit = self.get_object()

        if credit.statut not in ['EN_COURS', 'EN_DEFAUT']:
            return Response({'error': 'Le crédit doit être en cours ou en défaut.'}, status=400)

        if hasattr(credit, 'dossier_recouvrement'):
            return Response({'error': 'Un dossier de recouvrement existe déjà pour ce crédit.'}, status=400)

        superviseur = Utilisateur.objects.filter(
            role='SUPERVISEUR', est_actif=True
        ).first() or request.user

        dossier = DossierRecouvrement.objects.create(
            credit=credit,
            montant_en_defaut=credit.montant_restant,
            assigne_a=superviseur,
            etape_actuelle='RELANCE_1',
            statut='OUVERT',
        )
        credit.statut = 'EN_DEFAUT'
        credit.save()

        return Response({'message': f'Dossier {dossier.numero_dossier} créé.', 'id': dossier.id})
