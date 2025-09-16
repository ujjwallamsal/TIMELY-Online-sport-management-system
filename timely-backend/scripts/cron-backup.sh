#!/bin/bash
# Cron backup script for Timely Events Platform
# Run this script via cron for automated backups

# Configuration
BACKUP_DIR="/var/backups/timely"
RETENTION_DAYS=30
LOG_FILE="/var/log/timely-backup.log"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

log "Starting backup process"

# Change to project directory
cd /path/to/timely-backend

# Activate virtual environment
source venv/bin/activate

# Create database backup
log "Creating database backup"
python manage.py backup_database --output $BACKUP_DIR/db_backup_$DATE.sql

# Create media backup
log "Creating media backup"
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz media/

# Create settings backup
log "Creating settings backup"
cp .env $BACKUP_DIR/env_backup_$DATE

# Calculate checksums
log "Calculating checksums"
cd $BACKUP_DIR
sha256sum db_backup_$DATE.sql > db_backup_$DATE.sql.sha256
sha256sum media_backup_$DATE.tar.gz > media_backup_$DATE.tar.gz.sha256

# Clean up old backups
log "Cleaning up old backups"
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "media_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "env_backup_*" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.sha256" -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
log "Verifying backup integrity"
if sha256sum -c db_backup_$DATE.sql.sha256 > /dev/null 2>&1; then
    log "Database backup verified successfully"
else
    log "ERROR: Database backup verification failed"
    exit 1
fi

if sha256sum -c media_backup_$DATE.tar.gz.sha256 > /dev/null 2>&1; then
    log "Media backup verified successfully"
else
    log "ERROR: Media backup verification failed"
    exit 1
fi

log "Backup process completed successfully"

# Optional: Send notification email
# echo "Timely Events backup completed successfully at $(date)" | mail -s "Backup Success" admin@timelyevents.com

exit 0
