import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Mail, Sparkles, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setIsAnimated(true), 100);
    
    // Check for token in URL (OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem('auth_token', token);
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleOAuthLogin = async (provider: 'google' | 'outlook') => {
    try {
      setIsLoading(true);
      setError('');
      
      const { auth_url } = await apiClient.getAuthUrl(provider);
      
      if (!auth_url) {
        throw new Error('No auth URL received');
      }
      
      // Redirect to OAuth provider
      window.location.href = auth_url;
    } catch (error: any) {
      console.error('OAuth login error:', error);
      setError(error?.response?.data?.detail || 'Failed to initiate login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Planets */}
      <div className="planet planet-1" />
      <div className="planet planet-2" />
      <div className="planet planet-3" />

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className={`max-w-md w-full space-y-8 relative z-10 transition-all duration-1000 ${isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Logo and Title */}
        <div className="text-center space-y-6">
          <div className="flex justify-center relative">
            <div className="absolute inset-0 animate-spin-slow">
              <div className="h-24 w-24 rounded-full border-2 border-primary/30 border-t-primary" />
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-gradient-to-r from-primary via-accent to-secondary opacity-50 animate-pulse" />
              <Calendar className="h-20 w-20 text-primary relative z-10 drop-shadow-[0_0_15px_rgba(102,126,234,0.9)]" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl font-bold gradient-text tracking-tight">
              ChronosAI
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
              <p>AI-Powered Meeting Scheduler</p>
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            </div>
            <p className="text-lg text-foreground/80 mt-4">
              Schedule smarter, not harder
            </p>
          </div>
        </div>
        
        {/* Login Cards */}
        <div className="mt-12 space-y-4">
          {error && (
            <div className="glass rounded-lg p-4 border border-destructive/50 bg-destructive/10">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          {/* Google Login */}
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="w-full group relative overflow-hidden glass rounded-xl p-6 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000">
              <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : (
                    <Mail className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">Continue with Google</p>
                  <p className="text-sm text-muted-foreground">Fast and secure</p>
                </div>
              </div>
            </div>
          </button>
          
          {/* Microsoft Login */}
          <button
            onClick={() => handleOAuthLogin('outlook')}
            disabled={isLoading}
            className="w-full group relative overflow-hidden glass rounded-xl p-6 border border-white/10 hover:border-secondary/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000">
              <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-secondary/20 to-primary/20">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 text-secondary animate-spin" />
                  ) : (
                    <Mail className="h-6 w-6 text-secondary" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">Continue with Microsoft</p>
                  <p className="text-sm text-muted-foreground">Office 365 integration</p>
                </div>
              </div>
            </div>
          </button>
        </div>
        
        {/* Footer */}
        <div className="text-center space-y-4 pt-8">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to connect your calendar account
          </p>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 animate-spin">
                <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary" />
              </div>
              <Calendar className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-foreground animate-pulse">Connecting to ChronosAI...</p>
          </div>
        </div>
      )}
    </div>
  );
}
