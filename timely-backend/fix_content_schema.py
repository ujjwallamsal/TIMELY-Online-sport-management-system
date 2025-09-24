#!/usr/bin/env python
import os
import sys
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timely.settings')
django.setup()

def fix_content_schema():
    with connection.cursor() as cursor:
        # Drop the old published column and rename is_published to published
        cursor.execute("ALTER TABLE content_news DROP COLUMN IF EXISTS published")
        cursor.execute("ALTER TABLE content_news ALTER COLUMN is_published SET NOT NULL")
        cursor.execute("ALTER TABLE content_news ALTER COLUMN is_published SET DEFAULT FALSE")
        print("Fixed content_news schema")

if __name__ == '__main__':
    fix_content_schema()
