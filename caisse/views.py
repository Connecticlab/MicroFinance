from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .filters import EcritureFilter
from django.db.models import Sum
from .models import EcritureCompteGlobal
from .serializers import EcritureCompteGlobalSerializer, EcritureListSerializer

class EcritureCompteGlobalViewSet(viewsets.ModelViewSet):
    queryset = EcritureCompteGlobal.objects.all().order_by('-date_ecriture', '-id')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EcritureFilter
    search_fields = ['numero_ecriture', 'description']
    ordering_fields = ['date_ecriture', 'montant']
    http_method_names = ['get', 'head', 'options', 'post']  # post pour solde initial

    def get_serializer_class(self):
        if self.action == 'list':
            return EcritureListSerializer
        return EcritureCompteGlobalSerializer

    @action(detail=False, methods=['get'])
    def solde(self, request):
        from rapports.models import ParametresMicrofinance
        params = ParametresMicrofinance.get_instance()
        solde_initial = params.solde_initial_caisse or 0

        entrees = EcritureCompteGlobal.objects.filter(
            type_ecriture='ENTREE'
        ).aggregate(total=Sum('montant'))['total'] or 0
        sorties = EcritureCompteGlobal.objects.filter(
            type_ecriture='SORTIE'
        ).aggregate(total=Sum('montant'))['total'] or 0

        solde_actuel = solde_initial + entrees - sorties

        return Response({
            'solde_actuel': solde_actuel,
            'solde_initial': solde_initial,
            'total_entrees': entrees,
            'total_sorties': sorties,
            'date_solde_initial': params.date_solde_initial,
        })

    @action(detail=False, methods=['post'])
    def definir_solde_initial(self, request):
        from rapports.models import ParametresMicrofinance
        from django.utils import timezone
        from core.models import Utilisateur

        # Vérifier que c'est le DG
        user = request.user
        if user.role != 'DG' and not user.is_staff:
            return Response(
                {'error': 'Seul le Directeur Général peut définir le solde initial.'},
                status=403
            )

        montant = request.data.get('montant')
        if montant is None:
            return Response({'error': 'Le montant est requis.'}, status=400)

        from decimal import Decimal
        params = ParametresMicrofinance.get_instance()
        params.solde_initial_caisse = Decimal(str(montant))
        params.date_solde_initial = timezone.now().date()
        params.save()

        return Response({
            'message': f'Solde initial défini à {montant} FCFA',
            'solde_initial': params.solde_initial_caisse,
            'date': params.date_solde_initial,
        })

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        from .exports import generer_releve_pdf
        from django.http import HttpResponse

        qs = self.filter_queryset(self.get_queryset())
        filtres = {
            'date_debut': request.query_params.get('date_debut'),
            'date_fin': request.query_params.get('date_fin'),
            'type_ecriture': request.query_params.get('type_ecriture'),
            'categorie': request.query_params.get('categorie'),
        }

        # Filtrer par date
        if filtres['date_debut']:
            qs = qs.filter(date_ecriture__gte=filtres['date_debut'])
        if filtres['date_fin']:
            qs = qs.filter(date_ecriture__lte=filtres['date_fin'])
        if filtres['type_ecriture']:
            qs = qs.filter(type_ecriture=filtres['type_ecriture'])
        if filtres['categorie']:
            qs = qs.filter(categorie=filtres['categorie'])

        buffer = generer_releve_pdf(qs, filtres)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Releve_Caisse_{filtres.get("date_debut","all")}.pdf"'
        return response

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        from .exports import generer_releve_excel
        from django.http import HttpResponse

        qs = self.filter_queryset(self.get_queryset())
        filtres = {
            'date_debut': request.query_params.get('date_debut'),
            'date_fin': request.query_params.get('date_fin'),
            'type_ecriture': request.query_params.get('type_ecriture'),
            'categorie': request.query_params.get('categorie'),
        }

        if filtres['date_debut']:
            qs = qs.filter(date_ecriture__gte=filtres['date_debut'])
        if filtres['date_fin']:
            qs = qs.filter(date_ecriture__lte=filtres['date_fin'])
        if filtres['type_ecriture']:
            qs = qs.filter(type_ecriture=filtres['type_ecriture'])
        if filtres['categorie']:
            qs = qs.filter(categorie=filtres['categorie'])

        buffer = generer_releve_excel(qs, filtres)
        response = HttpResponse(
            buffer,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="Releve_Caisse.xlsx"'
        return response

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
