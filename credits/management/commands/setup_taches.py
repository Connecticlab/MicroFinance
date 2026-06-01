from django.core.management.base import BaseCommand
from django_celery_beat.models import PeriodicTask, CrontabSchedule


class Command(BaseCommand):
    help = 'Configure les tâches automatiques Celery Beat'

    def handle(self, *args, **kwargs):
        # Supprimer les anciennes tâches
        PeriodicTask.objects.filter(
            name__in=[
                'Pénalités de retard',
                'Mise à jour statuts crédits',
                'Calcul PAR',
                'Alertes J-3 échéances',
            ]
        ).delete()

        # Créer les schedules crontab
        minuit_05, _ = CrontabSchedule.objects.get_or_create(
            minute='5', hour='0', day_of_week='*',
            day_of_month='*', month_of_year='*',
        )
        minuit_10, _ = CrontabSchedule.objects.get_or_create(
            minute='10', hour='0', day_of_week='*',
            day_of_month='*', month_of_year='*',
        )
        une_heure, _ = CrontabSchedule.objects.get_or_create(
            minute='0', hour='1', day_of_week='*',
            day_of_month='*', month_of_year='*',
        )
        huit_heures, _ = CrontabSchedule.objects.get_or_create(
            minute='0', hour='8', day_of_week='*',
            day_of_month='*', month_of_year='*',
        )

        # Créer les tâches
        PeriodicTask.objects.create(
            crontab=minuit_05,
            name='Pénalités de retard',
            task='credits.tasks.appliquer_penalites',
        )
        PeriodicTask.objects.create(
            crontab=minuit_10,
            name='Mise à jour statuts crédits',
            task='credits.tasks.mettre_a_jour_statuts_credits',
        )
        PeriodicTask.objects.create(
            crontab=une_heure,
            name='Calcul PAR',
            task='credits.tasks.calculer_par',
        )
        PeriodicTask.objects.create(
            crontab=huit_heures,
            name='Alertes J-3 échéances',
            task='credits.tasks.envoyer_alertes_echeances',
        )

        self.stdout.write(self.style.SUCCESS(
            '✅ 4 tâches automatiques configurées avec succès'
        ))
