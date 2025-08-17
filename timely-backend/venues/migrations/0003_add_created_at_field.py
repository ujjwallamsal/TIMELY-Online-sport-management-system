
from django.db import migrations, models
from django.utils import timezone

class Migration(migrations.Migration):

    dependencies = [
        ("venues", "0002_alter_venue_address_alter_venue_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="venue",
            name="created_at",
            # One‑time default for existing rows; dropped afterward
            field=models.DateTimeField(auto_now_add=True, default=timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="venue",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, default=timezone.now),
            preserve_default=False,
        ),
    ]
