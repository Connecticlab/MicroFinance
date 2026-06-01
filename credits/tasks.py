from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task
def appliquer_penalites():
    """
    Tâche exécutée chaque jour à 00h05.
    Applique une pénalité de 2000 FCFA sur les échéances en retard.
    """
    from .models import LigneEcheancier
    from rapports.models import ParametresMicrofinance

    params = ParametresMicrofinance.get_instance()
    penalite = params.penalite_retard
    aujourd_hui = timezone.now().date()

    echeances_retard = LigneEcheancier.objects.filter(
        statut__in=['EN_ATTENTE', 'PARTIELLEMENT_PAYE'],
        date_echeance__lt=aujourd_hui
    )

    count = 0
    for echeance in echeances_retard:
        echeance.statut = 'EN_RETARD'
        echeance.penalite += penalite
        echeance.save()
        count += 1
        logger.info(f"Pénalité appliquée : {echeance.dossier.numero_dossier} — Échéance {echeance.numero_echeance}")

    logger.info(f"Pénalités appliquées : {count} échéances")
    return f"{count} pénalités appliquées"


@shared_task
def mettre_a_jour_statuts_credits():
    """
    Tâche exécutée chaque jour à 00h10.
    Met les crédits en EN_DEFAUT si toutes les échéances sont en retard.
    """
    from .models import DossierCredit

    credits_en_cours = DossierCredit.objects.filter(
        statut__in=['EN_COURS', 'DEBLOQUE']
    )

    count = 0
    for credit in credits_en_cours:
        echeances = credit.echeancier.all()
        if echeances.exists():
            toutes_retard = all(
                e.statut in ['EN_RETARD', 'PAYE']
                for e in echeances
            )
            nb_retard = echeances.filter(statut='EN_RETARD').count()
            if nb_retard >= 3:
                credit.statut = 'EN_DEFAUT'
                credit.save()
                count += 1
                # Créer automatiquement un dossier de recouvrement
                from recouvrement.models import DossierRecouvrement
                from core.models import Utilisateur
                if not hasattr(credit, 'dossier_recouvrement'):
                    superviseur = Utilisateur.objects.filter(
                        role='SUPERVISEUR', est_actif=True
                    ).first() or Utilisateur.objects.filter(is_staff=True).first()
                    if superviseur:
                        DossierRecouvrement.objects.create(
                            credit=credit,
                            montant_en_defaut=credit.montant_restant,
                            assigne_a=superviseur,
                            etape_actuelle='RELANCE_1',
                            statut='OUVERT',
                        )
                        logger.info(f"Dossier recouvrement créé pour {credit.numero_dossier}")

    logger.info(f"Crédits mis en défaut : {count}")
    return f"{count} crédits en défaut"


@shared_task
def calculer_par():
    """
    Tâche exécutée chaque jour à 01h00.
    Calcule les indicateurs PAR 30 et PAR 90.
    """
    from .models import DossierCredit, LigneEcheancier
    from django.db.models import Sum

    aujourd_hui = timezone.now().date()

    for jours in [30, 90]:
        echeances_retard = LigneEcheancier.objects.filter(
            statut='EN_RETARD',
            date_echeance__lte=aujourd_hui - timedelta(days=jours)
        )
        montant_retard = echeances_retard.aggregate(
            total=Sum('montant_echeance')
        )['total'] or 0

        total_portefeuille = DossierCredit.objects.filter(
            statut__in=['EN_COURS', 'EN_DEFAUT']
        ).aggregate(total=Sum('montant_restant'))['total'] or 0

        par = round((montant_retard / total_portefeuille * 100), 2) if total_portefeuille > 0 else 0
        logger.info(f"PAR {jours} : {par}%")

    return "PAR calculé"


@shared_task
def envoyer_alertes_echeances():
    """
    Tâche exécutée chaque jour à 08h00.
    Identifie les échéances dans 3 jours pour alerte.
    """
    from .models import LigneEcheancier

    dans_3_jours = timezone.now().date() + timedelta(days=3)
    echeances_proches = LigneEcheancier.objects.filter(
        statut='EN_ATTENTE',
        date_echeance=dans_3_jours
    ).select_related('dossier__membre')

    count = 0
    for echeance in echeances_proches:
        membre = echeance.dossier.membre
        logger.info(
            f"ALERTE J-3 : {membre.nom} {membre.prenom} "
            f"({membre.telephone}) — "
            f"Échéance {echeance.numero_echeance} le {echeance.date_echeance} "
            f"— {echeance.montant_echeance} FCFA"
        )
        count += 1

    return f"{count} alertes J-3 générées"
