from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("registrations", "0002_rename_paid_registration_is_approved_and_more"),  # <-- keep your actual previous migration here
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # If this migration also renamed is_approved -> is_paid, keep it here:
        migrations.RenameField(
            model_name="registration",
            old_name="is_approved",
            new_name="is_paid",
        ),

        # 1) ADD user FIRST (nullable for now so it won't prompt)
        migrations.AddField(
            model_name="registration",
            name="user",
            field=models.ForeignKey(
                to=settings.AUTH_USER_MODEL,
                on_delete=models.deletion.CASCADE,
                related_name="registrations",
                null=True,
                blank=True,
            ),
        ),

        # 2) Remove old fields/constraints ONLY if they actually exist in your DB.
        # If any of these don't exist in your current schema, delete that operation.
        # Example cleanups (adjust/remove as needed):
        # migrations.RemoveConstraint(
        #     model_name="registration",
        #     name="uniq_event_team",
        # ),
        # migrations.RemoveConstraint(
        #     model_name="registration",
        #     name="uniq_event_athlete",
        # ),
        # migrations.RemoveField(
        #     model_name="registration",
        #     name="athlete",
        # ),
        # migrations.RemoveField(
        #     model_name="registration",
        #     name="team",
        # ),
        # migrations.RemoveField(
        #     model_name="registration",
        #     name="notes",
        # ),

        # 3) NOW it’s safe to set unique_together using user
        migrations.AlterUniqueTogether(
            name="registration",
            unique_together={("event", "user")},
        ),
    ]
