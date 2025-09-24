from django.db import migrations, models


def normalize_registration_applicants(apps, schema_editor):
    Registration = apps.get_model("registrations", "Registration")
    # Use .all() iteration in chunks to avoid large transactions; DB is small here.
    for reg in Registration.objects.all().iterator():
        has_user = bool(getattr(reg, "applicant_user_id", None)) or bool(getattr(reg, "applicant_id", None))
        has_team = bool(getattr(reg, "applicant_team_id", None)) or bool(getattr(reg, "team_id", None))

        # Migrate legacy into new fields if missing
        if not getattr(reg, "applicant_user_id", None) and getattr(reg, "applicant_id", None):
            reg.applicant_user_id = reg.applicant_id
        if not getattr(reg, "applicant_team_id", None) and getattr(reg, "team_id", None):
            reg.applicant_team_id = reg.team_id

        # Decide type and clear conflicting fields
        if reg.type == "ATHLETE" or (has_user and not has_team):
            reg.type = "ATHLETE"
            reg.applicant_team_id = None
        elif reg.type == "TEAM" or (has_team and not has_user):
            reg.type = "TEAM"
            reg.applicant_user_id = None
        else:
            # Neither or both -> treat as spectator to satisfy new constraint
            reg.type = "SPECTATOR"
            reg.applicant_user_id = None
            reg.applicant_team_id = None

        # Clear legacy fields
        reg.applicant_id = None
        reg.team_id = None
        reg.save(update_fields=[
            "type", "applicant_user_id", "applicant_team_id", "applicant_id", "team_id"
        ])


class Migration(migrations.Migration):

    dependencies = [
        ("registrations", "0006_rename_registratio_applica_2a1b2c_idx_registratio_applica_cc66c0_idx_and_more"),
    ]

    operations = [
        # Normalize existing rows so the new constraint can be applied cleanly
        migrations.RunPython(normalize_registration_applicants, migrations.RunPython.noop),
        # Add/replace constraint with spectator support. If an older constraint exists
        # with the same name, most databases will replace it; if not present, this simply adds it.
        migrations.AddConstraint(
            model_name="registration",
            constraint=models.CheckConstraint(
                name="exactly_one_applicant",
                check=(
                    # Athlete: has user and not team
                    (
                        models.Q(type="ATHLETE")
                        & models.Q(applicant_user__isnull=False)
                        & models.Q(applicant_team__isnull=True)
                    )
                    |
                    # Team: has team and not user
                    (
                        models.Q(type="TEAM")
                        & models.Q(applicant_user__isnull=True)
                        & models.Q(applicant_team__isnull=False)
                    )
                    |
                    # Spectator: neither user nor team
                    (
                        models.Q(type="SPECTATOR")
                        & models.Q(applicant_user__isnull=True)
                        & models.Q(applicant_team__isnull=True)
                    )
                ),
            ),
        ),
    ]


