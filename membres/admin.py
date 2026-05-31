from django.contrib import admin
from .models import Membre

@admin.register(Membre)
class MembreAdmin(admin.ModelAdmin):
    list_display = ('numero_membre', 'nom', 'prenom', 'telephone', 'statut', 'date_adhesion', 'frais_adhesion_paye')
    list_filter = ('statut', 'sexe', 'frais_adhesion_paye')
    search_fields = ('numero_membre', 'nom', 'prenom', 'telephone')
    ordering = ('-date_adhesion',)
    readonly_fields = ('numero_membre', 'created_at', 'updated_at')
