import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Mail, Loader2, Shield, Sparkles, ArrowRight, CheckCircle, Zap, Users, Clock } from 'lucide-react';
import { apiClient } from '../lib/api';
import { clearAllCache } from '../lib/cache';
import { useAuthStore } from '../store/authStore';

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
      useAuthStore.getState().setAuth(
        { id: '', email: '', full_name: '', timezone: 'UTC', provider: 'google' } as any,
        accessToken,
        refreshToken
      );
      
      window.history.replaceState({}, document.title, '/login');
      
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

  const features = [
    { icon: <Zap className="h-4 w-4" />, text: "AI-Powered Scheduling" },
    { icon: <Users className="h-4 w-4" />, text: "Multi-Calendar Sync" },
    { icon: <Clock className="h-4 w-4" />, text: "Smart Conflict Resolution" },
    { icon: <Shield className="h-4 w-4" />, text: "Enterprise Security" }
  ];

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Enhanced Galaxy Background */}
      <div className="stars" />
      <div className="space-particles" />
      <div className="planet planet-1" />
      <div className="planet planet-2" />

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 relative">
        <div className="flex flex-col justify-center px-12 xl:px-16 relative z-10">
          <div className={`transition-all duration-1000 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-50 animate-pulse" />
                <Calendar className="h-10 w-10 text-primary relative z-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">ChronosAI</h1>
                <p className="text-xs text-muted-foreground">Enterprise Meeting Scheduler</p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6">
                  Schedule meetings with
                  <span className="gradient-text block">natural language</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  Transform your calendar management with AI-powered scheduling. 
                  Simply tell ChronosAI what you need, and watch it handle the rest.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 glass-card p-4 rounded-lg"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-primary">{feature.icon}</div>
                    <span className="text-sm text-foreground font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold gradient-text">99.9%</div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold gradient-text">10k+</div>
                  <div className="text-xs text-muted-foreground">Meetings Scheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold gradient-text">500+</div>
                  <div className="text-xs text-muted-foreground">Enterprise Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 lg:max-w-md xl:max-w-lg flex items-center justify-center px-6 lg:px-8 relative z-10">
        <div className={`w-full max-w-sm space-y-8 transition-all duration-700 ${isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          
          {/* Mobile Logo */}
          <div className="lg:hidden text-center space-y-4">
            <div className="flex justify-center relative">
              <div className="absolute inset-0 animate-spin-slow">
                <div className="h-16 w-16 rounded-full border border-primary/20 border-t-primary" />
              </div>
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse" />
                <Calendar className="h-12 w-12 text-primary relative z-10" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">ChronosAI</h1>
              <p className="text-sm text-muted-foreground">Enterprise AI Meeting Scheduler</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to your account to continue
              </p>
            </div>

            {error && (
              <div className="glass rounded-lg p-4 border border-destructive/30 bg-destructive/5 animate-fade-in">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Google Login */}
              <button
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                className="w-full group relative overflow-hidden glass-card rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : (
                        <Mail className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground text-sm">Continue with Google</p>
                      <p className="text-xs text-muted-foreground">Access your Google Workspace</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </button>
              
              {/* Microsoft Login */}
              <button
                onClick={() => handleOAuthLogin('outlook')}
                disabled={isLoading}
                className="w-full group relative overflow-hidden glass-card rounded-xl p-4 border border-white/10 hover:border-secondary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 text-secondary animate-spin" />
                      ) : (
                        <Mail className="h-5 w-5 text-secondary" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground text-sm">Continue with Microsoft</p>
                      <p className="text-xs text-muted-foreground">Access your Microsoft 365</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            </div>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t border-white/5">
              <Shield className="h-3 w-3" />
              <p>Secured with OAuth 2.0 & enterprise-grade encryption</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>GDPR Ready</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 animate-spin">
                <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary" />
              </div>
              <Calendar className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Authenticating...</p>
              <p className="text-xs text-muted-foreground">Connecting to your calendar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}