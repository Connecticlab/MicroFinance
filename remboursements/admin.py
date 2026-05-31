from django.contrib import admin
from .models import Remboursement

@admin.register(Remboursement)
class RemboursementAdmin(admin.ModelAdmin):
    list_display = ('numero_remboursement', 'dossier', 'montant_verse', 'date_paiement', 'mode_paiement', 'saisi_par')
    list_filter = ('mode_paiement', 'date_paiement')
    search_fields = ('numero_remboursement', 'dossier__numero_dossier', 'dossier__membre__nom')
    readonly_fields = ('numero_remboursement', 'created_at')
