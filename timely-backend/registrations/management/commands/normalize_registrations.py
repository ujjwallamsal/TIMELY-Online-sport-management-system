from django.core.management.base import BaseCommand
from django.db import transaction

from registrations.models import Registration


class Command(BaseCommand):
    help = "Normalize registrations to satisfy XOR constraint between applicant_user and applicant_team, migrating legacy fields."

    def handle(self, *args, **options):
        fixed = 0
        with transaction.atomic():
            for reg in Registration.objects.select_for_update().all():
                original = (reg.applicant_user, reg.applicant_team, reg.applicant, reg.team, reg.type)

                # Migrate legacy fields into the new fields based on type
                if reg.type == Registration.Type.ATHLETE:
                    if reg.applicant_user is None and reg.applicant is not None:
                        reg.applicant_user = reg.applicant
                    reg.applicant_team = None
                elif reg.type == Registration.Type.TEAM:
                    if reg.applicant_team is None and reg.team is not None:
                        reg.applicant_team = reg.team
                    reg.applicant_user = None

                # If still invalid, prefer non-legacy if present, else fallback
                if bool(reg.applicant_user) == bool(reg.applicant_team):
                    if reg.applicant_user and reg.applicant_team:
                        # Prefer field matching type
                        if reg.type == Registration.Type.ATHLETE:
                            reg.applicant_team = None
                        else:
                            reg.applicant_user = None
                    else:
                        # Neither present; try legacy
                        if reg.type == Registration.Type.ATHLETE and reg.applicant:
                            reg.applicant_user = reg.applicant
                        elif reg.type == Registration.Type.TEAM and reg.team:
                            reg.applicant_team = reg.team

                # Clear legacy fields after migration
                reg.applicant = None
                reg.team = None

                # If changed and valid, save
                if (reg.applicant_user, reg.applicant_team, reg.applicant, reg.team, reg.type) != original:
                    # Only save if valid or we'll let DB constraint fail
                    if bool(reg.applicant_user) != bool(reg.applicant_team):
                        reg.save(update_fields=[
                            'applicant_user', 'applicant_team', 'applicant', 'team'
                        ])
                        fixed += 1

        self.stdout.write(self.style.SUCCESS(f"Normalized {fixed} registration(s)."))


