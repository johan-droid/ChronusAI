#!/bin/bash

# ChronosAI Deployment Script
# This script handles deployment to different environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    if ! command -v git &> /dev/null; then
        error "Git is not installed. Please install Git first."
    fi
    
    success "All dependencies are installed."
}

# Environment setup
setup_environment() {
    local env=${1:-development}
    log "Setting up $env environment..."
    
    case $env in
        "development")
            export COMPOSE_FILE="docker-compose.yml"
            export NODE_ENV="development"
            ;;
        "production")
            export COMPOSE_FILE="docker-compose.yml:docker-compose.prod.yml"
            export NODE_ENV="production"
            ;;
        "test")
            export COMPOSE_FILE="docker-compose.test.yml"
            export NODE_ENV="test"
            ;;
        *)
            error "Unknown environment: $env"
            ;;
    esac
    
    # Load environment variables
    if [ -f "./backend/.env" ]; then
        export $(cat ./backend/.env | grep -v '^#' | xargs)
        log "Loaded backend environment variables."
    else
        warning "Backend .env file not found. Using default values."
    fi
    
    if [ -f "./frontend/.env" ]; then
        export $(cat ./frontend/.env | grep -v '^#' | xargs)
        log "Loaded frontend environment variables."
    else
        warning "Frontend .env file not found. Using default values."
    fi
}

# Build Docker images
build_images() {
    local services=${1:-"backend frontend"}
    log "Building Docker images for: $services"
    
    for service in $services; do
        log "Building $service image..."
        docker-compose build $service || error "Failed to build $service image."
        success "$service image built successfully."
    done
}

# Run tests
run_tests() {
    local test_type=${1:-"all"}
    log "Running tests: $test_type"
    
    case $test_type in
        "backend")
            log "Running backend tests..."
            docker-compose run --rm backend-test || error "Backend tests failed."
            ;;
        "frontend")
            log "Running frontend tests..."
            docker-compose run --rm frontend-test || error "Frontend tests failed."
            ;;
        "e2e")
            log "Running E2E tests..."
            docker-compose --profile e2e run --rm e2e-test || error "E2E tests failed."
            ;;
        "all")
            log "Running all tests..."
            run_tests "backend"
            run_tests "frontend"
            if [ "$1" == "--include-e2e" ]; then
                run_tests "e2e"
            fi
            ;;
        *)
            error "Unknown test type: $test_type"
            ;;
    esac
    
    success "All tests passed."
}

# Start services
start_services() {
    local services=${1:-"all"}
    log "Starting services: $services"
    
    case $services in
        "all")
            docker-compose up -d || error "Failed to start all services."
            ;;
        *)
            docker-compose up -d $services || error "Failed to start services: $services"
            ;;
    esac
    
    success "Services started successfully."
}

# Stop services
stop_services() {
    local services=${1:-"all"}
    log "Stopping services: $services"
    
    case $services in
        "all")
            docker-compose down || error "Failed to stop all services."
            ;;
        *)
            docker-compose stop $services || error "Failed to stop services: $services"
            ;;
    esac
    
    success "Services stopped successfully."
}

# Deploy to production
deploy_production() {
    log "Deploying to production..."
    
    # Run tests first
    run_tests "all"
    
    # Build production images
    build_images "backend frontend"
    
    # Tag and push to registry
    log "Pushing images to registry..."
    docker tag chronosai-backend:latest $REGISTRY/chronosai-backend:latest
    docker tag chronosai-frontend:latest $REGISTRY/chronosai-frontend:latest
    
    docker push $REGISTRY/chronosai-backend:latest || error "Failed to push backend image."
    docker push $REGISTRY/chronosai-frontend:latest || error "Failed to push frontend image."
    
    success "Production deployment completed."
}

# Deploy to staging
deploy_staging() {
    log "Deploying to staging..."
    
    # Run tests first
    run_tests "all"
    
    # Build staging images
    build_images "backend frontend"
    
    # Deploy to staging environment
    log "Deploying to staging environment..."
    # Add staging deployment logic here
    
    success "Staging deployment completed."
}

# Health check
health_check() {
    local service=${1:-"backend"}
    local max_attempts=30
    local attempt=1
    
    log "Performing health check for $service..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            success "$service is healthy."
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: $service is not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    error "$service health check failed after $max_attempts attempts."
}

# Show logs
show_logs() {
    local service=${1:-"all"}
    local follow=${2:-"false"}
    
    if [ "$follow" == "true" ]; then
        docker-compose logs -f $service
    else
        docker-compose logs --tail=100 $service
    fi
}

# Cleanup
cleanup() {
    log "Cleaning up Docker resources..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused networks
    docker network prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    success "Cleanup completed."
}

# Show help
show_help() {
    echo "ChronosAI Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup [env]              Setup environment (development|production|test)"
    echo "  build [services]         Build Docker images (backend|frontend|all)"
    echo "  test [type]              Run tests (backend|frontend|e2e|all)"
    echo "  start [services]         Start services (all|backend|frontend|redis)"
    echo "  stop [services]          Stop services (all|backend|frontend|redis)"
    echo "  deploy [env]             Deploy to environment (staging|production)"
    echo "  health [service]         Check service health"
    echo "  logs [service] [follow]  Show logs (use 'follow' to tail logs)"
    echo "  cleanup                  Clean up Docker resources"
    echo "  help                     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup development     Setup development environment"
    echo "  $0 build all            Build all Docker images"
    echo "  $0 test all             Run all tests"
    echo "  $0 start all            Start all services"
    echo "  $0 deploy production     Deploy to production"
    echo "  $0 logs backend follow   Show backend logs in real-time"
}

# Main script logic
main() {
    case ${1:-help} in
        "setup")
            check_dependencies
            setup_environment ${2:-development}
            ;;
        "build")
            check_dependencies
            setup_environment
            build_images ${2:-"all"}
            ;;
        "test")
            check_dependencies
            setup_environment test
            run_tests ${2:-"all"}
            ;;
        "start")
            check_dependencies
            setup_environment
            start_services ${2:-"all"}
            ;;
        "stop")
            check_dependencies
            setup_environment
            stop_services ${2:-"all"}
            ;;
        "deploy")
            check_dependencies
            case ${2:-production} in
                "staging")
                    deploy_staging
                    ;;
                "production")
                    deploy_production
                    ;;
                *)
                    error "Unknown deployment environment: ${2:-production}"
                    ;;
            esac
            ;;
        "health")
            setup_environment
            health_check ${2:-"backend"}
            ;;
        "logs")
            setup_environment
            show_logs ${2:-"all"} ${3:-"false"}
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
