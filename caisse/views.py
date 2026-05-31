from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum
from .models import EcritureCompteGlobal
from .serializers import EcritureCompteGlobalSerializer, EcritureListSerializer

class EcritureCompteGlobalViewSet(viewsets.ModelViewSet):
    queryset = EcritureCompteGlobal.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type_ecriture', 'categorie', 'date_ecriture']
    search_fields = ['numero_ecriture', 'description']
    ordering_fields = ['date_ecriture', 'montant']
    http_method_names = ['get', 'head', 'options']  # Lecture seule

    def get_serializer_class(self):
        if self.action == 'list':
            return EcritureListSerializer
        return EcritureCompteGlobalSerializer

    @action(detail=False, methods=['get'])
    def solde(self, request):
        solde = EcritureCompteGlobal.get_solde_actuel()
        entrees = EcritureCompteGlobal.objects.filter(
            type_ecriture='ENTREE'
        ).aggregate(total=Sum('montant'))['total'] or 0
        sorties = EcritureCompteGlobal.objects.filter(
            type_ecriture='SORTIE'
        ).aggregate(total=Sum('montant'))['total'] or 0
        return Response({
            'solde_actuel': solde,
            'total_entrees': entrees,
            'total_sorties': sorties,
        })

    @action(detail=False, methods=['get'])
    def resume_par_categorie(self, request):
        from django.db.models import Count
        data = EcritureCompteGlobal.objects.values(
            'categorie', 'type_ecriture'
        ).annotate(
            total=Sum('montant'),
            nombre=Count('id')
        ).order_by('categorie')
        return Response(data)
