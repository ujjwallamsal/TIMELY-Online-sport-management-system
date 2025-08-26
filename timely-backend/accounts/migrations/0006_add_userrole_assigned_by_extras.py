from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_add_userrole_missing_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="userrole",
            name="assigned_by",
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assigned_roles", to="accounts.user"),
        ),
        migrations.AddField(
            model_name="userrole",
            name="assigned_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name="userrole",
            name="expires_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
    ]


