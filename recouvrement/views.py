from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import DossierRecouvrement, ActionRecouvrement
from .serializers import (
    DossierRecouvrementSerializer,
    DossierRecouvrementListSerializer,
    ActionRecouvrementSerializer
)

class DossierRecouvrementViewSet(viewsets.ModelViewSet):
    queryset = DossierRecouvrement.objects.all().order_by('-date_ouverture')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'etape_actuelle']
    search_fields = ['numero_dossier', 'credit__numero_dossier', 'credit__membre__nom']
    ordering_fields = ['date_ouverture', 'montant_en_defaut']

    def get_serializer_class(self):
        if self.action == 'list':
            return DossierRecouvrementListSerializer
        return DossierRecouvrementSerializer

    @action(detail=True, methods=['post'])
    def escalader(self, request, pk=None):
        dossier = self.get_object()
        etapes = [
            'RELANCE_1', 'RELANCE_2',
            'RELANCE_3', 'RELANCE_4'
        ]
        idx = etapes.index(dossier.etape_actuelle)
        if idx >= len(etapes) - 1:
            return Response(
                {'error': 'Étape maximale atteinte.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        dossier.etape_actuelle = etapes[idx + 1]
        dossier.save()
        return Response({
            'message': f'Escalade vers {dossier.get_etape_actuelle_display()}'
        })

    @action(detail=True, methods=['post'])
    def resoudre(self, request, pk=None):
        dossier = self.get_object()
        dossier.statut = 'RESOLU'
        dossier.date_resolution = timezone.now().date()
        dossier.save()
        # Mettre le crédit en soldé
        dossier.credit.statut = 'SOLDE'
        dossier.credit.save()
        return Response({'message': f'Dossier {dossier.numero_dossier} résolu.'})

    @action(detail=True, methods=['post'])
    def passer_en_perte(self, request, pk=None):
        dossier = self.get_object()
        dossier.statut = 'PERTE'
        dossier.date_resolution = timezone.now().date()
        dossier.save()
        dossier.credit.statut = 'EN_DEFAUT'
        dossier.credit.save()
        return Response({'message': f'Dossier {dossier.numero_dossier} passé en perte.'})


class ActionRecouvrementViewSet(viewsets.ModelViewSet):
    queryset = ActionRecouvrement.objects.all().order_by('-date_action')
    serializer_class = ActionRecouvrementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['type_action', 'resultat', 'dossier']
    search_fields = ['dossier__numero_dossier']

    def perform_create(self, serializer):
        serializer.save(effectuee_par=self.request.user)
