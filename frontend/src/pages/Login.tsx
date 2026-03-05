import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Mail } from 'lucide-react';
import { apiClient } from '../lib/api';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleOAuthLogin = async (provider: 'google' | 'outlook') => {
    try {
      setIsLoading(true);
      const { auth_url } = await apiClient.getAuthUrl(provider);
      
      // Redirect to OAuth provider
      window.location.href = auth_url;
    } catch (error) {
      console.error('OAuth login error:', error);
      setIsLoading(false);
    }
  };

  // Check for token in URL (OAuth callback)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    // Store token and fetch user info
    localStorage.setItem('auth_token', token);
    // Redirect to dashboard
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Calendar className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            AI Meeting Scheduler
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Schedule meetings with natural language
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="space-y-3">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              aria-label="Continue with Google"
              className="w-full flex items-center justify-center px-4 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="h-5 w-5 mr-2" />
              Continue with Google
            </button>
            
            <button
              onClick={() => handleOAuthLogin('outlook')}
              disabled={isLoading}
              aria-label="Continue with Microsoft"
              className="w-full flex items-center justify-center px-4 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="h-5 w-5 mr-2" />
              Continue with Microsoft
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to connect your calendar account
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
