from rest_framework import viewsets, status, filters
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Membre
from .serializers import MembreSerializer, MembreListSerializer

class MembreViewSet(viewsets.ModelViewSet):
    queryset = Membre.objects.all().order_by('-date_adhesion')
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'sexe', 'frais_adhesion_paye']
    search_fields = ['nom', 'prenom', 'numero_membre', 'telephone']
    ordering_fields = ['date_adhesion', 'nom']

    def get_serializer_class(self):
        if self.action == 'list':
            return MembreListSerializer
        return MembreSerializer

    @action(detail=True, methods=['post'])
    def valider_adhesion(self, request, pk=None):
        membre = self.get_object()
        if membre.statut != 'EN_ATTENTE':
            return Response(
                {'error': 'Ce membre n\'est pas en attente de validation.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        membre.statut = 'ACTIF'
        membre.frais_adhesion_paye = True
        membre.save()

        # Écriture en caisse pour les frais d'adhésion
        from caisse.models import EcritureCompteGlobal
        EcritureCompteGlobal.objects.create(
            type_ecriture='ENTREE',
            categorie='ADHESION',
            montant=membre.frais_adhesion,
            description=f'Frais adhésion — {membre.nom_complet} ({membre.numero_membre})',
            saisi_par=request.user
        )
        return Response({'message': f'Adhésion de {membre.nom_complet} validée.'})


    @action(detail=True, methods=['get'])
    def recu_adhesion_pdf(self, request, pk=None):
        from credits.pdf_generator import generer_recu_adhesion
        from django.http import HttpResponse
        membre = self.get_object()
        if not membre.frais_adhesion_paye:
            return Response({'error': 'Les frais d\'adhésion n\'ont pas encore été payés.'}, status=400)
        buffer = generer_recu_adhesion(membre)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Recu_Adhesion_{membre.numero_membre}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def approuver(self, request, pk=None):
        from django.utils import timezone
        membre = self.get_object()
        if membre.statut != 'EN_ATTENTE':
            return Response({'error': "Ce membre n'est pas en attente d'approbation."}, status=400)
        membre.statut = 'APPROUVE'
        membre.date_approbation = timezone.now().date()
        membre.approuve_par = request.user
        membre.save()
        return Response({'message': f'Dossier de {membre.nom_complet} approuvé.'})

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        membre = self.get_object()
        motif = request.data.get('motif', '')
        membre.statut = 'REJETE'
        membre.motif_rejet = motif
        membre.save()
        return Response({'message': f'Dossier de {membre.nom_complet} rejeté.'})

    @action(detail=True, methods=['post'])
    def payer_frais(self, request, pk=None):
        from django.utils import timezone
        membre = self.get_object()
        if membre.statut != 'APPROUVE':
            return Response({'error': 'Le dossier doit être approuvé avant le paiement.'}, status=400)
        if membre.frais_adhesion_paye:
            return Response({'error': 'Les frais ont déjà été payés.'}, status=400)
        mode = request.data.get('mode_paiement', 'ESPECES')
        membre.frais_adhesion_paye = True
        membre.mode_paiement_frais = mode
        membre.date_paiement_frais = timezone.now().date()
        membre.statut = 'ACTIF'
        membre.save()
        from caisse.models import EcritureCompteGlobal
        EcritureCompteGlobal.objects.create(
            type_ecriture='ENTREE',
            categorie='ADHESION',
            montant=membre.frais_adhesion,
            description=f'Frais adhésion — {membre.nom_complet} ({membre.numero_membre})',
            saisi_par=request.user
        )
        return Response({'message': f'{membre.nom_complet} est maintenant membre actif.'})

    @action(detail=True, methods=['post'])
    def suspendre(self, request, pk=None):
        membre = self.get_object()
        membre.statut = 'SUSPENDU'
        membre.save()
        return Response({'message': f'{membre.nom_complet} suspendu.'})

    @action(detail=True, methods=['post'])
    def reactiver(self, request, pk=None):
        membre = self.get_object()
        if membre.statut != 'SUSPENDU':
            return Response({'error': 'Ce membre n\'est pas suspendu.'}, status=400)
        membre.statut = 'ACTIF'
        membre.save()
        return Response({'message': f'{membre.nom_complet} réactivé.'})

    @action(detail=True, methods=['post'])
    def exclure(self, request, pk=None):
        membre = self.get_object()
        if membre.a_credit_actif:
            return Response({'error': 'Impossible d\'exclure un membre avec un crédit actif.'}, status=400)
        membre.statut = 'EXCLU'
        membre.save()
        return Response({'message': f'{membre.nom_complet} exclu.'})
