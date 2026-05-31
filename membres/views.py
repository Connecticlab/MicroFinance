from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Membre
from .serializers import MembreSerializer, MembreListSerializer

class MembreViewSet(viewsets.ModelViewSet):
    queryset = Membre.objects.all().order_by('-date_adhesion')
    permission_classes = [IsAuthenticated]
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
        return Response({'message': f'Adhésion de {membre.nom_complet} validée.'})

    @action(detail=True, methods=['post'])
    def suspendre(self, request, pk=None):
        membre = self.get_object()
        membre.statut = 'SUSPENDU'
        membre.save()
        return Response({'message': f'{membre.nom_complet} suspendu.'})
