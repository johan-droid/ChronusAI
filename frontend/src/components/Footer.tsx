import { Link } from 'react-router-dom';
import { Mail, Github, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 bg-background/80 backdrop-blur-md border-t border-border/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              © 2024 ChronosAI. Major Project by Ashutosh Sahoo.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              College Student Project | B.Tech Computer Science
            </p>
            <div className="flex items-center justify-center sm:justify-start space-x-4 mt-2">
              <a 
                href="mailto:sahooashutosh2022@gmail.com" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a 
                href="https://github.com/johan-droid" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a 
                href="https://www.linkedin.com/in/ashutosh-sahoo-064064280" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div className="flex space-x-6 text-sm">
            <Link
              to="/privacy-policy"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Terms of Service
            </Link>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/30">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              This application uses Google Calendar API for educational demonstration purposes only.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Google™ is a trademark of Google LLC. This application is not affiliated with Google.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
