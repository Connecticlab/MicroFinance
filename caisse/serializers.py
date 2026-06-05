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
    dossier_credit_id = serializers.IntegerField(
        source='dossier_credit.id', read_only=True, allow_null=True
    )
    dossier_credit_numero = serializers.CharField(
        source='dossier_credit.numero_dossier', read_only=True, allow_null=True
    )
    remboursement_id = serializers.IntegerField(
        source='remboursement.id', read_only=True, allow_null=True
    )
    remboursement_numero = serializers.CharField(
        source='remboursement.numero_remboursement', read_only=True, allow_null=True
    )
    membre_id = serializers.SerializerMethodField()
    membre_nom = serializers.SerializerMethodField()
    solde_avant = serializers.SerializerMethodField()

    def get_membre_id(self, obj):
        if obj.dossier_credit:
            return obj.dossier_credit.membre.id
        return None

    def get_membre_nom(self, obj):
        if obj.dossier_credit:
            return obj.dossier_credit.membre.nom_complet
        return None

    def get_solde_avant(self, obj):
        montant = float(obj.montant)
        solde_apres = float(obj.solde_apres)
        if obj.type_ecriture == 'ENTREE':
            return solde_apres - montant
        return solde_apres + montant

    class Meta:
        model = EcritureCompteGlobal
        fields = (
            'id', 'numero_ecriture', 'type_ecriture',
            'categorie', 'montant', 'solde_avant', 'solde_apres',
            'date_ecriture', 'description', 'saisi_par_nom',
            'dossier_credit_id', 'dossier_credit_numero',
            'remboursement_id', 'remboursement_numero',
            'membre_id', 'membre_nom'
        )
