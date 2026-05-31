from django.contrib import admin
from .models import ParametresMicrofinance

@admin.register(ParametresMicrofinance)
class ParametresMicrofinanceAdmin(admin.ModelAdmin):
    list_display = ('nom_structure', 'frais_adhesion', 'penalite_retard', 'plafond_credit_global')
    readonly_fields = ('created_at', 'updated_at')

    def has_add_permission(self, request):
        # Empêche la création d'une deuxième instance
        return not ParametresMicrofinance.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
