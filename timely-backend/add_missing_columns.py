#!/usr/bin/env python
import os
import sys
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timely.settings')
django.setup()

def add_missing_columns():
    with connection.cursor() as cursor:
        # Check if content_news table exists and what columns it has
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'content_news'
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        print(f"Existing columns in content_news: {existing_columns}")
        
        # Add missing columns if they don't exist
        if 'slug' not in existing_columns:
            cursor.execute("ALTER TABLE content_news ADD COLUMN slug VARCHAR(200)")
            print("Added slug column")
        
        if 'excerpt' not in existing_columns:
            cursor.execute("ALTER TABLE content_news ADD COLUMN excerpt TEXT")
            print("Added excerpt column")
            
        if 'image' not in existing_columns:
            cursor.execute("ALTER TABLE content_news ADD COLUMN image VARCHAR(100)")
            print("Added image column")
            
        if 'is_published' not in existing_columns:
            cursor.execute("ALTER TABLE content_news ADD COLUMN is_published BOOLEAN DEFAULT FALSE")
            print("Added is_published column")
            
        if 'published_at' not in existing_columns:
            cursor.execute("ALTER TABLE content_news ADD COLUMN published_at TIMESTAMP WITH TIME ZONE")
            print("Added published_at column")
            
        if 'publish_at' not in existing_columns:
            cursor.execute("ALTER TABLE content_news ADD COLUMN publish_at TIMESTAMP WITH TIME ZONE")
            print("Added publish_at column")
            
        if 'seo_title' not in existing_columns:
            cursor.execute("ALTER TABLE content_news ADD COLUMN seo_title VARCHAR(60)")
            print("Added seo_title column")
            
        if 'seo_description' not in existing_columns:
            cursor.execute("ALTER TABLE content_news ADD COLUMN seo_description VARCHAR(160)")
            print("Added seo_description column")
            
        if 'author_id' not in existing_columns:
            cursor.execute("ALTER TABLE content_news ADD COLUMN author_id BIGINT")
            print("Added author_id column")
            
        if 'created_at' not in existing_columns:
            cursor.execute("ALTER TABLE content_news ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()")
            print("Added created_at column")
            
        if 'updated_at' not in existing_columns:
            cursor.execute("ALTER TABLE content_news ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()")
            print("Added updated_at column")

if __name__ == '__main__':
    add_missing_columns()
