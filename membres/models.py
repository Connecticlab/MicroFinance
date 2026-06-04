from django.db import models
from django.core.validators import RegexValidator

class Membre(models.Model):

    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('APPROUVE', 'Approuvé'),
        ('REJETE', 'Rejeté'),
        ('ACTIF', 'Actif'),
        ('SUSPENDU', 'Suspendu'),
        ('EXCLU', 'Exclu'),
    ]

    SEXE_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    ]

    TYPE_PIECE_CHOICES = [
        ('CNI', "Carte Nationale d'Identité"),
        ('PASSEPORT', 'Passeport'),
        ('PERMIS', 'Permis de conduire'),
    ]

    # Identité
    numero_membre = models.CharField(max_length=20, unique=True, editable=False)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES)
    date_naissance = models.DateField()
    lieu_naissance = models.CharField(max_length=100)

    # Pièce d'identité
    type_piece = models.CharField(max_length=20, choices=TYPE_PIECE_CHOICES)
    numero_piece = models.CharField(max_length=50, unique=True)
    date_expiration_piece = models.DateField()

    # Contact
    telephone = models.CharField(
        max_length=20,
        validators=[RegexValidator(r'^\+?[\d\s\-]{8,20}$', 'Numéro invalide')]
    )
    adresse = models.TextField()
    email = models.EmailField(blank=True)

    # Activité économique
    profession = models.CharField(max_length=100)
    secteur_activite = models.CharField(max_length=100)
    revenu_mensuel_estime = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )

    # Adhésion
    date_adhesion = models.DateField(auto_now_add=True)
    date_approbation = models.DateField(null=True, blank=True)
    date_paiement_frais = models.DateField(null=True, blank=True)
    frais_adhesion = models.DecimalField(
        max_digits=10, decimal_places=2, default=5000
    )
    frais_adhesion_paye = models.BooleanField(default=False)
    mode_paiement_frais = models.CharField(
        max_length=20,
        choices=[('ESPECES', 'Espèces'), ('MOBILE_MONEY', 'Mobile Money')],
        blank=True
    )
    approuve_par = models.ForeignKey(
        'core.Utilisateur', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='membres_approuves'
    )
    motif_rejet = models.TextField(blank=True)
    statut = models.CharField(
        max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE'
    )

    # Bénéficiaire en cas de décès
    beneficiaire_nom = models.CharField(max_length=200, blank=True)
    beneficiaire_telephone = models.CharField(max_length=20, blank=True)
    beneficiaire_lien = models.CharField(max_length=50, blank=True)

    # Documents justificatifs
    copie_piece_identite = models.FileField(
        upload_to='membres/pieces_identite/',
        verbose_name="Copie pièce d'identité (légalisée)"
    )
    justificatif_domicile = models.FileField(
        upload_to='membres/justificatifs_domicile/',
        verbose_name="Justificatif de domicile"
    )

    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Membre'
        verbose_name_plural = 'Membres'
        ordering = ['-date_adhesion']

    def __str__(self):
        return f"{self.numero_membre} — {self.nom} {self.prenom}"

    def save(self, *args, **kwargs):
        if not self.numero_membre:
            last = Membre.objects.order_by('id').last()
            next_id = (last.id + 1) if last else 1
            self.numero_membre = f"MBR-{next_id:05d}"
        super().save(*args, **kwargs)

    @property
    def nom_complet(self):
        return f"{self.nom} {self.prenom}"

    @property
    def a_credit_actif(self):
        return self.dossiers_credit.filter(
            statut__in=['SOUMIS', 'EN_ETUDE', 'APPROUVE', 'DEBLOQUE', 'EN_COURS']
        ).exists()
