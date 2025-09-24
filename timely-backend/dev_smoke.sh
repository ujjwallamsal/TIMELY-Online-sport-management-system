#!/usr/bin/env bash
set -e

# Activate backend virtual environment
source venv/bin/activate

export DJANGO_SETTINGS_MODULE=timely.settings
python manage.py check

# Create migrations with default values for non-nullable fields
echo "Creating migrations..."
python manage.py makemigrations accounts events venues sports teams registrations fixtures results --noinput

# Handle any migration issues
echo "Applying migrations..."
python manage.py migrate --noinput --run-syncdb

# Create superuser (ignore if already exists)
echo "Creating superuser..."
python manage.py createsuperuser --noinput --email admin@example.com --username admin || true

echo "Starting development server..."
python manage.py runserver 0.0.0.0:8000
