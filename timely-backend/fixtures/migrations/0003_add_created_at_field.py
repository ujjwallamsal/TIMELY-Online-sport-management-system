# fixtures/migrations/0003_add_created_at_field.py
from django.db import migrations, models
from django.utils import timezone

class Migration(migrations.Migration):

    dependencies = [
        ('fixtures', '0002_remove_match_round_name_remove_match_status_and_more'),

    ]

    operations = [
        migrations.AddField(
            model_name="match",
            name="created_at",
            # one-time default for existing rows; dropped after migration
            field=models.DateTimeField(auto_now_add=True, default=timezone.now),
            preserve_default=False,
        ),
    ]
