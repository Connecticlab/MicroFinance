#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/snak/backups"
mkdir -p $BACKUP_DIR

# Sauvegarde base de données
PGPASSWORD="Snak@1704##" pg_dump -h 127.0.0.1 -U microfinance_user microfinance_db > $BACKUP_DIR/db_$DATE.sql

# Sauvegarde fichiers media
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /home/snak/microfinance/media/

# Supprimer les sauvegardes de plus de 30 jours
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Sauvegarde terminée : $DATE"
