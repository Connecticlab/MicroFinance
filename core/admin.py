from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur

@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ('username', 'get_full_name', 'role', 'telephone', 'est_actif', 'is_staff')
    list_filter = ('role', 'est_actif', 'is_staff')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)

    fieldsets = UserAdmin.fieldsets + (
        ('Informations CTL', {
            'fields': ('role', 'telephone', 'est_actif')
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations CTL', {
            'fields': ('role', 'telephone', 'est_actif')
        }),
    )
