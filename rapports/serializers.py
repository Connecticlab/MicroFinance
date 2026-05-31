from rest_framework import serializers
from .models import ParametresMicrofinance

class ParametresMicrofinanceSerializer(serializers.ModelSerializer):

    class Meta:
        model = ParametresMicrofinance
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
