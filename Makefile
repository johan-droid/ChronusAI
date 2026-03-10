# ChronosAI Makefile
# Convenient commands for development and deployment

.PHONY: help setup dev build test start stop logs clean deploy health

# Default target
help:
	@echo "ChronosAI Development Commands"
	@echo ""
	@echo "Setup & Development:"
	@echo "  make setup          - Setup development environment"
	@echo "  make dev            - Start development servers"
	@echo "  make build          - Build all Docker images"
	@echo "  make test           - Run all tests"
	@echo "  make test-backend   - Run backend tests only"
	@echo "  make test-frontend  - Run frontend tests only"
	@echo "  make test-e2e       - Run E2E tests"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make start          - Start all services"
	@echo "  make stop           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - Show logs for all services"
	@echo "  make logs-backend   - Show backend logs"
	@echo "  make logs-frontend  - Show frontend logs"
	@echo "  make clean          - Clean up Docker resources"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-staging   - Deploy to staging"
	@echo "  make deploy-prod      - Deploy to production"
	@echo "  make health           - Check service health"
	@echo ""
	@echo "Utilities:"
	@echo "  make lint            - Run linting for both frontend and backend"
	@echo "  make format          - Format code"
	@echo "  make db-migrate      - Run database migrations"
	@echo "  make db-seed         - Seed database with sample data"

# Setup development environment
setup:
	@echo "Setting up development environment..."
	./deploy.sh setup development
	@echo "Environment setup complete!"

# Start development servers
dev:
	@echo "Starting development servers..."
	docker-compose -f docker-compose-enhanced.yml up --build
	@echo "Development servers started!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

# Build Docker images
build:
	@echo "Building Docker images..."
	./deploy.sh build all
	@echo "Build complete!"

# Run tests
test:
	@echo "Running all tests..."
	./deploy.sh test all
	@echo "All tests completed!"

test-backend:
	@echo "Running backend tests..."
	./deploy.sh test backend

test-frontend:
	@echo "Running frontend tests..."
	./deploy.sh test frontend

test-e2e:
	@echo "Running E2E tests..."
	./deploy.sh test e2e

# Docker management
start:
	@echo "Starting all services..."
	./deploy.sh start all
	@echo "Services started!"

stop:
	@echo "Stopping all services..."
	./deploy.sh stop all
	@echo "Services stopped!"

restart: stop start

# Logs
logs:
	@echo "Showing logs for all services..."
	./deploy.sh logs all

logs-backend:
	@echo "Showing backend logs..."
	./deploy.sh logs backend

logs-frontend:
	@echo "Showing frontend logs..."
	./deploy.sh logs frontend

logs-follow:
	@echo "Following logs for all services..."
	./deploy.sh logs all follow

# Cleanup
clean:
	@echo "Cleaning up Docker resources..."
	./deploy.sh cleanup
	@echo "Cleanup complete!"

clean-full:
	@echo "Full cleanup (including volumes)..."
	docker-compose down -v
	docker system prune -f
	@echo "Full cleanup complete!"

# Deployment
deploy-staging:
	@echo "Deploying to staging..."
	./deploy.sh deploy staging
	@echo "Staging deployment complete!"

deploy-prod:
	@echo "Deploying to production..."
	./deploy.sh deploy production
	@echo "Production deployment complete!"

# Health checks
health:
	@echo "Checking service health..."
	./deploy.sh health backend
	./deploy.sh health frontend
	@echo "Health checks complete!"

# Code quality
lint:
	@echo "Running linting..."
	@echo "Backend linting..."
	cd backend && ruff check app
	@echo "Frontend linting..."
	cd frontend && npm run lint
	@echo "Linting complete!"

format:
	@echo "Formatting code..."
	@echo "Backend formatting..."
	cd backend && ruff format app
	@echo "Frontend formatting..."
	cd frontend && npm run format
	@echo "Code formatted!"

# Database operations
db-migrate:
	@echo "Running database migrations..."
	docker-compose exec backend alembic upgrade head
	@echo "Migrations complete!"

db-seed:
	@echo "Seeding database..."
	docker-compose exec backend python -m app.scripts.seed_data
	@echo "Database seeded!"

db-reset:
	@echo "Resetting database..."
	docker-compose exec backend alembic downgrade base
	docker-compose exec backend alembic upgrade head
	@echo "Database reset complete!"

# Development utilities
install-deps:
	@echo "Installing dependencies..."
	@echo "Backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Frontend dependencies..."
	cd frontend && npm install
	@echo "Dependencies installed!"

update-deps:
	@echo "Updating dependencies..."
	@echo "Backend dependencies..."
	cd backend && pip install --upgrade -r requirements.txt
	@echo "Frontend dependencies..."
	cd frontend && npm update
	@echo "Dependencies updated!"

# Security
security-scan:
	@echo "Running security scans..."
	@echo "Backend security scan..."
	cd backend && safety check -r requirements.txt
	@echo "Frontend security scan..."
	cd frontend && npm audit
	@echo "Security scans complete!"

# Performance
perf-test:
	@echo "Running performance tests..."
	@echo "Backend performance tests..."
	cd backend && pytest tests/performance/ -v
	@echo "Performance tests complete!"

# Documentation
docs:
	@echo "Generating documentation..."
	@echo "Backend API docs..."
	cd backend && python -m app.scripts.generate_docs
	@echo "Documentation generated!"

# Quick development shortcuts
quick-start: setup build start
	@echo "Quick start complete!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:8000"

quick-test: lint test
	@echo "Quick test complete!"

quick-deploy: lint test build deploy-staging
	@echo "Quick deploy complete!"

# CI/CD helpers
ci-test:
	@echo "Running CI tests..."
	./deploy.sh setup test
	./deploy.sh test all --include-e2e
	@echo "CI tests complete!"

ci-build:
	@echo "Running CI build..."
	./deploy.sh setup production
	./deploy.sh build all
	@echo "CI build complete!"

# Monitoring
monitor:
	@echo "Starting monitoring stack..."
	docker-compose -f docker-compose-enhanced.yml --profile monitoring up -d
	@echo "Monitoring started!"
	@echo "Grafana: http://localhost:3001"
	@echo "Prometheus: http://localhost:9090"

# Backup
backup:
	@echo "Creating backup..."
	docker-compose exec backend python -m app.scripts.backup
	@echo "Backup complete!"

# Restore
restore:
	@echo "Restoring from backup..."
	docker-compose exec backend python -m app.scripts.restore
	@echo "Restore complete!"
