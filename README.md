<div align="center">

<!-- Animated Logo -->
<div style="position: relative; margin-bottom: 2rem;">
  <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3); animation: float 3s ease-in-out infinite;">
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
      <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 7L2 17L12 12L22 7L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="2" fill="white" opacity="0.8">
        <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  </div>
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140px; height: 140px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; opacity: 0.3; animation: pulse 2s ease-in-out infinite;"></div>
</div>

<!-- Main Title -->
<h1 style="font-size: 3.5rem; font-weight: 800; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent;">
  ChronosAI
</h1>

<!-- Tagline -->
<p style="font-size: 1.3rem; color: #64748b; margin: 0.5rem 0 2rem 0; font-weight: 500;">
  🤖 <strong>AI-Powered Meeting Scheduler</strong> • 📅 <strong>Intelligent Calendar Management</strong> • ⚡ <strong>Real-time Scheduling</strong>
</p>

<!-- Badges -->
<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin: 1.5rem 0;">
  <img src="https://img.shields.io/badge/FastAPI-0.104.1-009688?style=for-the-badge&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-3.4.19-06B6D4?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/OpenAI-GPT-4-412991?style=for-the-badge&logo=openai" alt="OpenAI">
  <img src="https://img.shields.io/badge/Google_Calendar-API-4285F4?style=for-the-badge&logo=google" alt="Google Calendar">
</div>

<!-- Live Demo Button -->
<div style="margin: 2rem 0;">
  <a href="https://chronusai.onrender.com" target="_blank" 
     style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 0.75rem; font-weight: 600; font-size: 1.1rem; transition: all 0.3s ease; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3); position: relative; overflow: hidden;">
    <span style="position: relative; z-index: 1;">🚀 Try Live Demo</span>
    <div style="position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s;"></div>
  </a>
  <style>
    a:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
    }
    a:hover div {
      left: 100%;
    }
  </style>
</div>

<!-- GitHub Stats -->
<div style="display: flex; justify-content: center; gap: 1rem; margin: 1rem 0;">
  <a href="https://github.com/johan-droid/ChronusAI/stargazers" target="_blank">
    <img src="https://img.shields.io/github/stars/johan-droid/ChronusAI?style=for-the-badge&logo=github" alt="GitHub Stars">
  </a>
  <a href="https://github.com/johan-droid/ChronusAI/forks" target="_blank">
    <img src="https://img.shields.io/github/forks/johan-droid/ChronusAI?style=for-the-badge&logo=github" alt="GitHub Forks">
  </a>
  <a href="https://github.com/johan-droid/ChronusAI/watchers" target="_blank">
    <img src="https://img.shields.io/github/watchers/johan-droid/ChronusAI?style=for-the-badge&logo=github" alt="GitHub Watchers">
  </a>
</div>

</div>

---

## 🌟 Overview

**ChronosAI** is a cutting-edge meeting scheduler that revolutionizes how you manage your time. Powered by advanced AI technology, it seamlessly integrates with your calendars to provide intelligent scheduling suggestions, automated conflict resolution, and natural language meeting management.

<div align="center" style="margin: 2rem 0;">
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; max-width: 900px;">
    
    <div style="padding: 2rem; border-radius: 1rem; background: linear-gradient(135deg, #f8fafc, #e2e8f0); border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
      <div style="font-size: 2rem; margin-bottom: 1rem;">🤖</div>
      <h3 style="margin: 0 0 1rem 0; color: #1e293b; font-size: 1.2rem;">AI-Powered Scheduling</h3>
      <p style="color: #64748b; margin: 0; line-height: 1.6;">Natural language processing for intelligent meeting suggestions and automated scheduling</p>
    </div>
    
    <div style="padding: 2rem; border-radius: 1rem; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 1px solid #e0f2fe; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
      <div style="font-size: 2rem; margin-bottom: 1rem;">📅</div>
      <h3 style="margin: 0 0 1rem 0; color: #1e293b; font-size: 1.2rem;">Multi-Platform Integration</h3>
      <p style="color: #64748b; margin: 0; line-height: 1.6;">Google Calendar & Microsoft Outlook seamless integration with real-time sync</p>
    </div>
    
    <div style="padding: 2rem; border-radius: 1rem; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #dcfce7; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
      <div style="font-size: 2rem; margin-bottom: 1rem;">🔒</div>
      <h3 style="margin: 0 0 1rem 0; color: #1e293b; font-size: 1.2rem;">Enterprise Security</h3>
      <p style="color: #64748b; margin: 0; line-height: 1.6;">OAuth 2.0 with encrypted token storage and GDPR compliance</p>
    </div>
    
  </div>
