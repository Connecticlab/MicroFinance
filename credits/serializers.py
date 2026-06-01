from rest_framework import serializers
from .models import DossierCredit, LigneEcheancier
from membres.serializers import MembreListSerializer

class LigneEcheancierSerializer(serializers.ModelSerializer):
    montant_restant = serializers.ReadOnlyField()

    class Meta:
        model = LigneEcheancier
        fields = '__all__'
        read_only_fields = ('dossier',)

class DossierCreditSerializer(serializers.ModelSerializer):
    membre_detail = MembreListSerializer(source='membre', read_only=True)
    echeancier = LigneEcheancierSerializer(many=True, read_only=True)

    class Meta:
        model = DossierCredit
        fields = '__all__'
        read_only_fields = (
            'numero_dossier', 'frg',
            'montant_net_debloque', 'montant_rembourse',
            'montant_restant', 'penalites_total',
            'frg_date_versement',
            'created_at', 'updated_at'
        )

class DossierCreditListSerializer(serializers.ModelSerializer):
    membre_nom = serializers.CharField(source='membre.nom_complet', read_only=True)

    class Meta:
        model = DossierCredit
        fields = (
            'id', 'numero_dossier', 'membre', 'membre_nom',
            'montant_accorde', 'statut', 'date_deblocage',
            'montant_restant', 'frequence_remboursement'
        )
