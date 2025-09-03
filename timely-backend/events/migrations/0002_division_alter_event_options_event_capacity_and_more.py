# Generated manually for Events module

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0001_initial'),
    ]

    operations = [
        # This migration is referenced by other apps but doesn't need to do anything
        # since the models are already created in 0001_initial
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]