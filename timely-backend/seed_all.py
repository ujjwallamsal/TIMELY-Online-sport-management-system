#!/usr/bin/env python
"""
Comprehensive seeding script for Timely development environment.
Run this to populate the database with sample data.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timely.settings')
django.setup()

from django.core.management import call_command
from django.db import connection

def seed_all():
    """Run all seeding commands in the correct order."""
    print("🌱 Starting comprehensive seeding process...")
    
    try:
        # 1. Seed divisions first (events depend on them)
        print("\n📊 Seeding divisions...")
        call_command('seed_divisions')
        
        # 2. Seed events (results depend on them)
        print("\n🎯 Seeding events...")
        call_command('seed_events')
        
        # 3. Seed results (depends on events and teams)
        print("\n🏆 Seeding results...")
        call_command('seed_results')
        
        # 4. Seed users (if not already done)
        print("\n👥 Seeding users...")
        call_command('seed_users')
        
        print("\n✅ All seeding completed successfully!")
        print("\n📋 Sample data created:")
        print("   - Divisions (U18, U21, Open, Masters)")
        print("   - Events (Football, Basketball, Swimming, Tennis, Athletics)")
        print("   - Results (5 sample matches)")
        print("   - Users (Admin, Organizer, Athlete, Spectator)")
        print("\n🚀 You can now test the frontend with real data!")
        
    except Exception as e:
        print(f"\n❌ Seeding failed: {e}")
        print("Please check the error and try again.")
        return False
    
    return True

if __name__ == '__main__':
    success = seed_all()
    sys.exit(0 if success else 1)
