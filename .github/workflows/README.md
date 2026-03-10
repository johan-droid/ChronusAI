# ChronosAI CI/CD Pipeline Structure

## Overview

This repository uses a modular CI/CD approach with separate pipelines for frontend and backend, followed by a unified deployment pipeline.

## Pipeline Files

### 1. `backend-ci.yml`
**Triggers**: Changes to `backend/` directory
- **Test Job**: Python 3.11, pytest, coverage reporting
- **Build Job**: Docker image build and push to GHCR
- **Tags**: `chronosai-backend:latest` and SHA-based tags

### 2. `frontend-ci.yml`
**Triggers**: Changes to `frontend/` directory
- **Test Job**: Node.js 18, type checking, linting, tests, build verification
- **Build Job**: Docker image build and push to GHCR
- **Tags**: `chronosai-frontend:latest` and SHA-based tags

### 3. `deploy.yml`
**Triggers**: After successful backend and frontend builds
- **Wait Job**: Ensures both builds complete successfully
- **Deploy Job**: Creates unified deployment configuration
- **Outputs**: Docker Compose setup, unified image, nginx configuration

## Deployment Options

### Option 1: Full Stack (Docker Compose)
```bash
# Clone and deploy
git clone https://github.com/johan-droid/ChronosAI.git
cd ChronosAI
cp .env.example .env
# Edit .env with your secrets
docker-compose up -d
```

### Option 2: Unified Container
```bash
docker run -d \
  -p 80:80 \
  -e OPENAI_API_KEY=your_key \
  -e SECRET_KEY=your_secret \
  ghcr.io/johan-droid/chronosai:latest
```

### Option 3: Separate Services
```bash
# Backend
docker run -d \
  --name chronosai-backend \
  -e DATABASE_URL=your_db_url \
  -e OPENAI_API_KEY=your_key \
  ghcr.io/johan-droid/chronosai-backend:latest

# Frontend
docker run -d \
  --name chronosai-frontend \
  -p 80:80 \
  --link chronosai-backend:backend \
  ghcr.io/johan-droid/chronosai-frontend:latest
```

## Environment Variables

### Required for Backend
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: DeepSeek/OpenAI API key
- `OPENAI_BASE_URL`: API base URL (https://api.deepseek.com)
- `SECRET_KEY`: JWT secret key

### Optional
- `LOG_LEVEL`: Logging level (default: INFO)
- `DEBUG`: Debug mode (default: false)

## CI/CD Features

### Caching
- GitHub Actions cache for pip dependencies
- GitHub Actions cache for npm dependencies
- Docker layer caching with GitHub Container Registry

### Testing
- Backend: pytest with coverage reporting to Codecov
- Frontend: Jest with coverage reporting to Codecov
- Type checking for both frontend (TypeScript) and backend (Python)

### Security
- Minimal permissions required
- No secrets exposed in logs
- Container security scanning (can be added)

### Multi-platform Support
- Linux AMD64 and ARM64 support
- Optimized for cloud deployment

## Monitoring

### Health Checks
- Frontend: `/health` endpoint
- Backend: `/api/v1/health` endpoint
- Database: Connection health monitoring

### Logging
- Structured JSON logging
- Log aggregation ready
- Error tracking integration ready

## Local Development

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)

### Setup
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run dev

# Database (Docker)
docker-compose up db redis -d
```

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Dockerfile and dependencies
2. **Test Failures**: Review test logs and coverage reports
3. **Deployment Issues**: Verify environment variables and service health

### Debug Commands
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Clean up
docker-compose down -v
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. CI will run automatically on PR
5. Merge to main triggers deployment

## Support

For CI/CD issues:
- Check GitHub Actions logs
- Review workflow files
- Verify environment variables
- Check Docker build logs

For application issues:
- Review application logs
- Check service health endpoints
- Verify database connectivity
