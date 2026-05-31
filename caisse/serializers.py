from rest_framework import serializers
from .models import EcritureCompteGlobal

class EcritureCompteGlobalSerializer(serializers.ModelSerializer):

    class Meta:
        model = EcritureCompteGlobal
        fields = '__all__'
        read_only_fields = (
            'numero_ecriture',
            'solde_apres',
            'created_at'
        )

class EcritureListSerializer(serializers.ModelSerializer):
    saisi_par_nom = serializers.CharField(
        source='saisi_par.get_full_name', read_only=True
    )

    class Meta:
        model = EcritureCompteGlobal
        fields = (
            'id', 'numero_ecriture', 'type_ecriture',
            'categorie', 'montant', 'solde_apres',
            'date_ecriture', 'description', 'saisi_par_nom'
        )
