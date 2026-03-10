# ChronosAI Docker Image Management Makefile

.PHONY: help build push deploy clean test logs

# Default target
help:
	@echo "ChronosAI Docker Management Commands:"
	@echo ""
	@echo "Build Commands:"
	@echo "  build-backend     Build backend Docker image"
	@echo "  build-frontend    Build frontend Docker image"
	@echo "  build-all         Build all Docker images"
	@echo ""
	@echo "Push Commands:"
	@echo "  push-backend      Push backend image to registry"
	@echo "  push-frontend     Push frontend image to registry"
	@echo "  push-all          Push all images to registry"
	@echo ""
	@echo "Deploy Commands:"
	@echo "  deploy            Deploy with docker-compose"
	@echo "  deploy-prod       Deploy with production compose"
	@echo "  deploy-enhanced   Deploy with enhanced compose"
	@echo ""
	@echo "Management Commands:"
	@echo "  logs              Show application logs"
	@echo "  clean             Clean up containers and images"
	@echo "  test              Run tests"
	@echo "  dev               Start development environment"
	@echo "  stop              Stop all services"

# Configuration
REGISTRY ?= ghcr.io
NAMESPACE ?= johan-droid
BACKEND_IMAGE = $(REGISTRY)/$(NAMESPACE)/chronosai-backend
FRONTEND_IMAGE = $(REGISTRY)/$(NAMESPACE)/chronosai-frontend
TAG ?= latest

# Build Commands
build-backend:
	@echo "🔨 Building backend Docker image..."
	docker build -t $(BACKEND_IMAGE):$(TAG) ./backend
	@echo "✅ Backend image built: $(BACKEND_IMAGE):$(TAG)"

build-frontend:
	@echo "🔨 Building frontend Docker image..."
	docker build -t $(FRONTEND_IMAGE):$(TAG) ./frontend
	@echo "✅ Frontend image built: $(FRONTEND_IMAGE):$(TAG)"

build-all: build-backend build-frontend
	@echo "🎉 All images built successfully!"

# Push Commands
push-backend:
	@echo "📤 Pushing backend Docker image..."
	docker push $(BACKEND_IMAGE):$(TAG)
	@echo "✅ Backend image pushed: $(BACKEND_IMAGE):$(TAG)"

push-frontend:
	@echo "📤 Pushing frontend Docker image..."
	docker push $(FRONTEND_IMAGE):$(TAG)
	@echo "✅ Frontend image pushed: $(FRONTEND_IMAGE):$(TAG)"

push-all: push-backend push-frontend
	@echo "🎉 All images pushed successfully!"

# Deploy Commands
deploy:
	@echo "🚀 Deploying with docker-compose..."
	docker-compose up -d
	@echo "✅ Deployment complete!"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:8000"

deploy-prod:
	@echo "🚀 Deploying production environment..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production deployment complete!"

deploy-enhanced:
	@echo "🚀 Deploying enhanced environment..."
	docker-compose -f docker-compose-enhanced.yml up -d
	@echo "✅ Enhanced deployment complete!"

# Development Commands
dev:
	@echo "🛠️ Starting development environment..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
	@echo "✅ Development environment started!"

# Management Commands
logs:
	@echo "📋 Showing application logs..."
	docker-compose logs -f

logs-backend:
	@echo "📋 Backend logs..."
	docker-compose logs -f backend

logs-frontend:
	@echo "📋 Frontend logs..."
	docker-compose logs -f frontend

clean:
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Cleanup complete!"

clean-images:
	@echo "🧹 Cleaning up Docker images..."
	docker image prune -f
	docker rmi $(BACKEND_IMAGE):$(TAG) $(FRONTEND_IMAGE):$(TAG) 2>/dev/null || true
	@echo "✅ Image cleanup complete!"

# Test Commands
test:
	@echo "🧪 Running tests..."
	docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
	docker-compose -f docker-compose.test.yml down
	@echo "✅ Tests complete!"

test-backend:
	@echo "🧪 Running backend tests..."
	docker run --rm -v $(PWD)/backend:/app -w /app python:3.11-slim bash -c "pip install -r requirements.txt && python -m pytest"
	@echo "✅ Backend tests complete!"

test-frontend:
	@echo "🧪 Running frontend tests..."
	docker run --rm -v $(PWD)/frontend:/app -w /app node:18-slim bash -c "npm ci && npm test"
	@echo "✅ Frontend tests complete!"

# Stop Commands
stop:
	@echo "🛑 Stopping all services..."
	docker-compose down
	@echo "✅ Services stopped!"

stop-prod:
	@echo "🛑 Stopping production services..."
	docker-compose -f docker-compose.prod.yml down
	@echo "✅ Production services stopped!"

# Utility Commands
status:
	@echo "📊 Service status:"
	docker-compose ps

restart:
	@echo "🔄 Restarting services..."
	docker-compose restart
	@echo "✅ Services restarted!"

pull:
	@echo "📥 Pulling latest images..."
	docker-compose pull
	@echo "✅ Images pulled!"

pull-all:
	@echo "📥 Pulling all images..."
	docker pull $(BACKEND_IMAGE):$(TAG)
	docker pull $(FRONTEND_IMAGE):$(TAG)
	@echo "✅ All images pulled!"

# CI/CD Integration
ci-build:
	@echo "🔨 CI/CD Build Process..."
	$(MAKE) build-backend
	$(MAKE) build-frontend
	@echo "✅ CI/CD build complete!"

ci-deploy:
	@echo "🚀 CI/CD Deploy Process..."
	$(MAKE) pull-all
	$(MAKE) deploy
	@echo "✅ CI/CD deploy complete!"

# Version Management
tag:
	@echo "🏷️ Tagging images with version: $(TAG)"
	docker tag $(BACKEND_IMAGE):latest $(BACKEND_IMAGE):$(TAG)
	docker tag $(FRONTEND_IMAGE):latest $(FRONTEND_IMAGE):$(TAG)
	@echo "✅ Images tagged!"

# Health Check
health:
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:8000/api/v1/health || echo "❌ Backend health check failed"
	@curl -f http://localhost:3000/health || echo "❌ Frontend health check failed"

# Database Management
db-migrate:
	@echo "🗄️ Running database migrations..."
	docker-compose exec backend python -m alembic upgrade head
	@echo "✅ Migrations complete!"

db-reset:
	@echo "🗄️ Resetting database..."
	docker-compose down -v
	docker-compose up -d postgres
	sleep 5
	$(MAKE) db-migrate
	@echo "✅ Database reset complete!"

# Environment Setup
env-setup:
	@echo "⚙️ Setting up environment..."
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; echo "✅ Created backend/.env"; fi
	@if [ ! -f frontend/.env ]; then cp frontend/.env.example frontend/.env; echo "✅ Created frontend/.env"; fi
	@echo "⚠️ Please update the .env files with your configuration!"

# Quick Start
quick-start:
	@echo "🚀 Quick start ChronosAI..."
	$(MAKE) env-setup
	$(MAKE) pull-all
	$(MAKE) deploy
	@echo "🎉 ChronosAI is ready!"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:8000"
