from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_add_can_manage_users"),
    ]

    operations = [
        migrations.AddField(
            model_name="userrole",
            name="context_type",
            field=models.CharField(max_length=50, blank=True, help_text="Type of context (event, team, organization)"),
        ),
        migrations.AddField(
            model_name="userrole",
            name="context_id",
            field=models.PositiveIntegerField(null=True, blank=True, help_text="ID of the context object"),
        ),
    ]


