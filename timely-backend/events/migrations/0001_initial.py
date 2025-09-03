# Generated manually for Events module

from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Event name', max_length=200)),
                ('sport', models.CharField(help_text='Sport type', max_length=100)),
                ('description', models.TextField(blank=True, help_text='Event description')),
                ('start_datetime', models.DateTimeField(help_text='Event start date and time')),
                ('end_datetime', models.DateTimeField(help_text='Event end date and time')),
                ('registration_open_at', models.DateTimeField(blank=True, help_text='When registration opens', null=True)),
                ('registration_close_at', models.DateTimeField(blank=True, help_text='When registration closes', null=True)),
                ('location', models.CharField(help_text='Event location', max_length=200)),
                ('capacity', models.PositiveIntegerField(default=0, help_text='Maximum participants', validators=[django.core.validators.MinValueValidator(0)])),
                ('fee_cents', models.PositiveIntegerField(default=0, help_text='Registration fee in cents', validators=[django.core.validators.MinValueValidator(0)])),
                ('lifecycle_status', models.CharField(choices=[('draft', 'Draft'), ('published', 'Published'), ('cancelled', 'Cancelled')], db_index=True, default='draft', help_text='Event lifecycle status', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(help_text='User who created this event', on_delete=models.deletion.CASCADE, related_name='created_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['start_datetime', 'created_at'],
            },
        ),
        migrations.CreateModel(
            name='Division',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Division name', max_length=100)),
                ('sort_order', models.PositiveIntegerField(default=0, help_text='Sort order for display')),
                ('event', models.ForeignKey(help_text='Parent event', on_delete=models.deletion.CASCADE, related_name='divisions', to='events.event')),
            ],
            options={
                'ordering': ['sort_order', 'name'],
            },
        ),
        migrations.AddIndex(
            model_name='event',
            index=models.Index(fields=['start_datetime'], name='events_even_start_d_8b4b8b_idx'),
        ),
        migrations.AddIndex(
            model_name='event',
            index=models.Index(fields=['lifecycle_status'], name='events_even_lifecyc_8b4b8b_idx'),
        ),
        migrations.AddIndex(
            model_name='event',
            index=models.Index(fields=['lifecycle_status', 'start_datetime'], name='events_even_lifecyc_start_d_8b4b8b_idx'),
        ),
        migrations.AddIndex(
            model_name='division',
            index=models.Index(fields=['event', 'sort_order'], name='events_divis_event__sort_o_8b4b8b_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='division',
            unique_together={('event', 'name')},
        ),
    ]
