# 🚀 ChronosAI - AI Meeting Scheduler

A full-stack, production-ready AI Meeting Scheduler that lets users schedule, reschedule, and cancel calendar meetings using plain natural language. The system integrates with Google Calendar and Microsoft Outlook via secure OAuth 2.0, uses Google Gemini for intent detection and entity extraction, and resolves scheduling conflicts algorithmically.

## 📋 Features

- **Natural Language Scheduling**: Schedule meetings using plain English
- **Multi-Provider Support**: Integrates with Google Calendar and Microsoft Outlook
- **Conflict Resolution**: Automatically finds available time slots
- **Real-time Chat Interface**: Conversational UI with streaming responses
- **OAuth 2.0 Security**: Secure authentication with PKCE flow
- **Timezone Support**: Handles multiple timezones automatically
- **Meeting Management**: View, update, and cancel scheduled meetings

## 🛠 Tech Stack

### Backend
- **Runtime**: Python 3.11+
- **Framework**: FastAPI (async, with Uvicorn)
- **AI/NLP**: Google Gemini 1.5 Pro via LangChain
- **Auth**: OAuth 2.0 with PKCE, PyJWT
- **Database**: PostgreSQL 15 with SQLAlchemy
- **Cache**: Redis 7
- **Encryption**: Fernet (AES-128-CBC) for token storage

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (Cosmic Galaxy Theme)
- **State Management**: Zustand
- **API Client**: TanStack Query + Axios
- **UI Components**: Custom components with Lucide icons

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd meeting-scheduler-agent
   ```

2. **Set up environment variables**
   ```bash
   # Copy the example environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Edit the files with your actual credentials
   # You'll need:
   # - Google Gemini API key
   # - Google OAuth credentials (optional)
   # - Microsoft OAuth credentials (optional)
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Local Development

#### Backend Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up database**
   ```bash
   # Start PostgreSQL and Redis (or use Docker)
   docker-compose up postgres redis -d
   
   # Run migrations
   alembic upgrade head
   ```

4. **Start the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```bash
# App
APP_ENV=development
SECRET_KEY=your-secret-key-min-32-chars
ENCRYPTION_KEY=your-fernet-base64-key
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://scheduler_user:password@localhost:5432/scheduler_db
REDIS_URL=redis://localhost:6379/0

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Microsoft OAuth (optional)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/v1/auth/outlook/callback
MICROSOFT_TENANT_ID=common

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000/api/v1
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📚 API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

### Key Endpoints

- `POST /api/v1/chat/message` - Send chat messages for scheduling
- `GET /api/v1/meetings` - List user's meetings
- `DELETE /api/v1/meetings/{id}` - Cancel a meeting
- `GET /api/v1/auth/{provider}/login` - Initiate OAuth flow

## 🎯 Usage Examples

### Schedule a Meeting
```
"Schedule a 30 min sync with jane@corp.com next Tuesday at 2pm"
```

### Check Availability
```
"When am I free tomorrow?"
```

### Cancel a Meeting
```
"Cancel my meeting with Alex on Friday"
```

### Reschedule
```
"Move my 3pm meeting to 4pm"
```

## 🔒 Security Features

- **OAuth 2.0 with PKCE**: Secure authentication flow
- **Token Encryption**: All OAuth tokens encrypted at rest using Fernet
- **JWT Authentication**: Secure session management
- **Rate Limiting**: Prevent abuse with request throttling
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Proper cross-origin resource sharing setup

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Chat UI       │    │ • LLM Service   │    │ • Google Cal    │
│ • Meeting List  │    │ • Scheduler     │    │ • Outlook Cal   │
│ • Auth Flow     │    │ • OAuth Handler  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Data Store    │
                       │                 │
                       │ • PostgreSQL    │
                       │ • Redis Cache   │
                       └─────────────────┘
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Join our [Discussions](../../discussions) for general questions

## 🗺 Roadmap

- [ ] Mobile app support
- [ ] Additional calendar providers (Apple Calendar, etc.)
- [ ] Meeting room booking
- [ ] Advanced scheduling preferences
- [ ] Team scheduling features
- [ ] Analytics and insights
- [ ] Webhook integrations
- [ ] Slack/Teams integration

---

Built with ❤️ by the ChronosAI team using modern web technologies.
