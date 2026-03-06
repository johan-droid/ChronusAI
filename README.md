<div align="center">

# 🌌 ChronusAI

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&duration=2800&pause=2000&color=FF8C00&center=true&vCenter=true&width=940&lines=AI-Powered+Calendar+Scheduler;Schedule+Meetings+with+Natural+Language;Powered+by+DeepSeek+AI" alt="Typing SVG" />

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge" alt="Status"/>
  <img src="https://img.shields.io/badge/CI%2FCD-Passing-brightgreen?style=for-the-badge&logo=github-actions" alt="CI/CD"/>
  <img src="https://img.shields.io/badge/Coverage-45%25-yellow?style=for-the-badge" alt="Coverage"/>
</p>

### ✨ Transform your scheduling with the power of AI

*Schedule meetings naturally, manage your calendar effortlessly, and stay organized with intelligent automation*

[🚀 Live Demo](https://chronusai.onrender.com) • [📖 Documentation](#-features) • [🐛 Report Bug](https://github.com/johan-droid/ChronusAI/issues) • [💡 Request Feature](https://github.com/johan-droid/ChronusAI/issues)

---

</div>

## 🎯 What is ChronusAI?

ChronusAI is a next-generation calendar scheduling platform that leverages **DeepSeek AI** to understand natural language and automate your meeting management. Simply tell ChronusAI what you want to schedule, and it handles the rest.

<div align="center">

```
"Schedule a sync with alex@corp.com tomorrow at 3pm"
                    ↓
        🤖 AI Processing...
                    ↓
        ✅ Meeting Created!
```

</div>

## ⚡ Features

<table>
<tr>
<td width="50%">

### 🧠 AI-Powered Scheduling
- Natural language processing
- Smart time zone handling
- Automatic conflict detection
- Intelligent meeting suggestions

</td>
<td width="50%">

### 🔗 Calendar Integration
- Google Calendar sync
- Microsoft Outlook support
- Real-time availability checking
- Bidirectional synchronization

</td>
</tr>
<tr>
<td width="50%">

### 💬 Conversational Interface
- Chat-based scheduling
- Context-aware responses
- Multi-turn conversations
- Meeting history tracking

</td>
<td width="50%">

### 🎨 Beautiful UI
- Cosmic-themed design
- Glass morphism effects
- Smooth animations
- Fully responsive layout

</td>
</tr>
</table>

## 🛠️ Tech Stack

<div align="center">

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge)

### AI & Services
![DeepSeek](https://img.shields.io/badge/DeepSeek%20AI-FF6B00?style=for-the-badge&logo=openai&logoColor=white)
![OAuth2](https://img.shields.io/badge/OAuth2-EB5424?style=for-the-badge&logo=auth0&logoColor=white)

</div>

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or SQLite for development)
- Redis (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/johan-droid/ChronusAI.git
cd ChronusAI

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

### Environment Variables

<details>
<summary>Click to expand</summary>

```env
# App Configuration
APP_ENV=development
SECRET_KEY=your-secret-key
ENCRYPTION_KEY=your-encryption-key
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost/chronusai

# DeepSeek AI
OPENAI_API_KEY=your-deepseek-api-key
OPENAI_MODEL=deepseek-chat
OPENAI_BASE_URL=https://api.deepseek.com

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# OAuth (Microsoft)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/v1/auth/microsoft/callback

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
```

</details>

## 📸 Screenshots

<div align="center">

### 🏠 Dashboard
![Dashboard](https://via.placeholder.com/800x450/0a0a1a/ff8c00?text=Dashboard+Preview)

### 💬 AI Chat Interface
![Chat](https://via.placeholder.com/800x450/0a0a1a/8b5cf6?text=AI+Chat+Interface)

### 📅 Calendar View
![Calendar](https://via.placeholder.com/800x450/0a0a1a/3b82f6?text=Calendar+View)

</div>

## 🎨 Key Highlights

```typescript
// Natural Language Scheduling
"Schedule a team standup tomorrow at 10am with john@example.com"

// Smart Time Zone Handling
"Book a call with Sarah in London at 3pm her time"

// Conflict Detection
"Find a time for a 1-hour meeting with the team this week"

// Quick Rescheduling
"Move my 2pm meeting to 4pm"
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   Chat   │  │ Calendar │  │Dashboard │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
┌────────────────────┴────────────────────────────────────┐
│                  Backend (FastAPI)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   Auth   │  │   LLM    │  │ Calendar │             │
│  │  OAuth2  │  │ Service  │  │ Provider │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼───┐   ┌───▼────┐  ┌───▼────┐
   │Database│   │DeepSeek│  │ Redis  │
   │  (PG)  │   │   AI   │  │ Cache  │
   └────────┘   └────────┘  └────────┘
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest -v --cov=app --cov-report=term-missing

# Frontend tests
cd frontend
npm test

# Linting
cd backend && ruff check app tests
cd frontend && npm run lint

# Type checking
cd backend && mypy app
cd frontend && npm run type-check
```

## 📦 Deployment

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

### Manual Deployment

<details>
<summary>Deploy to Render</summary>

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables
4. Deploy!

</details>

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [DeepSeek AI](https://www.deepseek.com/) for powering the natural language processing
- [FastAPI](https://fastapi.tiangolo.com/) for the amazing backend framework
- [React](https://reactjs.org/) for the frontend library
- [Tailwind CSS](https://tailwindcss.com/) for the styling system

## 📧 Contact

**Johan** - [@johan-droid](https://github.com/johan-droid)

Project Link: [https://github.com/johan-droid/ChronusAI](https://github.com/johan-droid/ChronusAI)

---

<div align="center">

### ⭐ Star us on GitHub — it motivates us a lot!

Made with ❤️ and ☕ by [Johan](https://github.com/johan-droid)

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,14,16,18,20&height=100&section=footer" width="100%"/>

</div>
