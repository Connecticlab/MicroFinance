from django.db import models
from django.core.validators import MinValueValidator
from credits.models import DossierCredit, LigneEcheancier
from core.models import Utilisateur

class Remboursement(models.Model):

    MODE_CHOICES = [
        ('ESPECES', 'Espèces'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('VIREMENT', 'Virement bancaire'),
    ]

    # Identification
    numero_remboursement = models.CharField(max_length=20, unique=True, editable=False)
    dossier = models.ForeignKey(
        DossierCredit,
        on_delete=models.PROTECT,
        related_name='remboursements'
    )
    echeance = models.ForeignKey(
        LigneEcheancier,
        on_delete=models.PROTECT,
        related_name='remboursements',
        null=True, blank=True
    )

    # Montants
    montant_verse = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(1)]
    )
    montant_principal = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    montant_penalite = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )

    # Paiement
    date_paiement = models.DateField()
    mode_paiement = models.CharField(
        max_length=20,
        choices=MODE_CHOICES,
        default='ESPECES'
    )
    reference_paiement = models.CharField(max_length=100, blank=True)

    # Métadonnées
    saisi_par = models.ForeignKey(
        Utilisateur,
        on_delete=models.PROTECT,
        related_name='remboursements_saisis'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Remboursement'
        verbose_name_plural = 'Remboursements'
        ordering = ['-date_paiement']

    def __str__(self):
        return f"{self.numero_remboursement} — {self.dossier.numero_dossier}"

    def save(self, *args, **kwargs):
        if not self.numero_remboursement:
            last = Remboursement.objects.order_by('id').last()
            next_id = (last.id + 1) if last else 1
            self.numero_remboursement = f"RMB-{next_id:05d}"
        super().save(*args, **kwargs)
