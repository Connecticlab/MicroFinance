from django.db import models

class ParametresMicrofinance(models.Model):
    """
    Modèle singleton — une seule instance de configuration globale.
    """

    # Identité
    nom_structure = models.CharField(max_length=200, default='Ma Microfinance')
    sigle = models.CharField(max_length=20, blank=True)
    adresse = models.TextField(blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    ninea = models.CharField(max_length=50, blank=True, verbose_name='NINEA')
    rccm = models.CharField(max_length=50, blank=True, verbose_name='RCCM')

    # Règles métier
    frais_adhesion = models.DecimalField(
        max_digits=10, decimal_places=2, default=5000,
        verbose_name="Frais d'adhésion (FCFA)"
    )
    taux_frg = models.DecimalField(
        max_digits=5, decimal_places=4, default=0.1667,
        verbose_name='Taux FRG (défaut : 1/6)'
    )
    penalite_retard = models.DecimalField(
        max_digits=10, decimal_places=2, default=2000,
        verbose_name='Pénalité de retard (FCFA/jour)'
    )
    plafond_credit_global = models.DecimalField(
        max_digits=14, decimal_places=2, default=10000000,
        verbose_name='Plafond crédit global (FCFA)'
    )
    ratio_concentration_max = models.DecimalField(
        max_digits=5, decimal_places=2, default=25,
        verbose_name='Ratio de concentration max (%)'
    )

    # Seuils PAR
    seuil_par30 = models.DecimalField(
        max_digits=5, decimal_places=2, default=5,
        verbose_name='Seuil PAR 30 acceptable (%)'
    )
    seuil_par90 = models.DecimalField(
        max_digits=5, decimal_places=2, default=3,
        verbose_name='Seuil PAR 90 acceptable (%)'
    )

    # Caisse
    solde_initial_caisse = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name='Solde initial de la caisse (FCFA)'
    )
    date_solde_initial = models.DateField(
        null=True, blank=True,
        verbose_name='Date de la mise à jour du solde initial'
    )

    # Exercice fiscal
    date_debut_exercice = models.DateField(null=True, blank=True)
    date_fin_exercice = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Paramètres Microfinance'
        verbose_name_plural = 'Paramètres Microfinance'

    def __str__(self):
        return f"Paramètres — {self.nom_structure}"

    def save(self, *args, **kwargs):
        # Singleton : on empêche la création de plusieurs instances
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_instance(cls):
        instance, _ = cls.objects.get_or_create(pk=1)
        return instance
