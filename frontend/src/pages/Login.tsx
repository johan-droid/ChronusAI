import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ColorBends from '../components/ColorBends';
import AnimatedLogo from '../components/AnimatedLogo';
import AuthDebug from '../components/AuthDebug';
import { Loader2, Shield, Sparkles, Zap, Lock, Mail, Key, User as UserIcon, ArrowRight } from 'lucide-react';
import { apiClient } from '../lib/api';
import { clearAllCache } from '../lib/cache';
import { useAuthStore } from '../store/authStore';

type AuthMode = 'login' | 'signup' | 'oauth';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('oauth');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    clearAllCache();

    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (accessToken && refreshToken) {
      setIsLoading(true);
      window.history.replaceState({}, document.title, '/login');

      (async () => {
        try {
          useAuthStore.getState().setAuth(
            {
              id: '',
              email: '',
              full_name: '',
              timezone: 'UTC',
              provider: 'google',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            accessToken,
            refreshToken
          );

          const userData = await apiClient.getCurrentUser();
          if (!userData || !userData.id || !userData.email) {
            throw new Error('Invalid user data received');
          }

          useAuthStore.getState().setAuth(userData, accessToken, refreshToken);
          await new Promise(resolve => setTimeout(resolve, 100));
          navigate('/dashboard', { replace: true });
        } catch (error) {
          console.error('Authentication failed:', error);
          useAuthStore.getState().logout();
          clearAllCache();
          setError('Authentication failed. Please try again.');
          setIsLoading(false);
        }
      })();
    } else {
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleOAuthLogin = async (provider: 'google' | 'outlook') => {
    try {
      setIsLoading(true);
      setError('');
      useAuthStore.getState().logout();
      clearAllCache();
      sessionStorage.clear();

      const response = await apiClient.getAuthUrl(provider);
      if (!response || !response.auth_url) {
        throw new Error('No auth URL received from server');
      }

      if (response.state) {
        sessionStorage.setItem('oauth_state', response.state);
      }
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_timestamp', Date.now().toString());

      window.location.href = response.auth_url;
    } catch (error: unknown) {
      console.error('OAuth login error:', error);
      const errorMsg = (error as any)?.response?.data?.detail || (error as Error)?.message || 'Failed to initiate login';
      setError(errorMsg);
      setIsLoading(false);
      sessionStorage.clear();
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');

      let response;
      if (mode === 'signup') {
        response = await apiClient.signup(formData);
      } else {
        response = await apiClient.login({
          email: formData.email,
          password: formData.password
        });
      }

      const { user, access_token, refresh_token } = response;
      useAuthStore.getState().setAuth(user, access_token, refresh_token);
      navigate('/dashboard', { replace: true });
    } catch (error: unknown) {
      console.error('Email auth error:', error);
      const errorMsg = (error as any)?.response?.data?.detail || (error as Error)?.message || 'Authentication failed';
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
        <ColorBends
          colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
          rotation={0}
          speed={0.15}
          scale={1.2}
          frequency={0.4}
          warpStrength={1.2}
          mouseInfluence={1.5}
          parallax={0.8}
          noise={0.05}
          transparent
          autoRotate={0.05}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030303]/50 to-[#030303]" />
      </div>

      <div className="stars opacity-20" />
      <div className="space-particles opacity-20" />

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">

          {/* Left Side - Visual Content */}
          <div className="hidden lg:flex flex-col space-y-8 animate-slide-in-left">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <AnimatedLogo className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ChronosAI</h1>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                Schedule Smarter,
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Not Harder
                </span>
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                The most advanced AI scheduling assistant that understands your time like you do.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 space-y-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold text-white">Smart NLP</h3>
                <p className="text-xs text-slate-400">Natural language processing for human-like interactions.</p>
              </div>
              <div className="glass-card p-4 space-y-2">
                <Zap className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-white">Auto-Sync</h3>
                <p className="text-xs text-slate-400">Real-time calendar synchronization across all platforms.</p>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div className="w-full max-w-md mx-auto animate-slide-in-right">
            <div className="glass-card rounded-3xl p-8 shadow-2xl border-white/5 bg-white/[0.02] backdrop-blur-2xl">

              {/* Header */}
              <div className="text-center mb-8">
                <div className="lg:hidden flex justify-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-2xl">
                    <AnimatedLogo className="h-6 w-6" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {mode === 'oauth' ? 'Welcome Back' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-slate-400 text-sm">
                  {mode === 'oauth' ? 'Choose your preferred login method' : 'Enter your details to continue'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl animate-fade-in flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Auth Selection */}
              {mode === 'oauth' ? (
                <div className="space-y-4">
                  <button
                    onClick={() => handleOAuthLogin('google')}
                    disabled={isLoading}
                    className="w-full h-[60px] bg-white hover:bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 font-semibold shadow-lg hover:scale-[1.02] disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                  <button
                    onClick={() => handleOAuthLogin('outlook')}
                    disabled={isLoading}
                    className="w-full h-[60px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 font-semibold hover:scale-[1.02] disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
                      <rect x="2" y="13" width="9" height="9" fill="#7FBA00" />
                      <rect x="13" y="2" width="9" height="9" fill="#00A4EF" />
                      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
                    </svg>
                    Continue with Microsoft
                  </button>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-[#0b0c10] px-3 text-slate-500 font-medium">OR USE EMAIL</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setMode('login')}
                    className="w-full py-3 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Continue with Email & Password
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="John Doe"
                          className="w-full bg-white/[0.03] border border-white/10 focus:border-blue-500/50 rounded-2xl py-3 pl-12 pr-4 text-white outline-none transition-all placeholder:text-slate-600"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="hello@example.com"
                        className="w-full bg-white/[0.03] border border-white/10 focus:border-blue-500/50 rounded-2xl py-3 pl-12 pr-4 text-white outline-none transition-all placeholder:text-slate-600"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="••••••••"
                        className="w-full bg-white/[0.03] border border-white/10 focus:border-blue-500/50 rounded-2xl py-3 pl-12 pr-4 text-white outline-none transition-all placeholder:text-slate-600"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-[52px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-bold shadow-xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 mt-6"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>

                  <div className="flex flex-col gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {mode === 'login' ? "Don't have an account? Create one" : "Already have an account? Sign in"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('oauth')}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1"
                    >
                      Wait, use Social Login instead
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Verification Badges */}
            <div className="mt-8 flex items-center justify-center gap-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              <div className="flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <Shield className="h-3 w-3" />
                SOC 2 TYPE II
              </div>
              <div className="flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <Lock className="h-3 w-3" />
                GDPR COMPLIANT
              </div>
              <div className="flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <Sparkles className="h-3 w-3" />
                ISO 27001
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading && mode === 'oauth' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] animate-fade-in">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 animate-ping opacity-20 bg-blue-500 rounded-full" />
              <div className="relative w-16 h-16 border-4 border-blue-500 border-t-transparent animate-spin rounded-full shadow-2xl" />
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold text-lg">Authenticating...</p>
              <p className="text-slate-400 text-sm">Please wait while we connect your account</p>
            </div>
          </div>
        </div>
      )}

      {/* AuthDebug only in Dev */}
      {import.meta.env.DEV && <AuthDebug />}
    </div>
  );
}
