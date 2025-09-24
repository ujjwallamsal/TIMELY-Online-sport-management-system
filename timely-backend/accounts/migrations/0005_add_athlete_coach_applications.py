# Generated manually for athlete and coach applications

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_remove_auditlog_user_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='AthleteApplication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')], db_index=True, default='PENDING', max_length=20)),
                ('date_of_birth', models.DateField(help_text='Date of birth for age verification')),
                ('sports', models.JSONField(default=list, help_text='List of sports the athlete participates in')),
                ('id_document', models.FileField(help_text='Government-issued ID document', upload_to='athlete_documents/id/')),
                ('medical_clearance', models.FileField(help_text='Medical clearance certificate', upload_to='athlete_documents/medical/')),
                ('reason', models.TextField(blank=True, help_text='Reason for application')),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('reviewed_by', models.ForeignKey(blank=True, limit_choices_to={'is_staff': True}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_athlete_applications', to=settings.AUTH_USER_MODEL)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='athlete_application', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Athlete Application',
                'verbose_name_plural': 'Athlete Applications',
                'db_table': 'accounts_athlete_application',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CoachApplication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')], db_index=True, default='PENDING', max_length=20)),
                ('sports', models.JSONField(default=list, help_text='List of sports the coach can teach')),
                ('team_preference', models.CharField(blank=True, help_text='Preferred team or organization to coach', max_length=255)),
                ('coaching_certificate', models.FileField(blank=True, help_text='Coaching certificate or license', null=True, upload_to='coach_documents/certificates/')),
                ('resume', models.FileField(blank=True, help_text='Coaching resume or CV', null=True, upload_to='coach_documents/resumes/')),
                ('reason', models.TextField(blank=True, help_text='Reason for application')),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('reviewed_by', models.ForeignKey(blank=True, limit_choices_to={'is_staff': True}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_coach_applications', to=settings.AUTH_USER_MODEL)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='coach_application', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Coach Application',
                'verbose_name_plural': 'Coach Applications',
                'db_table': 'accounts_coach_application',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='coachapplication',
            index=models.Index(fields=['status'], name='accounts_co_status_1a2b3c_idx'),
        ),
        migrations.AddIndex(
            model_name='coachapplication',
            index=models.Index(fields=['user', 'status'], name='accounts_co_user_id_2b3c4d_idx'),
        ),
        migrations.AddIndex(
            model_name='coachapplication',
            index=models.Index(fields=['created_at'], name='accounts_co_created_3c4d5e_idx'),
        ),
        migrations.AddIndex(
            model_name='athleteapplication',
            index=models.Index(fields=['status'], name='accounts_at_status_4d5e6f_idx'),
        ),
        migrations.AddIndex(
            model_name='athleteapplication',
            index=models.Index(fields=['user', 'status'], name='accounts_at_user_id_5e6f7g_idx'),
        ),
        migrations.AddIndex(
            model_name='athleteapplication',
            index=models.Index(fields=['created_at'], name='accounts_at_created_6f7g8h_idx'),
        ),
    ]
