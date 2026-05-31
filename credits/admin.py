from django.contrib import admin
from .models import DossierCredit, LigneEcheancier

class LigneEcheancierInline(admin.TabularInline):
    model = LigneEcheancier
    extra = 0
    readonly_fields = ('montant_restant',)

@admin.register(DossierCredit)
class DossierCreditAdmin(admin.ModelAdmin):
    list_display = ('numero_dossier', 'membre', 'montant_accorde', 'statut', 'date_deblocage', 'montant_restant')
    list_filter = ('statut', 'frequence_remboursement', 'mode_deblocage')
    search_fields = ('numero_dossier', 'membre__nom', 'membre__prenom')
    readonly_fields = ('numero_dossier', 'frg', 'montant_net_debloque', 'created_at', 'updated_at')
    inlines = [LigneEcheancierInline]

@admin.register(LigneEcheancier)
class LigneEcheancierAdmin(admin.ModelAdmin):
    list_display = ('dossier', 'numero_echeance', 'date_echeance', 'montant_echeance', 'montant_paye', 'statut')
    list_filter = ('statut',)
    search_fields = ('dossier__numero_dossier',)
