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


class Configuration(models.Model):
    nom_entreprise = models.CharField(max_length=100, default="MicroFinance+")
    slogan = models.CharField(max_length=200, blank=True, default="CTL Group")
    logo = models.ImageField(upload_to='config/', blank=True, null=True)
    couleur_primaire = models.CharField(max_length=7, default="#1A6FD4")

    class Meta:
        verbose_name = 'Configuration'
        verbose_name_plural = 'Configuration'

    def __str__(self):
        return self.nom_entreprise

    def save(self, *args, **kwargs):
        # Singleton — une seule configuration
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
