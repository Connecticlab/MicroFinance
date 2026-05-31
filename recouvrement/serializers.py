from rest_framework import serializers
from .models import DossierRecouvrement, ActionRecouvrement
from credits.serializers import DossierCreditListSerializer

class ActionRecouvrementSerializer(serializers.ModelSerializer):

    class Meta:
        model = ActionRecouvrement
        fields = '__all__'
        read_only_fields = ('created_at',)

class DossierRecouvrementSerializer(serializers.ModelSerializer):
    credit_detail = DossierCreditListSerializer(source='credit', read_only=True)
    actions = ActionRecouvrementSerializer(many=True, read_only=True)
    montant_restant = serializers.ReadOnlyField()

    class Meta:
        model = DossierRecouvrement
        fields = '__all__'
        read_only_fields = ('numero_dossier', 'created_at', 'updated_at')

class DossierRecouvrementListSerializer(serializers.ModelSerializer):
    membre_nom = serializers.CharField(
        source='credit.membre.nom_complet', read_only=True
    )
    credit_numero = serializers.CharField(
        source='credit.numero_dossier', read_only=True
    )
    montant_restant = serializers.ReadOnlyField()

    class Meta:
        model = DossierRecouvrement
        fields = (
            'id', 'numero_dossier', 'credit_numero',
            'membre_nom', 'etape_actuelle', 'statut',
            'montant_en_defaut', 'montant_recouvre',
            'montant_restant', 'date_ouverture'
        )
