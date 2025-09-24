# Generated manually to add OrganizerApplication model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_auto_20250924_1202'),
    ]

    operations = [
        migrations.CreateModel(
            name='OrganizerApplication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')], db_index=True, default='PENDING', max_length=20)),
                ('reason', models.TextField(blank=True, help_text='Reason for application')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_applications', to='accounts.user')),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='organizer_applications', to='accounts.user', unique=True)),
            ],
            options={
                'verbose_name': 'Organizer Application',
                'verbose_name_plural': 'Organizer Applications',
                'ordering': ['-created_at'],
            },
        ),
    ]
