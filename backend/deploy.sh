#!/bin/bash

# ChronosAI Backend Deployment Script for Render

echo "🚀 Starting ChronosAI Backend Deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
alembic upgrade head

echo "✅ Deployment complete!"
