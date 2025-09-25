import re
import os
from typing import List, Tuple

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from django.apps import apps


DEMO_EMAIL_PATTERNS = [
    r"^archived\+.*@example\.local$",
    r"^newsignup\+.*@example\.com$",
]


def compile_patterns(patterns: List[str]) -> List[re.Pattern]:
    return [re.compile(p, re.IGNORECASE) for p in patterns]


def email_matches_demo_patterns(email: str, compiled: List[re.Pattern]) -> bool:
    return any(p.search(email or "") for p in compiled)


class Command(BaseCommand):
    help = "Delete demo/mock data (users and related content). Use --dry-run to preview."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview the deletions without making changes",
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        User = get_user_model()
        compiled = compile_patterns(DEMO_EMAIL_PATTERNS)

        self.stdout.write(self.style.WARNING("Scanning for demo data..."))

        users_qs = User.objects.all()
        demo_users = [u for u in users_qs if email_matches_demo_patterns(getattr(u, "email", ""), compiled)]

        # Related content (News, Page) authored by demo users
        News = apps.get_model("content", "News") if apps.is_installed("content") and apps.get_model("content", "News", require_ready=False) else None
        Page = apps.get_model("content", "Page") if apps.is_installed("content") and apps.get_model("content", "Page", require_ready=False) else None

        authored_news = []
        authored_pages = []
        if News:
            authored_news = list(News.objects.filter(author__in=demo_users))
        if Page and hasattr(Page, "author"):
            authored_pages = list(Page.objects.filter(author__in=demo_users))

        self.stdout.write(f"Users to delete: {len(demo_users)}")
        self.stdout.write(f"News to delete: {len(authored_news)}")
        if authored_pages:
            self.stdout.write(f"Pages to delete: {len(authored_pages)}")

        if dry_run:
            for u in demo_users[:10]:
                self.stdout.write(f"- {u.email}")
            if len(demo_users) > 10:
                self.stdout.write("... (truncated)")
            self.stdout.write(self.style.WARNING("Dry-run only. No changes made."))
            return

        with transaction.atomic():
            if authored_news:
                News.objects.filter(id__in=[n.id for n in authored_news]).delete()
            if authored_pages:
                Page.objects.filter(id__in=[p.id for p in authored_pages]).delete()
            for user in demo_users:
                user.delete()

        self.stdout.write(self.style.SUCCESS("Demo data purge completed."))