</div>

---

## 🚀 Key Features

### 🎯 **Intelligent Scheduling**
- **Natural Language Processing**: Schedule meetings using conversational AI
- **Conflict Detection**: Automatically identify and resolve scheduling conflicts
- **Smart Suggestions**: AI-powered recommendations for optimal meeting times
- **Availability Analysis**: Real-time availability checking across multiple calendars

### 📊 **Advanced Analytics**
- **Meeting Insights**: Comprehensive analytics on meeting patterns and productivity
- **Time Tracking**: Monitor time spent in meetings and optimize scheduling
- **Productivity Metrics**: AI-driven insights to improve time management
- **Custom Reports**: Generate detailed reports on calendar usage

### 🔗 **Seamless Integration**
- **Google Calendar**: Full integration with Google Calendar API
- **Microsoft Outlook**: Support for Outlook calendar synchronization
- **Multi-Device**: Access your schedule from any device, anywhere
- **Real-time Sync**: Instant updates across all connected calendars

### 🛡️ **Security & Privacy**
- **End-to-End Encryption**: All data encrypted in transit and at rest
- **OAuth 2.0**: Secure authentication with major providers
- **GDPR Compliant**: Full compliance with data protection regulations
- **Privacy First**: Your data is never shared with third parties

---

## 🛠️ Technology Stack

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0;">
  
  <div style="padding: 2rem; border-radius: 1rem; background: linear-gradient(135deg, #1e293b, #334155); border-left: 4px solid #3b82f6; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);">
    <h3 style="color: #3b82f6; margin: 0 0 1.5rem 0; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
      <span>⚛️</span> Frontend
    </h3>
    <div style="color: #e2e8f0; line-height: 1.8;">
      <div style="margin-bottom: 0.5rem;"><strong>React 18.3.1</strong> • <strong>TypeScript 5.9.3</strong></div>
      <div style="margin-bottom: 0.5rem;"><strong>Vite 7.3.1</strong> • <strong>Tailwind CSS 3.4.19</strong></div>
      <div style="margin-bottom: 0.5rem;"><strong>Zustand 5.0.11</strong> • <strong>React Query 5.90.21</strong></div>
      <div><strong>Framer Motion 12.35.0</strong> • <strong>Lucide React</strong></div>
    </div>
  </div>
  
  <div style="padding: 2rem; border-radius: 1rem; background: linear-gradient(135deg, #1e293b, #334155); border-left: 4px solid #10b981; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);">
    <h3 style="color: #10b981; margin: 0 0 1.5rem 0; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
      <span>🔧</span> Backend
    </h3>
    <div style="color: #e2e8f0; line-height: 1.8;">
      <div style="margin-bottom: 0.5rem;"><strong>FastAPI 0.104.1</strong> • <strong>PostgreSQL</strong></div>
      <div style="margin-bottom: 0.5rem;"><strong>SQLAlchemy 2.0</strong> • <strong>Pydantic</strong></div>
      <div style="margin-bottom: 0.5rem;"><strong>OpenAI API</strong> • <strong>Google OAuth 2.0</strong></div>
      <div><strong>Redis</strong> • <strong>Docker</strong> • <strong>Celery</strong></div>
    </div>
  </div>
  
  <div style="padding: 2rem; border-radius: 1rem; background: linear-gradient(135deg, #1e293b, #334155); border-left: 4px solid #f59e0b; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);">
    <h3 style="color: #f59e0b; margin: 0 0 1.5rem 0; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
      <span>🤖</span> AI & APIs
    </h3>
    <div style="color: #e2e8f0; line-height: 1.8;">
      <div style="margin-bottom: 0.5rem;"><strong>OpenAI GPT-4</strong> • <strong>Google Calendar API</strong></div>
      <div style="margin-bottom: 0.5rem;"><strong>Microsoft Graph API</strong> • <strong>Natural Language Processing</strong></div>
      <div><strong>Machine Learning</strong> • <strong>Time Zone Detection</strong></div>
    </div>
  </div>
  
</div>

---

## 🚀 Quick Start

### 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 14+
- Redis (optional, for caching)

### ⚙️ Installation

```bash
# Clone the repository
git clone https://github.com/johan-droid/ChronusAI.git
cd ChronusAI

# Backend Setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env.local

# Frontend Setup  
cd frontend
npm install
cp .env.example .env.local
```

### 🔧 Configuration

