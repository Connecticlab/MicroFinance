from django.db import models
from credits.models import DossierCredit
from remboursements.models import Remboursement
from core.models import Utilisateur

class EcritureCompteGlobal(models.Model):

    TYPE_CHOICES = [
        ('ENTREE', 'Entrée'),
        ('SORTIE', 'Sortie'),
    ]

    CATEGORIE_CHOICES = [
        ('ADHESION', 'Frais d\'adhésion'),
        ('FRG', 'Fonds de Risques et de Garantie'),
        ('DEBLOCAGE', 'Déblocage crédit'),
        ('REMBOURSEMENT', 'Remboursement'),
        ('PENALITE', 'Pénalité de retard'),
        ('AUTRE', 'Autre'),
    ]

    # Identification
    numero_ecriture = models.CharField(max_length=20, unique=True, editable=False)
    type_ecriture = models.CharField(max_length=10, choices=TYPE_CHOICES)
    categorie = models.CharField(max_length=20, choices=CATEGORIE_CHOICES)

    # Montant
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    solde_apres = models.DecimalField(
        max_digits=14, decimal_places=2,
        editable=False, default=0
    )

    # Références
    dossier_credit = models.ForeignKey(
        DossierCredit,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='ecritures'
    )
    remboursement = models.ForeignKey(
        Remboursement,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='ecritures'
    )

    # Métadonnées
    date_ecriture = models.DateField(auto_now_add=True)
    description = models.CharField(max_length=255)
    saisi_par = models.ForeignKey(
        Utilisateur,
        on_delete=models.PROTECT,
        related_name='ecritures_saisies'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Écriture Compte Global'
        verbose_name_plural = 'Écritures Compte Global'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.numero_ecriture} — {self.get_type_ecriture_display()} {self.montant} FCFA"

    def save(self, *args, **kwargs):
        if not self.numero_ecriture:
            last = EcritureCompteGlobal.objects.order_by('id').last()
            next_id = (last.id + 1) if last else 1
            self.numero_ecriture = f"ECR-{next_id:05d}"
        # Calcul du solde après écriture
        dernier = EcritureCompteGlobal.objects.order_by('id').last()
        solde_actuel = dernier.solde_apres if dernier else 0
        if self.type_ecriture == 'ENTREE':
            self.solde_apres = solde_actuel + self.montant
        else:
            self.solde_apres = solde_actuel - self.montant
        super().save(*args, **kwargs)

    @classmethod
    def get_solde_actuel(cls):
        dernier = cls.objects.order_by('id').last()
        return dernier.solde_apres if dernier else 0
