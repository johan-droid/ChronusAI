# 🚀 ChronosAI Backend API

AI-powered meeting scheduler backend built with FastAPI, LangChain, and GPT-4o.

## ✨ Features

- **Natural Language Processing**: Understands scheduling requests in plain English
- **Multi-Calendar Integration**: Google Calendar & Microsoft Outlook support
- **Smart Conflict Resolution**: Automatically finds available time slots
- **OAuth 2.0 Security**: Secure authentication with PKCE flow
- **Real-time Sync**: Instant calendar updates
- **Rate Limiting**: Built-in request throttling
- **Structured Logging**: JSON-formatted logs with structlog
- **Redis Caching**: Fast session and token management

## 🛠 Tech Stack

- **Framework**: FastAPI (async)
- **AI/NLP**: Google Gemini 1.5 Pro via LangChain
- **Database**: PostgreSQL 15 + SQLAlchemy
- **Cache**: Redis 7
- **Auth**: OAuth 2.0, PyJWT
- **Encryption**: Fernet (AES-128-CBC)

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Database Setup

```bash
# Run migrations
alembic upgrade head
```

### Run Server

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/openapi.json

## 🔑 Environment Variables

```bash
# App Configuration
APP_ENV=development
SECRET_KEY=your-secret-key-min-32-chars
ENCRYPTION_KEY=your-fernet-base64-key
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/scheduler_db
REDIS_URL=redis://localhost:6379/0

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/v1/auth/outlook/callback
MICROSOFT_TENANT_ID=common

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
```

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_llm_service.py -v
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API endpoints
│   ├── core/            # Security, middleware, OAuth
│   ├── db/              # Database & Redis
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   ├── config.py        # Configuration
│   └── main.py          # FastAPI app
├── alembic/             # Database migrations
├── tests/               # Test suite
└── requirements.txt     # Dependencies
```

## 🔒 Security Features

- OAuth 2.0 with PKCE flow
- Token encryption at rest (Fernet)
- JWT authentication
- Rate limiting (SlowAPI)
- Input validation (Pydantic)
- CORS protection
- Structured logging

## 🌟 Key Endpoints

### Authentication
- `GET /api/v1/auth/{provider}/login` - Initiate OAuth flow
- `GET /api/v1/auth/{provider}/callback` - OAuth callback

### Chat
- `POST /api/v1/chat/message` - Send scheduling message

### Meetings
- `GET /api/v1/meetings` - List meetings
- `GET /api/v1/meetings/{id}` - Get meeting details
- `DELETE /api/v1/meetings/{id}` - Cancel meeting

### Users
- `GET /api/v1/users/me` - Get current user

## 🚀 Performance

- Async/await throughout
- Redis caching for sessions
- Connection pooling
- Rate limiting: 100 req/min per IP

## 📝 License

MIT License - see LICENSE file

## 🆘 Support

For issues and questions, please open a GitHub issue.

---

Built with ❤️ by the ChronosAI team