1. **Backend Environment** (`backend/.env.local`):
```env
DATABASE_URL=postgresql://user:password@localhost/chronosai
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

2. **Frontend Environment** (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 🏃‍♂️ Development

```bash
# Start the backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start the frontend (in another terminal)
cd frontend
npm run dev
```

Visit **http://localhost:5173** to see the application in action!

---

## 📖 Live Demo

<div align="center" style="margin: 2rem 0;">
  <a href="https://chronusai.onrender.com" target="_blank" 
     style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 1.2rem 2.5rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 0.75rem; font-weight: 600; font-size: 1.2rem; transition: all 0.3s ease; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">
    <span>🎯</span>
    <span>Try ChronosAI Now</span>
    <span>→</span>
  </a>
  <style>
    a:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(16, 185, 129, 0.4);
    }
  </style>
</div>

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### 🛠️ Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

---

<div align="center" style="margin-top: 4rem; padding: 3rem 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); border-radius: 1rem; position: relative; overflow: hidden;">
  
  <!-- Animated Background Elements -->
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;">
    <div style="position: absolute; top: 20%; left: -100%; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, #667eea, transparent); animation: lightRay 3s linear infinite;"></div>
    <div style="position: absolute; top: 40%; left: -100%; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, #764ba2, transparent); animation: lightRay 4s linear infinite;"></div>
    <div style="position: absolute; top: 60%; left: -100%; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, #667eea, transparent); animation: lightRay 3.5s linear infinite;"></div>
    <div style="position: absolute; top: 80%; left: -100%; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, #764ba2, transparent); animation: lightRay 4.5s linear infinite;"></div>
  </div>
  
  <!-- Content -->
  <div style="position: relative; z-index: 10; text-align: center;">
    
    <!-- Logo -->
    <div style="font-size: 3rem; margin-bottom: 1rem; animation: pulse 2s infinite;">
      ⏰
    </div>
    
    <!-- Title -->
    <h3 style="color: #ffffff; font-size: 2.5rem; font-weight: 700; margin: 0 0 1rem 0; text-shadow: 0 0 20px rgba(102, 126, 234, 0.5);">
      ChronosAI
    </h3>
    
    <!-- Tagline -->
    <p style="color: #e2e8f0; font-size: 1.1rem; margin: 0 0 2rem 0; text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);">
      <em>Intelligent Meeting Scheduler for the Modern World</em>
    </p>
    
    <!-- Social Links -->
    <div style="display: flex; justify-content: center; gap: 1rem; margin-bottom: 2rem;">
      <a href="https://github.com/johan-droid/ChronusAI" target="_blank" 
         style="color: #667eea; text-decoration: none; padding: 0.75rem 1.5rem; border: 1px solid #667eea; border-radius: 0.5rem; transition: all 0.3s ease; background: rgba(102, 126, 234, 0.1); font-weight: 500;">
        📦 GitHub
      </a>
      <a href="https://chronusai.onrender.com" target="_blank" 
         style="color: #764ba2; text-decoration: none; padding: 0.75rem 1.5rem; border: 1px solid #764ba2; border-radius: 0.5rem; transition: all 0.3s ease; background: rgba(118, 75, 162, 0.1); font-weight: 500;">
        🚀 Live Demo
      </a>
    </div>
    
    <!-- Legal Links -->
    <div style="display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap;">
      <a href="./PRIVACY_POLICY.md" style="color: #94a3b8; text-decoration: none; font-size: 0.9rem; transition: color 0.3s ease;">Privacy Policy</a>
      <a href="./TERMS_OF_SERVICE.md" style="color: #94a3b8; text-decoration: none; font-size: 0.9rem; transition: color 0.3s ease;">Terms of Service</a>
      <a href="./SECURITY.md" style="color: #94a3b8; text-decoration: none; font-size: 0.9rem; transition: color 0.3s ease;">Security</a>
    </div>
    
    <!-- Copyright -->
    <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1.5rem; margin-top: 2rem;">
      <p style="color: #64748b; font-size: 0.9rem; margin: 0;">
        © 2026 ChronosAI. All rights reserved.
      </p>
      <p style="color: #64748b; font-size: 0.8rem; margin: 0.5rem 0 0 0;">
        Contact: <a href="mailto:hello@chronosai.com" style="color: #667eea; text-decoration: none;">hello@chronosai.com</a>
      </p>
      <p style="color: #475569; font-size: 0.75rem; margin: 0.5rem 0 0 0;">
        Built with ❤️ using cutting-edge AI technology
      </p>
    </div>
    
  </div>
  
  <!-- CSS Animations -->
  <style>
    @keyframes lightRay {
      0% { left: -100%; opacity: 0; }
      10% { opacity: 0.8; }
      90% { opacity: 0.8; }
      100% { left: 100%; opacity: 0; }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
  </style>
</div>
