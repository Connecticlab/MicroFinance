from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Remboursement
from .serializers import RemboursementSerializer, RemboursementListSerializer
from credits.models import DossierCredit, LigneEcheancier
from caisse.models import EcritureCompteGlobal

class RemboursementViewSet(viewsets.ModelViewSet):
    queryset = Remboursement.objects.all().order_by('-date_paiement')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['mode_paiement', 'dossier']
    search_fields = ['numero_remboursement', 'dossier__numero_dossier', 'dossier__membre__nom']
    ordering_fields = ['date_paiement', 'montant_verse']

    def get_serializer_class(self):
        if self.action == 'list':
            return RemboursementListSerializer
        return RemboursementSerializer

    def perform_create(self, serializer):
        remboursement = serializer.save(saisi_par=self.request.user)
        self._traiter_remboursement(remboursement)

    def _traiter_remboursement(self, remboursement):
        dossier = remboursement.dossier
        montant = remboursement.montant_verse

        # Imputer sur l'échéance en retard ou la prochaine
        echeance = LigneEcheancier.objects.filter(
            dossier=dossier,
            statut__in=['EN_ATTENTE', 'EN_RETARD', 'PARTIELLEMENT_PAYE']
        ).order_by('numero_echeance').first()

        if echeance:
            remboursement.echeance = echeance
            # Appliquer d'abord sur les pénalités
            if echeance.penalite > 0:
                remboursement.montant_penalite = min(montant, echeance.penalite)
                montant -= remboursement.montant_penalite
                echeance.penalite -= remboursement.montant_penalite

            remboursement.montant_principal = montant
            echeance.montant_paye += montant

            if echeance.montant_paye >= echeance.montant_echeance:
                echeance.statut = 'PAYE'
                echeance.date_paiement = timezone.now().date()
            else:
                echeance.statut = 'PARTIELLEMENT_PAYE'

            echeance.save()
            remboursement.save()

        # Mettre à jour le dossier
        dossier.montant_rembourse += remboursement.montant_verse
        dossier.montant_restant = dossier.montant_accorde - dossier.montant_rembourse

        if dossier.montant_restant <= 0:
            dossier.statut = 'SOLDE'

        dossier.save()

        # Écriture en caisse
        EcritureCompteGlobal.objects.create(
            type_ecriture='ENTREE',
            categorie='REMBOURSEMENT',
            montant=remboursement.montant_verse,
            dossier_credit=dossier,
            remboursement=remboursement,
            description=f'Remboursement {remboursement.numero_remboursement} — {dossier.numero_dossier}',
            saisi_par=remboursement.saisi_par
        )
