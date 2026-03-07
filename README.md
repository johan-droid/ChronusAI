<div align="center">
  
  <!-- Animated ChronosAI Logo -->
  <svg width="120" height="120" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <!-- Background circle with gradient -->
    <defs>
      <linearGradient id="timeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="sandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#fed7aa;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#fb923c;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <circle cx="16" cy="16" r="15" fill="url(#timeGradient)" opacity="0.1">
      <animate attributeName="r" values="15;17;15" dur="4s" repeatCount="indefinite"/>
    </circle>
    
    <!-- Hourglass frame -->
    <path d="M8 4h16v4l-6 6 6 6v4H8v-4l6-6-6-6V4z" 
          fill="none" stroke="url(#sandGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <animate attributeName="stroke-opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite"/>
    </path>
    
    <!-- Animated sand particles -->
    <g>
      <circle cx="12" cy="8" r="1" fill="#fed7aa">
        <animate attributeName="cy" values="8;24;8" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="20" cy="12" r="1" fill="#fb923c">
        <animate attributeName="cy" values="12;20;12" dur="2.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="16" cy="20" r="0.8" fill="#fed7aa">
        <animate attributeName="cy" values="20;8;20" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite"/>
      </circle>
    </g>
  </svg>
  
  <br>
  
  <!-- Professional Title with Animation -->
  <h1>
    <span style="background: linear-gradient(135deg, #1a1a1a, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; font-size: 2.5rem; font-weight: 700;">
      ⏰ ChronosAI
    </span>
    <style>
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .title-text {
        animation: fadeInUp 1s ease-out;
        display: inline-block;
      }
    </style>
  </h1>
  
  <p style="font-size: 1.2rem; color: #666; margin: 1rem 0;">
    <em>Intelligent Meeting Scheduler & Calendar Management</em>
  </p>
  
  <!-- Tech Stack Badges -->
  <div style="margin: 1rem 0;">
    <img src="https://img.shields.io/badge/FastAPI-0.104.1-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" style="margin: 0 0.5rem;">
    <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react" alt="React" style="margin: 0 0.5rem;">
    <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" style="margin: 0 0.5rem;">
    <img src="https://img.shields.io/badge/Tailwind-3.4.19-06B6D4?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" style="margin: 0 0.5rem;">
  </div>
  
  <!-- Live Demo Button with Animation -->
  <div style="margin: 2rem 0;">
    <a href="https://chronusai.onrender.com" target="_blank" 
       style="display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #FF6B6B, #4C1D95); color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(255, 107, 14, 0.1);">
      <span style="display: inline-block; animation: pulse 2s infinite;">🚀</span>
      Live Demo
    </a>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      .demo-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 107, 14, 0.2);
      }
    </style>
  </div>
  
  <!-- GitHub Stats -->
  <div style="margin: 1rem 0;">
    <a href="https://github.com/johan-droid/ChronusAI/stargazers" target="_blank">
      <img src="https://img.shields.io/github/stars/johan-droid/ChronusAI?style=for-the-badge&logo=github" alt="GitHub Stars" style="margin: 0 0.5rem;">
    </a>
    <a href="https://github.com/johan-droid/ChronusAI/forks" target="_blank">
      <img src="https://img.shields.io/github/forks/johan-droid/ChronusAI?style=for-the-badge&logo=github" alt="GitHub Forks" style="margin: 0 0.5rem;">
    </a>
  </div>
</div>

---

## 🌟 Overview

**ChronosAI** is an intelligent meeting scheduler that transforms how you manage your time. Powered by advanced AI, it seamlessly integrates with your calendars to provide smart scheduling suggestions and automated conflict resolution.

<div align="center" style="margin: 2rem 0;">
  
  <!-- Feature Cards -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; max-width: 800px;">
    
    <div style="padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #f8fafc;">
      <h3 style="margin: 0 0 1rem 0; color: #1f2937;">🤖 AI-Powered</h3>
      <p style="color: #6b7280; margin: 0;">Smart scheduling with natural language processing</p>
    </div>
    
    <div style="padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #f8fafc;">
      <h3 style="margin: 0 0 1rem 0; color: #1f2937;">📅 Calendar Sync</h3>
      <p style="color: #6b7280; margin: 0;">Google Calendar & Microsoft Outlook integration</p>
    </div>
    
    <div style="padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #f8fafc;">
      <h3 style="margin: 0 0 1rem 0; color: #1f2937;">🔒 Secure</h3>
      <p style="color: #6b7280; margin: 0;">OAuth 2.0 with encrypted token storage</p>
    </div>
    
  </div>
</div>

---

## 🛠️ Technology Stack

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0;">
  
  <div style="padding: 1.5rem; border-left: 4px solid #3b82f6; background: #1a1a1a; border-radius: 0.5rem;">
    <h3 style="color: #3b82f6; margin: 0 0 1rem 0;">Frontend</h3>
    <div style="color: #d1d5db;">
      <strong>React 18.3.1</strong> • <strong>TypeScript 5.9.3</strong> • <strong>Vite 7.3.1</strong><br>
      <strong>Tailwind CSS 3.4.19</strong> • <strong>Framer Motion 12.35.0</strong><br>
      <strong>Zustand 5.0.11</strong> • <strong>React Query 5.90.21</strong>
    </div>
  </div>
  
  <div style="padding: 1.5rem; border-left: 4px solid #059669; background: #1e293b; border-radius: 0.5rem;">
    <h3 style="color: #059669; margin: 0 0 1rem 0;">Backend</h3>
    <div style="color: #d1d5db;">
      <strong>FastAPI 0.104.1</strong> • <strong>PostgreSQL</strong><br>
      <strong>SQLAlchemy 2.0</strong> • <strong>Pydantic</strong><br>
      <strong>OpenAI API</strong> • <strong>Google & Microsoft OAuth</strong>
    </div>
  </div>
</div>

---

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/johan-droid/ChronusAI.git
cd ChronusAI

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env.local

# Frontend  
cd frontend
npm install
cp .env.example .env.local
```

### Development

```bash
# Start both services
npm run dev      # Frontend :5173
uvicorn app.main:app --reload  # Backend :8000
```

---

## 📖 Live Demo

<div align="center" style="margin: 2rem 0;">
  <a href="https://chronusai.onrender.com" target="_blank" 
     style="display: inline-block; padding: 1rem 2rem; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 600; font-size: 1.1rem; transition: all 0.3s ease;">
    <span style="display: inline-block; animation: pulse 2s infinite;">🎯</span>
    Try ChronosAI Now
  </a>
</div>

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

---

<div align="center" style="margin-top: 3rem;">
  <p style="color: #666;">
    <strong>Made with ❤️ by the ChronosAI Team</strong>
  </p>
</div>
