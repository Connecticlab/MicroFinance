from rest_framework import serializers
from .models import Membre

class MembreSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()
    a_credit_actif = serializers.ReadOnlyField()

    class Meta:
        model = Membre
        fields = '__all__'
        read_only_fields = ('numero_membre', 'created_at', 'updated_at')

class MembreListSerializer(serializers.ModelSerializer):
    """Serializer allégé pour les listes"""
    nom_complet = serializers.ReadOnlyField()

    class Meta:
        model = Membre
        fields = (
            'id', 'numero_membre', 'nom_complet',
            'telephone', 'statut', 'date_adhesion',
            'frais_adhesion_paye', 'a_credit_actif'
        )
