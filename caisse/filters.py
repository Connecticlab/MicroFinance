import django_filters
from .models import EcritureCompteGlobal

class EcritureFilter(django_filters.FilterSet):
    date_debut = django_filters.DateFilter(field_name='date_ecriture', lookup_expr='gte')
    date_fin = django_filters.DateFilter(field_name='date_ecriture', lookup_expr='lte')

    class Meta:
        model = EcritureCompteGlobal
        fields = ['type_ecriture', 'categorie', 'date_debut', 'date_fin']
