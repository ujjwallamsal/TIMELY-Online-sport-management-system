# Generated manually to fix default value issue

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('venues', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='VenueAvailabilitySlot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_datetime', models.DateTimeField(help_text='Slot start time')),
                ('end_datetime', models.DateTimeField(help_text='Slot end time')),
                ('status', models.CharField(choices=[('available', 'Available'), ('blocked', 'Blocked'), ('maintenance', 'Maintenance')], default='available', help_text='Availability status', max_length=20)),
                ('note', models.TextField(blank=True, help_text='Optional note about this slot')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('venue', models.ForeignKey(help_text='Associated venue', on_delete=django.db.models.deletion.CASCADE, related_name='availability_slots', to='venues.venue')),
            ],
            options={
                'ordering': ['start_datetime'],
            },
        ),
        migrations.RemoveField(
            model_name='venue',
            name='country',
        ),
        migrations.RemoveField(
            model_name='venue',
            name='indoor',
        ),
        migrations.RemoveField(
            model_name='venue',
            name='latitude',
        ),
        migrations.RemoveField(
            model_name='venue',
            name='longitude',
        ),
        migrations.RemoveField(
            model_name='venue',
            name='notes',
        ),
        migrations.AddField(
            model_name='venue',
            name='is_active',
            field=models.BooleanField(default=True, help_text='Whether this venue is available for use'),
        ),
        migrations.AddField(
            model_name='venue',
            name='postal_code',
            field=models.CharField(blank=True, help_text='Postal/ZIP code', max_length=20),
        ),
        migrations.AddField(
            model_name='venue',
            name='timezone',
            field=models.CharField(default='UTC', help_text='Timezone for this venue', max_length=64),
        ),
        migrations.AlterField(
            model_name='venue',
            name='address',
            field=models.CharField(blank=True, help_text='Street address', max_length=255),
        ),
        migrations.AlterField(
            model_name='venue',
            name='capacity',
            field=models.PositiveIntegerField(default=0, help_text='Maximum capacity (0 = unlimited)'),
        ),
        migrations.AlterField(
            model_name='venue',
            name='city',
            field=models.CharField(blank=True, help_text='City', max_length=100),
        ),
        migrations.AlterField(
            model_name='venue',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='venue',
            name='name',
            field=models.CharField(help_text='Venue name', max_length=200),
        ),
        migrations.AlterField(
            model_name='venue',
            name='state',
            field=models.CharField(blank=True, help_text='State/Province', max_length=100),
        ),
        migrations.AddIndex(
            model_name='venue',
            index=models.Index(fields=['name'], name='venues_venu_name_6dcdaa_idx'),
        ),
        migrations.AddIndex(
            model_name='venue',
            index=models.Index(fields=['city', 'state'], name='venues_venu_city_e9a0b9_idx'),
        ),
        migrations.AddIndex(
            model_name='venue',
            index=models.Index(fields=['is_active'], name='venues_venu_is_acti_954204_idx'),
        ),
        migrations.AddIndex(
            model_name='venueavailabilityslot',
            index=models.Index(fields=['venue', 'start_datetime'], name='venues_venu_venue_i_ce57d0_idx'),
        ),
        migrations.AddIndex(
            model_name='venueavailabilityslot',
            index=models.Index(fields=['venue', 'end_datetime'], name='venues_venu_venue_i_1e30f5_idx'),
        ),
    ]
