# ChronosAI - AI-Powered Meeting Scheduler

<div align="center">

![ChronosAI Logo](https://img.shields.io/badge/ChronosAI-AI%20Scheduler-blue?style=for-the-badge&logo=calendar&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-20.10+-blue.svg)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

**Intelligent meeting scheduling powered by AI with seamless calendar integration**

[Live Demo](https://chronusai.onrender.com) • [Documentation](#documentation) • [Quick Start](#quick-start) • [API Reference](#api-reference)

</div>

## 🌟 Features

### 🤖 AI-Powered Scheduling
- **Natural Language Processing**: Schedule meetings using conversational AI
- **Smart Intent Recognition**: Understands complex scheduling requests
- **Context-Aware Responses**: Remembers previous conversations and preferences
- **Multi-Provider Support**: Works with Google Calendar and Outlook

### 📅 Calendar Integration
- **Real-Time Sync**: Automatic synchronization with external calendars
- **Availability Checking**: Find optimal meeting times across multiple attendees
- **Conflict Resolution**: Intelligent handling of scheduling conflicts
- **Time Zone Support**: Automatic time zone detection and conversion

### 🔐 Enterprise Security
- **OAuth 2.0 Authentication**: Secure integration with calendar providers
- **JWT Token Management**: Robust token handling with refresh rotation
- **End-to-End Encryption**: Encrypted storage of sensitive data
- **Privacy-First Design**: Minimal data collection and storage

### 🚀 High Performance
- **Microservices Architecture**: Scalable backend with FastAPI
- **Real-Time Updates**: WebSocket support for live notifications
- **Caching Layer**: Redis for optimal performance
- **Containerized Deployment**: Docker-based deployment with Render

## 🏗️ Architecture

```mermaid
graph TB
    A[Frontend - React] --> B[API Gateway - FastAPI]
    B --> C[AI Service - LLM]
    B --> D[Calendar Integration]
    B --> E[Database - PostgreSQL]
    B --> F[Cache - Redis]
    
    D --> G[Google Calendar API]
    D --> H[Outlook Calendar API]
    
    C --> I[DeepSeek LLM]
    C --> J[Intent Parser]
    C --> K[Response Generator]
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/johan-droid/ChronosAI.git
   cd ChronosAI
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Manual Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 🔧 Configuration

### Environment Variables

#### Backend Configuration

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chronosai

# Authentication
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# AI Services
DEEPSEEK_API_KEY=your-deepseek-api-key

# Redis
REDIS_URL=redis://localhost:6379

# Application
APP_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration

```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### OAuth Setup

#### Google Calendar

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:8000/api/v1/auth/google/callback`
6. Copy Client ID and Client Secret to environment variables

#### Microsoft Outlook

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add Calendar permissions (Calendars.ReadWrite)
4. Add redirect URI: `http://localhost:8000/api/v1/auth/microsoft/callback`
5. Copy Application ID and Client Secret to environment variables

## 📚 Documentation

### API Reference

#### Authentication Endpoints

```http
POST /api/v1/auth/login
POST /api/v1/auth/signup
POST /api/v1/auth/refresh
GET  /api/v1/auth/google/login
GET  /api/v1/auth/microsoft/login
```

#### Calendar Endpoints

```http
GET  /api/v1/meetings
POST /api/v1/meetings/sync
GET  /api/v1/calendar/events
POST /api/v1/calendar/availability
```

#### AI Chat Endpoints

```http
POST /api/v1/chat/message
GET  /api/v1/chat/context
```

#### User Management

```http
GET  /api/v1/users/profile
PUT  /api/v1/users/profile
POST /api/v1/users/detect-timezone
GET  /api/v1/users/indian-context
```

### SDK Examples

#### Python Client

```python
import requests

# Initialize client
base_url = "http://localhost:8000"
client = requests.Session()

# Login
response = client.post(f"{base_url}/api/v1/auth/login", json={
    "email": "user@example.com",
    "password": "password"
})
token = response.json()["access_token"]

# Set authentication
client.headers.update({
    "Authorization": f"Bearer {token}"
})

# Schedule meeting
response = client.post(f"{base_url}/api/v1/chat/message", json={
    "message": "Schedule a meeting with John tomorrow at 2pm"
})
```

#### JavaScript Client

```javascript
import axios from 'axios';

// Initialize client
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Login
const login = async (email, password) => {
  const response = await api.post('/api/v1/auth/login', { email, password });
  const { access_token } = response.data;
  api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  return response.data;
};

// Schedule meeting
const scheduleMeeting = async (message) => {
  const response = await api.post('/api/v1/chat/message', { message });
  return response.data;
};
```

## 🧪 Testing

### Running Tests

#### Backend Tests

```bash
cd backend

# Run unit tests
pytest tests/unit/

# Run integration tests
pytest tests/integration/

# Run all tests with coverage
pytest --cov=app tests/
```

#### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test Coverage

- **Backend**: 85%+ coverage required
- **Frontend**: 80%+ coverage required
- **Integration**: All API endpoints tested

## 🚀 Deployment

### Production Deployment with Render

1. **Prepare for deployment**
   ```bash
   # Install Render CLI
   curl -s https://api.render.com/install-render-cli.sh | bash
   
   # Login to Render
   render login
   ```

2. **Deploy backend**
   ```bash
   render deploy chronusai-backend
   ```

3. **Deploy frontend**
   ```bash
   render deploy chronusai-frontend
   ```

### Manual Deployment

#### Docker Deployment

```bash
# Build images
docker build -t chronosai-backend ./backend
docker build -t chronosai-frontend ./frontend

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

#### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n chronosai
```

## 📊 Monitoring & Observability

### Health Checks

- **Backend Health**: `GET /health`
- **Database Health**: `GET /api/v1/status`
- **Frontend Health**: `GET /` (returns 200)

### Logging

```bash
# View application logs
docker-compose logs -f backend

# View specific service logs
render logs chronusai-backend --tail 100
```

### Metrics

- **Application Metrics**: Prometheus-compatible endpoints
- **Database Metrics**: PostgreSQL performance insights
- **Cache Metrics**: Redis performance monitoring

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Python**: Follow PEP 8, use black and flake8
- **JavaScript**: Use ESLint and Prettier
- **Commits**: Follow Conventional Commits specification

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern, fast web framework for building APIs
- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [DeepSeek](https://www.deepseek.com/) - AI model provider
- [Render](https://render.com/) - Cloud platform for deployment

## 📞 Support

- **Documentation**: [Full Documentation](https://docs.chronusai.com)
- **Issues**: [GitHub Issues](https://github.com/johan-droid/ChronosAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/johan-droid/ChronosAI/discussions)
- **Email**: support@chronusai.com

---

<div align="center">

**Built with ❤️ by the ChronosAI Team**

[![Star](https://img.shields.io/github/stars/johan-droid/ChronosAI.svg?style=social&label=Star)](https://github.com/johan-droid/ChronosAI)
[![Fork](https://img.shields.io/github/forks/johan-droid/ChronosAI.svg?style=social&label=Fork)](https://github.com/johan-droid/ChronosAI/fork)
[![Watch](https://img.shields.io/github/watchers/johan-droid/ChronosAI.svg?style=social&label=Watch)](https://github.com/johan-droid/ChronosAI)

</div>
