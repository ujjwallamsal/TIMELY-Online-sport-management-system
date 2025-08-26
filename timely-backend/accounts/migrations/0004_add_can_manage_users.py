# Generated manually to align DB with models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_create_user_role_table"),
    ]

    operations = [
        migrations.AddField(
            model_name="userrole",
            name="can_manage_users",
            field=models.BooleanField(default=False),
        ),
    ]


