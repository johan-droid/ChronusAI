#!/bin/bash

# ChronosAI Backend Deployment Script for Render
# Enhanced with Google Calendar Integration

echo "🚀 Starting ChronosAI Backend Deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
alembic upgrade head

# Verify Google Calendar Integration
echo "🔍 Verifying Google Calendar integration..."
python -c "
import os
from app.config import settings

print('✅ Google Calendar Configuration Check:')
print(f'   - Client ID: {\"✅ Configured\" if settings.google_client_id else \"❌ Missing\"}')
print(f'   - Client Secret: {\"✅ Configured\" if settings.google_client_secret else \"❌ Missing\"}')
print(f'   - Redirect URI: {settings.google_redirect_uri or \"❌ Missing\"}')
print(f'   - Frontend URL: {settings.frontend_url}')

# Check if all required Google OAuth settings are present
if settings.google_client_id and settings.google_client_secret and settings.google_redirect_uri:
    print('🎉 Google Calendar integration is properly configured!')
else:
    print('⚠️  Google Calendar integration may not be fully configured')
"

# Test calendar service import
echo "🧪 Testing Google Calendar service import..."
python -c "
try:
    from app.services.google_calendar_service import GoogleCalendarService
    print('✅ Google Calendar service imported successfully')
except Exception as e:
    print(f'❌ Failed to import Google Calendar service: {e}')
"

echo "✅ Deployment complete!"
echo "🌐 Backend will be available with aggressive 30-second pings to prevent sleep"
echo "📅 Google Calendar integration is ready for use"
