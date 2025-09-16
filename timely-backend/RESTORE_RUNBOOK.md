# Timely Events Platform - Restore Runbook

## 🚨 Emergency Recovery Procedures

**Target Recovery Time (RTO): ≤4 hours**

### Pre-Recovery Checklist

- [ ] Identify the failure type (database, media, application, server)
- [ ] Assess data loss scope
- [ ] Notify stakeholders
- [ ] Document incident details
- [ ] Prepare recovery environment

### 1. Database Recovery

#### From SQL Backup
```bash
# Stop application
sudo systemctl stop timely-events

# Restore database
psql -U postgres -c "DROP DATABASE IF EXISTS timely_events;"
psql -U postgres -c "CREATE DATABASE timely_events;"
psql -U postgres timely_events < /var/backups/timely/db_backup_YYYYMMDD_HHMMSS.sql

# Verify restoration
psql -U postgres timely_events -c "SELECT COUNT(*) FROM accounts_user;"

# Start application
sudo systemctl start timely-events
```

#### From Django Management Command
```bash
cd /path/to/timely-backend
source venv/bin/activate
python manage.py restore_database /var/backups/timely/db_backup_YYYYMMDD_HHMMSS.sql
```

### 2. Media Files Recovery

```bash
# Stop application
sudo systemctl stop timely-events

# Restore media files
cd /path/to/timely-backend
tar -xzf /var/backups/timely/media_backup_YYYYMMDD_HHMMSS.tar.gz

# Set proper permissions
chown -R www-data:www-data media/
chmod -R 755 media/

# Start application
sudo systemctl start timely-events
```

### 3. Full System Recovery

#### Complete Restore
```bash
# 1. Stop all services
sudo systemctl stop timely-events
sudo systemctl stop redis
sudo systemctl stop postgresql

# 2. Restore database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS timely_events;"
sudo -u postgres psql -c "CREATE DATABASE timely_events;"
sudo -u postgres psql timely_events < /var/backups/timely/db_backup_YYYYMMDD_HHMMSS.sql

# 3. Restore media files
cd /path/to/timely-backend
tar -xzf /var/backups/timely/media_backup_YYYYMMDD_HHMMSS.tar.gz

# 4. Restore environment
cp /var/backups/timely/env_backup_YYYYMMDD /path/to/timely-backend/.env

# 5. Run migrations (if needed)
python manage.py migrate

# 6. Collect static files
python manage.py collectstatic --noinput

# 7. Start services
sudo systemctl start postgresql
sudo systemctl start redis
sudo systemctl start timely-events
```

### 4. Verification Steps

#### Database Integrity
```bash
# Check database connection
python manage.py dbshell -c "SELECT 1;"

# Verify user count
python manage.py shell -c "from accounts.models import User; print(f'Users: {User.objects.count()}')"

# Check critical tables
python manage.py shell -c "
from events.models import Event
from tickets.models import TicketOrder
print(f'Events: {Event.objects.count()}')
print(f'Orders: {TicketOrder.objects.count()}')
"
```

#### Application Health
```bash
# Test API endpoints
curl -f http://localhost:8000/api/health/ || echo "API health check failed"

# Test WebSocket connection
curl -f http://localhost:8000/ws/ || echo "WebSocket check failed"

# Check logs
tail -f /var/log/timely-events.log
```

#### Media Files
```bash
# Check media directory
ls -la /path/to/timely-backend/media/

# Test file access
curl -f http://localhost:8000/media/test.jpg || echo "Media access failed"
```

### 5. Post-Recovery Tasks

- [ ] Verify all critical functionality
- [ ] Test user authentication
- [ ] Check payment processing
- [ ] Validate real-time features
- [ ] Monitor system performance
- [ ] Update incident documentation
- [ ] Notify stakeholders of recovery completion

### 6. Backup Verification

#### Check Backup Integrity
```bash
# Verify database backup
cd /var/backups/timely
sha256sum -c db_backup_YYYYMMDD_HHMMSS.sql.sha256

# Verify media backup
sha256sum -c media_backup_YYYYMMDD_HHMMSS.tar.gz.sha256
```

#### Test Backup Restoration
```bash
# Create test database
createdb timely_events_test

# Restore to test database
psql timely_events_test < /var/backups/timely/db_backup_YYYYMMDD_HHMMSS.sql

# Verify test restoration
psql timely_events_test -c "SELECT COUNT(*) FROM accounts_user;"
```

### 7. Disaster Recovery Scenarios

#### Scenario 1: Database Corruption
1. Stop application
2. Restore from latest backup
3. Run integrity checks
4. Start application
5. Monitor for issues

#### Scenario 2: Media Files Lost
1. Stop application
2. Restore media from backup
3. Set proper permissions
4. Start application
5. Verify file access

#### Scenario 3: Complete Server Failure
1. Provision new server
2. Install dependencies
3. Restore database
4. Restore media files
5. Configure application
6. Update DNS/load balancer
7. Start services

#### Scenario 4: Partial Data Loss
1. Identify affected data
2. Restore specific tables/records
3. Re-sync with external systems
4. Verify data consistency
5. Monitor for issues

### 8. Recovery Time Optimization

#### Pre-staged Recovery
- Keep recovery environment ready
- Pre-install dependencies
- Maintain recovery scripts
- Test recovery procedures regularly

#### Monitoring and Alerting
- Set up database monitoring
- Configure backup verification alerts
- Monitor disk space
- Track backup success/failure

#### Documentation
- Keep runbook updated
- Document recovery procedures
- Maintain contact information
- Record lessons learned

### 9. Contact Information

- **System Administrator**: admin@timelyevents.com
- **Database Administrator**: dba@timelyevents.com
- **Emergency Contact**: +1-555-0123
- **Escalation**: CTO@timelyevents.com

### 10. Recovery Checklist

- [ ] Incident identified and documented
- [ ] Recovery plan activated
- [ ] Database restored and verified
- [ ] Media files restored and verified
- [ ] Application started and tested
- [ ] All services operational
- [ ] Monitoring active
- [ ] Stakeholders notified
- [ ] Post-incident review scheduled

---

**Remember**: Always test your recovery procedures in a non-production environment first!
