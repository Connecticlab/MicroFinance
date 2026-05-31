from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import date
from .models import ParametresMicrofinance
from .serializers import ParametresMicrofinanceSerializer
from credits.models import DossierCredit, LigneEcheancier
from membres.models import Membre

class ParametresMicrofinanceViewSet(viewsets.ModelViewSet):
    queryset = ParametresMicrofinance.objects.all()
    serializer_class = ParametresMicrofinanceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return ParametresMicrofinance.get_instance()


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def resume(self, request):
        aujourd_hui = timezone.now().date()

        # Statistiques membres
        total_membres = Membre.objects.count()
        membres_actifs = Membre.objects.filter(statut='ACTIF').count()

        # Statistiques crédits
        credits_en_cours = DossierCredit.objects.filter(
            statut__in=['EN_COURS', 'DEBLOQUE']
        )
        total_encours = credits_en_cours.aggregate(
            total=Sum('montant_restant')
        )['total'] or 0

        credits_en_defaut = DossierCredit.objects.filter(
            statut='EN_DEFAUT'
        ).count()

        # Calcul PAR 30
        par30 = self._calculer_par(30)
        par90 = self._calculer_par(90)

        # Taux de remboursement
        total_du = DossierCredit.objects.filter(
            statut__in=['EN_COURS', 'SOLDE', 'EN_DEFAUT']
        ).aggregate(total=Sum('montant_accorde'))['total'] or 0

        total_rembourse = DossierCredit.objects.aggregate(
            total=Sum('montant_rembourse')
        )['total'] or 0

        taux_remboursement = (
            round((total_rembourse / total_du) * 100, 2)
            if total_du > 0 else 0
        )

        return Response({
            'membres': {
                'total': total_membres,
                'actifs': membres_actifs,
            },
            'credits': {
                'en_cours': credits_en_cours.count(),
                'en_defaut': credits_en_defaut,
                'total_encours': total_encours,
            },
            'indicateurs': {
                'par30': par30,
                'par90': par90,
                'taux_remboursement': taux_remboursement,
            }
        })

    def _calculer_par(self, jours):
        aujourd_hui = timezone.now().date()
        echeances_en_retard = LigneEcheancier.objects.filter(
            statut='EN_RETARD',
            date_echeance__lte=aujourd_hui - timezone.timedelta(days=jours)
        )
        montant_en_retard = echeances_en_retard.aggregate(
            total=Sum('montant_echeance')
        )['total'] or 0

        total_portefeuille = DossierCredit.objects.filter(
            statut__in=['EN_COURS', 'EN_DEFAUT']
        ).aggregate(total=Sum('montant_restant'))['total'] or 0

        if total_portefeuille == 0:
            return 0
        return round((montant_en_retard / total_portefeuille) * 100, 2)
