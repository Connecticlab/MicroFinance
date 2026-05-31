from django.contrib import admin
from .models import EcritureCompteGlobal

@admin.register(EcritureCompteGlobal)
class EcritureCompteGlobalAdmin(admin.ModelAdmin):
    list_display = ('numero_ecriture', 'type_ecriture', 'categorie', 'montant', 'solde_apres', 'date_ecriture', 'saisi_par')
    list_filter = ('type_ecriture', 'categorie', 'date_ecriture')
    search_fields = ('numero_ecriture', 'description')
    readonly_fields = ('numero_ecriture', 'solde_apres', 'created_at')
