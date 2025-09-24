#!/usr/bin/env python
import os
import sys
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timely.settings')
django.setup()

def create_gallery_tables():
    with connection.cursor() as cursor:
        # Create gallery_galleryalbum table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS gallery_galleryalbum (
                id BIGSERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                cover VARCHAR(100),
                is_public BOOLEAN NOT NULL DEFAULT TRUE,
                created_by_id BIGINT,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        """)
        print("Created gallery_galleryalbum table")
        
        # Create gallery_gallerymedia table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS gallery_gallerymedia (
                id BIGSERIAL PRIMARY KEY,
                album_id BIGINT NOT NULL,
                title VARCHAR(200) NOT NULL,
                media_type VARCHAR(20) NOT NULL DEFAULT 'image',
                image VARCHAR(100),
                video_url VARCHAR(200),
                is_public BOOLEAN NOT NULL DEFAULT TRUE,
                uploaded_by_id BIGINT,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        """)
        print("Created gallery_gallerymedia table")
        
        # Add foreign key constraints
        cursor.execute("""
            ALTER TABLE gallery_galleryalbum 
            ADD CONSTRAINT gallery_galleryalbum_created_by_id_fk 
            FOREIGN KEY (created_by_id) REFERENCES accounts_user(id) ON DELETE SET NULL
        """)
        
        cursor.execute("""
            ALTER TABLE gallery_gallerymedia 
            ADD CONSTRAINT gallery_gallerymedia_album_id_fk 
            FOREIGN KEY (album_id) REFERENCES gallery_galleryalbum(id) ON DELETE CASCADE
        """)
        
        cursor.execute("""
            ALTER TABLE gallery_gallerymedia 
            ADD CONSTRAINT gallery_gallerymedia_uploaded_by_id_fk 
            FOREIGN KEY (uploaded_by_id) REFERENCES accounts_user(id) ON DELETE SET NULL
        """)
        
        print("Added foreign key constraints")

if __name__ == '__main__':
    create_gallery_tables()
