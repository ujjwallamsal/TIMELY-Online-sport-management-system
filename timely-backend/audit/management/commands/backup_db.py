"""
Management command for database backup
"""
import os
import subprocess
import time
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from pathlib import Path


class Command(BaseCommand):
    """Create a database backup using pg_dump"""
    
    help = 'Create a timestamped database backup using pg_dump'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='/backups',
            help='Directory to store backup files (default: /backups)'
        )
        parser.add_argument(
            '--compress',
            action='store_true',
            help='Compress the backup file with gzip'
        )
        parser.add_argument(
            '--format',
            choices=['sql', 'custom', 'directory'],
            default='sql',
            help='Backup format (default: sql)'
        )
    
    def handle(self, *args, **options):
        """Execute the backup command"""
        output_dir = Path(options['output_dir'])
        compress = options['compress']
        format_type = options['format']
        
        # Create output directory if it doesn't exist
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Get database settings
        db_settings = settings.DATABASES['default']
        db_name = db_settings['NAME']
        db_user = db_settings['USER']
        db_host = db_settings['HOST']
        db_port = db_settings['PORT']
        
        # Build pg_dump command
        cmd = [
            'pg_dump',
            '--host', db_host,
            '--port', str(db_port),
            '--username', db_user,
            '--dbname', db_name,
            '--no-password',  # Use .pgpass or environment variables
            '--verbose',
        ]
        
        # Add format-specific options
        if format_type == 'custom':
            cmd.extend(['--format', 'custom'])
            file_extension = '.dump'
        elif format_type == 'directory':
            cmd.extend(['--format', 'directory'])
            file_extension = '_dir'
        else:  # sql
            file_extension = '.sql'
        
        # Set output file
        backup_filename = f"timely_backup_{timestamp}{file_extension}"
        backup_path = output_dir / backup_filename
        
        if format_type == 'directory':
            # For directory format, pg_dump creates a directory
            backup_path = output_dir / f"timely_backup_{timestamp}"
            cmd.extend(['--file', str(backup_path)])
        else:
            # For other formats, redirect output to file
            cmd.extend(['--file', str(backup_path)])
        
        # Add compression if requested
        if compress and format_type == 'sql':
            backup_path = backup_path.with_suffix('.sql.gz')
            cmd = ['gzip', '-c'] + cmd[1:]  # Remove pg_dump, add gzip
        
        try:
            self.stdout.write(f"Starting database backup...")
            self.stdout.write(f"Database: {db_name}")
            self.stdout.write(f"Output: {backup_path}")
            
            # Set environment variables for password
            env = os.environ.copy()
            if 'PGPASSWORD' not in env and 'DB_PASSWORD' in settings.DATABASES['default']:
                env['PGPASSWORD'] = settings.DATABASES['default']['PASSWORD']
            
            # Execute backup command
            start_time = time.time()
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                check=True
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            # Get file size
            if backup_path.exists():
                file_size = backup_path.stat().st_size
                file_size_mb = file_size / (1024 * 1024)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Backup completed successfully!\n"
                        f"File: {backup_path}\n"
                        f"Size: {file_size_mb:.2f} MB\n"
                        f"Duration: {duration:.2f} seconds"
                    )
                )
                
                # Log the backup action
                self._log_backup_action(backup_path, file_size, duration)
                
            else:
                raise CommandError("Backup file was not created")
                
        except subprocess.CalledProcessError as e:
            self.stdout.write(
                self.style.ERROR(f"Backup failed: {e.stderr}")
            )
            raise CommandError(f"Backup failed: {e.stderr}")
        except FileNotFoundError:
            raise CommandError(
                "pg_dump not found. Please ensure PostgreSQL client tools are installed."
            )
        except Exception as e:
            raise CommandError(f"Unexpected error: {str(e)}")
    
    def _log_backup_action(self, backup_path, file_size, duration):
        """Log the backup action to audit log"""
        try:
            from audit.models import AuditLog
            
            AuditLog.log_action(
                actor=None,  # System action
                action=AuditLog.ActionType.SYSTEM_BACKUP,
                target_type='Database',
                target_id='timely_db',
                meta={
                    'backup_file': str(backup_path),
                    'file_size_bytes': file_size,
                    'file_size_mb': round(file_size / (1024 * 1024), 2),
                    'duration_seconds': round(duration, 2),
                }
            )
        except Exception as e:
            # Don't fail the backup if logging fails
            self.stdout.write(
                self.style.WARNING(f"Could not log backup action: {e}")
            )
