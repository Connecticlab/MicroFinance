from django.db import models
from django.core.validators import MinValueValidator
from membres.models import Membre

class DossierCredit(models.Model):

    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('SOUMIS', 'Soumis'),
        ('EN_ETUDE', 'En étude'),
        ('APPROUVE', 'Approuvé'),
        ('REJETE', 'Rejeté'),
        ('DEBLOQUE', 'Débloqué'),
        ('EN_COURS', 'En cours de remboursement'),
        ('SOLDE', 'Soldé'),
        ('EN_DEFAUT', 'En défaut'),
    ]

    FREQUENCE_CHOICES = [
        ('HEBDOMADAIRE', 'Hebdomadaire'),
        ('MENSUEL', 'Mensuel'),
    ]

    MODE_DEBLOCAGE_CHOICES = [
        ('ESPECES', 'Espèces'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('VIREMENT', 'Virement bancaire'),
    ]

    # Identification
    numero_dossier = models.CharField(max_length=20, unique=True, editable=False)
    membre = models.ForeignKey(
        Membre,
        on_delete=models.PROTECT,
        related_name='dossiers_credit'
    )

    # Montants
    montant_demande = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(1000)]
    )
    montant_accorde = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True
    )
    frg = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
        verbose_name='Fonds de Risques et de Garantie'
    )
    montant_net_debloque = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
        verbose_name='Montant net débloqué'
    )

    # Conditions
    frequence_remboursement = models.CharField(
        max_length=20,
        choices=FREQUENCE_CHOICES,
        default='MENSUEL'
    )
    nombre_echeances = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    mode_deblocage = models.CharField(
        max_length=20,
        choices=MODE_DEBLOCAGE_CHOICES,
        default='ESPECES'
    )

    # Dates
    date_soumission = models.DateField(null=True, blank=True)
    date_approbation = models.DateField(null=True, blank=True)
    date_deblocage = models.DateField(null=True, blank=True)
    date_echeance_finale = models.DateField(null=True, blank=True)

    # Statut
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='BROUILLON'
    )
    motif_rejet = models.TextField(blank=True)

    # Suivi
    montant_rembourse = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    montant_restant = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    penalites_total = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )

    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Dossier de Crédit'
        verbose_name_plural = 'Dossiers de Crédit'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.numero_dossier} — {self.membre.nom_complet}"

    def save(self, *args, **kwargs):
        if not self.numero_dossier:
            last = DossierCredit.objects.order_by('id').last()
            next_id = (last.id + 1) if last else 1
            self.numero_dossier = f"CRD-{next_id:05d}"
        if self.montant_accorde:
            self.frg = round(self.montant_accorde / 6, 2)
            self.montant_net_debloque = self.montant_accorde - self.frg
            self.montant_restant = self.montant_accorde - self.montant_rembourse
        super().save(*args, **kwargs)


class LigneEcheancier(models.Model):

    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('PAYE', 'Payé'),
        ('PARTIELLEMENT_PAYE', 'Partiellement payé'),
        ('EN_RETARD', 'En retard'),
    ]

    dossier = models.ForeignKey(
        DossierCredit,
        on_delete=models.CASCADE,
        related_name='echeancier'
    )
    numero_echeance = models.PositiveIntegerField()
    date_echeance = models.DateField()
    montant_echeance = models.DecimalField(max_digits=12, decimal_places=2)
    montant_paye = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    penalite = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    statut = models.CharField(
        max_length=25,
        choices=STATUT_CHOICES,
        default='EN_ATTENTE'
    )
    date_paiement = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Ligne d'Échéancier"
        verbose_name_plural = "Lignes d'Échéancier"
        ordering = ['numero_echeance']
        unique_together = ['dossier', 'numero_echeance']

    def __str__(self):
        return f"{self.dossier.numero_dossier} — Échéance {self.numero_echeance}"

    @property
    def montant_restant(self):
        return self.montant_echeance - self.montant_paye + self.penalite
