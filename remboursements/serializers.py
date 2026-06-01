from rest_framework import serializers
from .models import Remboursement
from credits.serializers import DossierCreditListSerializer

class RemboursementSerializer(serializers.ModelSerializer):
    dossier_detail = DossierCreditListSerializer(source='dossier', read_only=True)

    class Meta:
        model = Remboursement
        fields = '__all__'
        read_only_fields = (
            'numero_remboursement',
            'montant_principal',
            'montant_penalite',
            'created_at',
            'saisi_par'
        )

class RemboursementListSerializer(serializers.ModelSerializer):
    dossier_numero = serializers.CharField(source='dossier.numero_dossier', read_only=True)
    membre_nom = serializers.CharField(source='dossier.membre.nom_complet', read_only=True)

    class Meta:
        model = Remboursement
        fields = (
            'id', 'numero_remboursement', 'dossier',
            'dossier_numero', 'membre_nom', 'montant_verse',
            'date_paiement', 'mode_paiement'
        )
