from django.contrib import admin
from .models import DossierRecouvrement, ActionRecouvrement

class ActionRecouvrementInline(admin.TabularInline):
    model = ActionRecouvrement
    extra = 0

@admin.register(DossierRecouvrement)
class DossierRecouvrementAdmin(admin.ModelAdmin):
    list_display = ('numero_dossier', 'credit', 'etape_actuelle', 'statut', 'montant_en_defaut', 'montant_recouvre', 'date_ouverture')
    list_filter = ('statut', 'etape_actuelle')
    search_fields = ('numero_dossier', 'credit__numero_dossier', 'credit__membre__nom')
    readonly_fields = ('numero_dossier', 'created_at', 'updated_at')
    inlines = [ActionRecouvrementInline]

@admin.register(ActionRecouvrement)
class ActionRecouvrementAdmin(admin.ModelAdmin):
    list_display = ('dossier', 'type_action', 'date_action', 'resultat', 'effectuee_par')
    list_filter = ('type_action', 'resultat')
    search_fields = ('dossier__numero_dossier',)
