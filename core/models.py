from django.contrib.auth.models import AbstractUser
from django.db import models

class Utilisateur(AbstractUser):
    
    ROLE_CHOICES = [
        ('DG', 'Directeur Général'),
        ('COMPTABLE', 'Comptable'),
        ('SUPERVISEUR', 'Superviseur'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='COMPTABLE'
    )
    telephone = models.CharField(max_length=20, blank=True)
    est_actif = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    @property
    def est_dg(self):
        return self.role == 'DG'

    @property
    def est_comptable(self):
        return self.role == 'COMPTABLE'

    @property
    def est_superviseur(self):
        return self.role == 'SUPERVISEUR'
