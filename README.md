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

<div align="center" style="margin-top: 3rem; position: relative; overflow: hidden; padding: 2rem 0; background: linear-gradient(135deg, #0a0a0a, #1a1a2e);">
  
  <!-- Animated Background with CSS -->
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;">
    
    <!-- Light Ray Effects using CSS -->
    <div style="position: absolute; top: 0; left: -100%; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #ff6b6b, #4ecdc4, transparent); animation: lightRay1 3s linear infinite;"></div>
    <div style="position: absolute; top: 20%; left: -100%; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #45b7d1, #feca57, transparent); animation: lightRay2 4s linear infinite;"></div>
    <div style="position: absolute; top: 40%; left: -100%; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #ff9ff3, #96ceb4, transparent); animation: lightRay3 5s linear infinite;"></div>
    <div style="position: absolute; top: 60%; left: -100%; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #4ecdc4, #ff6b6b, transparent); animation: lightRay1 3.5s linear infinite;"></div>
    <div style="position: absolute; top: 80%; left: -100%; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #feca57, #45b7d1, transparent); animation: lightRay2 4.5s linear infinite;"></div>
    
    <!-- Particle Effects -->
    <div style="position: absolute; top: 25%; left: 0; width: 4px; height: 4px; background: #ff6b6b; border-radius: 50%; animation: particle1 2s linear infinite; box-shadow: 0 0 10px #ff6b6b;"></div>
    <div style="position: absolute; top: 50%; left: 0; width: 3px; height: 3px; background: #4ecdc4; border-radius: 50%; animation: particle2 2.5s linear infinite; box-shadow: 0 0 8px #4ecdc4;"></div>
    <div style="position: absolute; top: 75%; left: 0; width: 3px; height: 3px; background: #45b7d1; border-radius: 50%; animation: particle3 3s linear infinite; box-shadow: 0 0 8px #45b7d1;"></div>
    <div style="position: absolute; top: 35%; left: 0; width: 4px; height: 4px; background: #feca57; border-radius: 50%; animation: particle1 2.8s linear infinite; box-shadow: 0 0 10px #feca57;"></div>
    <div style="position: absolute; top: 65%; left: 0; width: 3px; height: 3px; background: #ff9ff3; border-radius: 50%; animation: particle2 3.2s linear infinite; box-shadow: 0 0 8px #ff9ff3;"></div>
  </div>
  
  <!-- Content Overlay -->
  <div style="position: relative; z-index: 10; text-align: center; padding: 1rem;">
    
    <!-- Animated ChronosAI Logo using Emoji -->
    <div style="margin-bottom: 1rem; font-size: 3rem; animation: pulse 2s infinite;">
      <span style="display: inline-block; animation: colorCycle 4s infinite;">⏰</span>
    </div>
    
    <!-- Main Title -->
    <h3 style="color: #ffffff; font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0; text-shadow: 0 0 20px rgba(79, 205, 196, 0.8);">
      <span style="background: linear-gradient(135deg, #4ecdc4, #ff6b6b, #45b7d1, #feca57); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent;">
        ChronosAI
      </span>
    </h3>
    
    <!-- Subtitle -->
    <p style="color: #e0e0e0; font-size: 1rem; margin: 0 0 1rem 0; text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);">
      <em>Intelligent Meeting Scheduler & Calendar Management</em>
    </p>
    
    <!-- Team Credit -->
    <div style="margin-top: 1.5rem;">
      <p style="color: #ffffff; font-size: 1rem; margin: 0; text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);">
        <span style="display: inline-block; animation: pulse 2s infinite;">❤️</span>
        <span style="color: #4ecdc4;"> Made with</span>
        <span style="color: #45b7d1;"> passion by</span>
        <span style="color: #feca57;"> the</span>
        <span style="color: #ff9ff3;"> ChronosAI</span>
        <span style="color: #ffffff;"> Team</span>
      </p>
    </div>
    
    <!-- Social Links -->
    <div style="margin-top: 1rem; display: flex; justify-content: center; gap: 1rem;">
      <a href="https://github.com/johan-droid/ChronusAI" target="_blank" 
         style="color: #4ecdc4; text-decoration: none; padding: 0.5rem 1rem; border: 1px solid #4ecdc4; border-radius: 0.5rem; transition: all 0.3s ease; background: rgba(78, 205, 196, 0.1);">
        <strong>GitHub</strong>
      </a>
      <a href="https://chronusai.onrender.com" target="_blank" 
         style="color: #ff6b6b; text-decoration: none; padding: 0.5rem 1rem; border: 1px solid #ff6b6b; border-radius: 0.5rem; transition: all 0.3s ease; background: rgba(255, 107, 107, 0.1);">
        <strong>Live Demo</strong>
      </a>
    </div>
  </div>
  
  <!-- CSS Animations -->
  <style>
    @keyframes lightRay1 {
      0% { left: -100%; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { left: 100%; opacity: 0; }
    }
    
    @keyframes lightRay2 {
      0% { left: -100%; opacity: 0; }
      10% { opacity: 0.8; }
      90% { opacity: 0.8; }
      100% { left: 100%; opacity: 0; }
    }
    
    @keyframes lightRay3 {
      0% { left: -100%; opacity: 0; }
      10% { opacity: 0.6; }
      90% { opacity: 0.6; }
      100% { left: 100%; opacity: 0; }
    }
    
    @keyframes particle1 {
      0% { left: 0; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { left: 100%; opacity: 0; }
    }
    
    @keyframes particle2 {
      0% { left: 0; opacity: 0; }
      10% { opacity: 0.8; }
      90% { opacity: 0.8; }
      100% { left: 100%; opacity: 0; }
    }
    
    @keyframes particle3 {
      0% { left: 0; opacity: 0; }
      10% { opacity: 0.6; }
      90% { opacity: 0.6; }
      100% { left: 100%; opacity: 0; }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    @keyframes colorCycle {
      0% { color: #4ecdc4; }
      25% { color: #ff6b6b; }
      50% { color: #45b7d1; }
      75% { color: #feca57; }
      100% { color: #4ecdc4; }
    }
  </style>
</div>
