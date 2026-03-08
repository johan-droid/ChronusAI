import { Link } from 'react-router-dom';
import { Mail, Github, ExternalLink, Heart, Shield, Zap } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [currentYear] = useState(new Date().getFullYear());

  return (
    <footer className="relative z-10 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-xl border-t border-border/30 mt-auto">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold gradient-text">ChronosAI</h3>
                <p className="text-xs text-muted-foreground">Intelligent Scheduling</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered meeting scheduler that learns your calendar patterns and optimizes your time.
            </p>
            
            <div className="flex items-center gap-3 pt-2">
              <a 
                href="mailto:hello@chronosai.com" 
                className="w-8 h-8 rounded-lg bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a 
                href="https://github.com/johan-droid/ChronusAI" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a 
                href="https://chronusai.onrender.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                aria-label="Live Demo"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Quick Links
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/dashboard"
                className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1 py-1"
              >
                <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                Dashboard
              </Link>
              <Link
                to="/chat"
                className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1 py-1"
              >
                <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                AI Chat
              </Link>
              <Link
                to="/availability"
                className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1 py-1"
              >
                <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                Availability
              </Link>
              <Link
                to="/history"
                className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1 py-1"
              >
                <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                History
              </Link>
              <Link
                to="/settings"
                className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1 py-1"
              >
                <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                Settings
              </Link>
              <Link
                to="/privacy-policy"
                className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1 py-1"
              >
                <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                Privacy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1 py-1"
              >
                <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                Terms
              </Link>
            </div>
          </div>
          
          {/* Legal & Security */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security & Privacy
            </h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 flex-shrink-0"></span>
                <span>End-to-end encrypted authentication</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 flex-shrink-0"></span>
                <span>GDPR & CCPA compliant</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 flex-shrink-0"></span>
                <span>No data sharing with third parties</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 flex-shrink-0"></span>
                <span>Secure OAuth integration</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-border/30 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                © {currentYear} ChronosAI. All rights reserved.
                <Heart className="w-3 h-3 text-red-500" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Built with passion for intelligent scheduling
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Powered by</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-card/50 border border-border/30 rounded-md">Google Calendar API</span>
                <span className="px-2 py-1 bg-card/50 border border-border/30 rounded-md">AI Technology</span>
              </div>
            </div>
          </div>
          
          {/* Attribution */}
          <div className="mt-4 pt-4 border-t border-border/20 text-center">
            <p className="text-xs text-muted-foreground">
              This application uses Google Calendar API for demonstration purposes only. 
              Google™ is a trademark of Google LLC. This application is not affiliated with Google.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
