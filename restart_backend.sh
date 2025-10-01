#!/bin/bash

# TIMELY Backend Restart Script
# This script safely restarts the Django backend server

echo "🔄 Restarting TIMELY Backend..."

# Navigate to backend directory
cd "$(dirname "$0")/timely-backend" || exit 1

# Kill any existing Django servers
echo "📴 Stopping existing Django servers..."
pkill -f "manage.py runserver" 2>/dev/null

# Wait a moment for processes to terminate
sleep 2

# Activate virtual environment
echo "🔌 Activating virtual environment..."
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found! Please create it first:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Apply database migrations
echo "🗄️  Applying database migrations..."
python manage.py migrate --no-input

# Check for any issues
echo "🔍 Running system checks..."
python manage.py check --deploy

# Start the server
echo "🚀 Starting Django server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Server will be available at: http://127.0.0.1:8000"
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python manage.py runserver

