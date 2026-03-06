import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Mail, Loader2, Shield } from 'lucide-react';
import { apiClient } from '../lib/api';
import { clearAllCache } from '../lib/cache';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    clearAllCache();
    setTimeout(() => setIsAnimated(true), 100);
    
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // Store tokens securely
      useAuthStore.getState().setAuth(
        { id: '', email: '', full_name: '', timezone: 'UTC', provider: 'google' } as any,
        accessToken,
        refreshToken
      );
      
      // Clean URL
      window.history.replaceState({}, document.title, '/login');
      
      // Fetch user data and redirect
      setTimeout(async () => {
        try {
          const userData = await apiClient.getCurrentUser();
          useAuthStore.getState().setAuth(userData, accessToken, refreshToken);
          navigate('/dashboard');
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          setError('Authentication failed. Please try again.');
        }
      }, 100);
    }
  }, [navigate]);

  const handleOAuthLogin = async (provider: 'google' | 'outlook') => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await apiClient.getAuthUrl(provider);
      
      if (!response || !response.auth_url) {
        throw new Error('No auth URL received from server');
      }
      
      if (response.state) {
        sessionStorage.setItem('oauth_state', response.state);
      }
      if (response.verifier) {
        sessionStorage.setItem('oauth_verifier', response.verifier);
      }
      
      window.location.href = response.auth_url;
    } catch (error: any) {
      console.error('OAuth login error:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to initiate login';
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="planet planet-1" />
      <div className="planet planet-2" />

      <div className={`max-w-md w-full space-y-8 relative z-10 transition-all duration-700 ${isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="text-center space-y-6">
          <div className="flex justify-center relative">
            <div className="absolute inset-0 animate-spin-slow">
              <div className="h-20 w-20 rounded-full border border-primary/20 border-t-primary" />
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse" />
              <Calendar className="h-16 w-16 text-primary relative z-10" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold gradient-text">
              ChronosAI
            </h1>
            <p className="text-muted-foreground text-sm">
              Enterprise AI Meeting Scheduler
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {error && (
            <div className="glass rounded-lg p-4 border border-destructive/30 bg-destructive/5">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="w-full group relative overflow-hidden glass rounded-lg p-5 border border-white/10 hover:border-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <Mail className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">Google Workspace</p>
                  <p className="text-xs text-muted-foreground">Sign in with Google</p>
                </div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleOAuthLogin('outlook')}
            disabled={isLoading}
            className="w-full group relative overflow-hidden glass rounded-lg p-5 border border-white/10 hover:border-secondary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-2.5 rounded-lg bg-secondary/10">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 text-secondary animate-spin" />
                  ) : (
                    <Mail className="h-5 w-5 text-secondary" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">Microsoft 365</p>
                  <p className="text-xs text-muted-foreground">Sign in with Outlook</p>
                </div>
              </div>
            </div>
          </button>
        </div>
        
        <div className="text-center space-y-4 pt-6">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <p>Enterprise-grade security with OAuth 2.0</p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 animate-spin">
                <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary" />
              </div>
              <Calendar className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm text-muted-foreground">Authenticating...</p>
          </div>
        </div>
      )}
    </div>
  );
}
