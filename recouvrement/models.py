from django.db import models
from credits.models import DossierCredit
from core.models import Utilisateur

class DossierRecouvrement(models.Model):

    STATUT_CHOICES = [
        ('OUVERT', 'Ouvert'),
        ('EN_COURS', 'En cours'),
        ('RESOLU', 'Résolu'),
        ('PERTE', 'Passé en perte'),
    ]

    ETAPE_CHOICES = [
        ('RELANCE_1', 'Relance amiable (J+7)'),
        ('RELANCE_2', 'Mise en demeure (J+30)'),
        ('RELANCE_3', 'Intervention superviseur (J+60)'),
        ('RELANCE_4', 'Procédure légale (J+90)'),
    ]

    # Identification
    numero_dossier = models.CharField(max_length=20, unique=True, editable=False)
    credit = models.OneToOneField(
        DossierCredit,
        on_delete=models.PROTECT,
        related_name='dossier_recouvrement'
    )

    # Suivi
    etape_actuelle = models.CharField(
        max_length=20,
        choices=ETAPE_CHOICES,
        default='RELANCE_1'
    )
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='OUVERT'
    )

    # Montants
    montant_en_defaut = models.DecimalField(max_digits=12, decimal_places=2)
    montant_recouvre = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )

    # Dates
    date_ouverture = models.DateField(auto_now_add=True)
    date_resolution = models.DateField(null=True, blank=True)

    # Responsable
    assigne_a = models.ForeignKey(
        Utilisateur,
        on_delete=models.PROTECT,
        related_name='dossiers_recouvrement'
    )

    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Dossier de Recouvrement'
        verbose_name_plural = 'Dossiers de Recouvrement'
        ordering = ['-date_ouverture']

    def __str__(self):
        return f"{self.numero_dossier} — {self.credit.membre.nom_complet}"

    def save(self, *args, **kwargs):
        if not self.numero_dossier:
            last = DossierRecouvrement.objects.order_by('id').last()
            next_id = (last.id + 1) if last else 1
            self.numero_dossier = f"REC-{next_id:05d}"
        super().save(*args, **kwargs)

    @property
    def montant_restant(self):
        return self.montant_en_defaut - self.montant_recouvre


class ActionRecouvrement(models.Model):

    TYPE_CHOICES = [
        ('APPEL', 'Appel téléphonique'),
        ('SMS', 'SMS'),
        ('VISITE', 'Visite domicile'),
        ('COURRIER', 'Courrier'),
        ('MISE_EN_DEMEURE', 'Mise en demeure'),
        ('AUTRE', 'Autre'),
    ]

    RESULTAT_CHOICES = [
        ('SANS_REPONSE', 'Sans réponse'),
        ('PROMESSE_PAIEMENT', 'Promesse de paiement'),
        ('PAIEMENT_PARTIEL', 'Paiement partiel'),
        ('PAIEMENT_TOTAL', 'Paiement total'),
        ('REFUSE', 'Refus de paiement'),
    ]

    dossier = models.ForeignKey(
        DossierRecouvrement,
        on_delete=models.CASCADE,
        related_name='actions'
    )
    type_action = models.CharField(max_length=20, choices=TYPE_CHOICES)
    date_action = models.DateField()
    resultat = models.CharField(max_length=25, choices=RESULTAT_CHOICES)
    effectuee_par = models.ForeignKey(
        Utilisateur,
        on_delete=models.PROTECT,
        related_name='actions_recouvrement'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Action de Recouvrement"
        verbose_name_plural = "Actions de Recouvrement"
        ordering = ['-date_action']

    def __str__(self):
        return f"{self.dossier.numero_dossier} — {self.get_type_action_display()} ({self.date_action})"
