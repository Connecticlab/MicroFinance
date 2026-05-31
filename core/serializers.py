from rest_framework import serializers
from .models import Utilisateur

class UtilisateurSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Utilisateur
        fields = (
            'id', 'username', 'first_name', 'last_name',
            'email', 'role', 'telephone', 'est_actif',
            'is_staff', 'password'
        )
        read_only_fields = ('id',)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = Utilisateur(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class UtilisateurListSerializer(serializers.ModelSerializer):
    nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = ('id', 'username', 'nom_complet', 'role', 'est_actif')

    def get_nom_complet(self, obj):
        return obj.get_full_name() or obj.username

class ProfilSerializer(serializers.ModelSerializer):
    nom_complet = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Utilisateur
        fields = (
            'id', 'username', 'first_name', 'last_name',
            'nom_complet', 'email', 'role', 'role_display',
            'telephone', 'est_actif'
        )
        read_only_fields = ('id', 'username', 'role')

    def get_nom_complet(self, obj):
        return obj.get_full_name() or obj.username
