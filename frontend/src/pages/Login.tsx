import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ColorBends from '../components/ColorBends';
import AnimatedLogo from '../components/AnimatedLogo';
import AuthDebug from '../components/AuthDebug';
import { Loader2, Shield, Sparkles, Zap, Lock } from 'lucide-react';
import { apiClient } from '../lib/api';
import { clearAllCache } from '../lib/cache';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    clearAllCache();

    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Validate tokens before setting auth
      setIsLoading(true);

      // Clear URL immediately for security
      window.history.replaceState({}, document.title, '/login');

      // Verify tokens with backend
      (async () => {
        try {
          // Set temporary auth to make API call
          useAuthStore.getState().setAuth(
            {
              id: '',
              email: '',
              full_name: '',
              timezone: 'UTC',
              provider: 'google',
            },
            accessToken,
            refreshToken
          );

          // Fetch and verify user data
          const userData = await apiClient.getCurrentUser();

          // Only proceed if we got valid user data
          if (!userData || !userData.id || !userData.email) {
            throw new Error('Invalid user data received');
          }

          // Set authenticated state with real user data
          useAuthStore.getState().setAuth(userData, accessToken, refreshToken);

          // Small delay to ensure auth state is properly set
          await new Promise(resolve => setTimeout(resolve, 100));

          // Navigate to dashboard
          navigate('/dashboard', { replace: true });
        } catch (error) {
          console.error('Authentication failed:', error);
          // Clear any partial auth state
          useAuthStore.getState().logout();
          clearAllCache();
          setError('Authentication failed. Please try again.');
          setIsLoading(false);
        }
      })();
    } else {
      // Check if user is already authenticated
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

      // Clear any existing auth state
      useAuthStore.getState().logout();
      clearAllCache();
      sessionStorage.clear();

      const response = await apiClient.getAuthUrl(provider);

      if (!response || !response.auth_url) {
        throw new Error('No auth URL received from server');
      }

      // Validate state parameter
      if (!response.state || response.state.length < 32) {
        throw new Error('Invalid security state received');
      }

      // Store state for CSRF protection
      sessionStorage.setItem('oauth_state', response.state);
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_timestamp', Date.now().toString());

      if (response.verifier) {
        sessionStorage.setItem('oauth_verifier', response.verifier);
      }

      // Redirect to OAuth provider
      window.location.href = response.auth_url;
    } catch (error: unknown) {
      console.error('OAuth login error:', error);
      const errorMsg = (error as any)?.response?.data?.detail || (error as Error)?.message || 'Failed to initiate login';
      setError(errorMsg);
      setIsLoading(false);

      // Clear any partial state
      sessionStorage.clear();
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-foreground relative overflow-hidden font-sans">
      {/* Dynamic ColorBends Background - Full Page Coverage */}
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

      {/* Legacy Galaxy Elements (Subtle) */}
      <div className="stars opacity-20" />
      <div className="space-particles opacity-20" />
      <div className="planet planet-1 opacity-20" />
      <div className="planet planet-2 opacity-20" />

      {/* Main Content - Side by Side */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-md">
            {/* Logo & Header */}
            <div className="text-center mb-4 lg:mb-8 animate-fade-in">
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-50 animate-pulse" />
                  <div className="relative w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-2xl">
                    <AnimatedLogo className="h-6 w-6 lg:h-8 lg:w-8" />
                  </div>
                </div>
              </div>
              <h1 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">ChronosAI</h1>
              <p className="text-slate-400 text-xs lg:text-sm">AI-Powered Calendar Scheduling</p>
            </div>

            {/* Login Card */}
            <div className="glass-card rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-2xl animate-slide-in-left border-white/5 bg-white/[0.01]">
              <div className="text-center mb-4 lg:mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
                <p className="text-muted-foreground text-sm">Sign in to manage your calendar</p>
              </div>

              {error && (
                <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-red-500/10 border border-red-500/30 rounded-xl lg:rounded-2xl animate-fade-in">
                  <p className="text-xs lg:text-sm text-red-400 text-center">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                {/* Google Login */}
                <button
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading}
                  className="w-full group bg-white hover:bg-gray-50 text-gray-900 rounded-xl lg:rounded-2xl p-3 lg:p-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center gap-3">
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    <span className="font-semibold text-sm lg:text-base">Continue with Google</span>
                  </div>
                </button>

                {/* Microsoft Login */}
                <button
                  onClick={() => handleOAuthLogin('outlook')}
                  disabled={isLoading}
                  className="w-full group glass-card border-white/10 hover:border-white/20 text-foreground rounded-xl lg:rounded-2xl p-3 lg:p-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/[0.02] hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center gap-3">
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <rect x="2" y="2" width="9" height="9" fill="#F25022"/>
                        <rect x="2" y="13" width="9" height="9" fill="#7FBA00"/>
                        <rect x="13" y="2" width="9" height="9" fill="#00A4EF"/>
                        <rect x="13" y="13" width="9" height="9" fill="#FFB900"/>
                      </svg>
                    )}
                    <span className="font-semibold text-sm lg:text-base">Continue with Microsoft</span>
                  </div>
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-4 lg:my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-transparent px-3 text-muted-foreground">Secure Authentication</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-green-400" />
                  <span className="text-xs lg:text-xs">Enterprise-grade security with OAuth 2.0</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-blue-400" />
                  <span className="text-xs lg:text-xs">AI-powered meeting scheduling</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-purple-400" />
                  <span className="text-xs lg:text-xs">Instant calendar synchronization</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 lg:mt-6 text-center">
              <div className="flex items-center justify-center gap-3 lg:gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span className="text-xs">SOC 2 Compliant</span>
                </div>
                <span className="text-xs">•</span>
                <span className="text-xs">GDPR Ready</span>
                <span className="text-xs">•</span>
                <span className="text-xs">99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Welcome Content */}
        <div className="hidden lg:flex relative z-10 w-1/2 items-center justify-center p-12 border-l border-white/5">
          <div className="max-w-xl animate-slide-in-right">
            <div className="space-y-8">
              {/* Main Heading */}
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                  Schedule Smarter,
                  <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Not Harder
                  </span>
                </h2>
                <p className="text-lg lg:text-xl text-slate-300 leading-relaxed">
                  Transform your calendar management with AI-powered scheduling that understands natural language.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-6">
                <div className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl lg:rounded-2xl flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                    <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-white mb-1">Natural Language Processing</h3>
                    <p className="text-slate-400 text-sm lg:text-base">Simply type "Schedule a meeting with John tomorrow at 3pm" and let AI handle the rest.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl lg:rounded-2xl flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
                    <Zap className="h-5 w-5 lg:h-6 lg:w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-white mb-1">Instant Synchronization</h3>
                    <p className="text-slate-400 text-sm lg:text-base">Real-time sync with Google Calendar and Microsoft Outlook keeps everyone on the same page.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-xl lg:rounded-2xl flex items-center justify-center border border-pink-500/30 group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5 lg:h-6 lg:w-6 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-white mb-1">Enterprise Security</h3>
                    <p className="text-slate-400 text-sm lg:text-base">Bank-level encryption and OAuth 2.0 authentication protect your sensitive calendar data.</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 lg:gap-6 pt-6 lg:pt-8 border-t border-white/10">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">10K+</div>
                  <div className="text-xs lg:text-sm text-slate-400">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">50K+</div>
                  <div className="text-xs lg:text-sm text-slate-400">Meetings Scheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent mb-1">99.9%</div>
                  <div className="text-xs lg:text-sm text-slate-400">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Welcome Content - Below Login */}
      <div className="lg:hidden relative z-10 bg-white/[0.02] backdrop-blur-xl border-t border-white/5 p-4 pb-8">
        <div className="max-w-xl mx-auto animate-slide-in-up">
          <div className="space-y-4">
            {/* Mobile Heading */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2 leading-tight">
                Schedule Smarter,
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Not Harder
                </span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Transform your calendar management with AI-powered scheduling that understands natural language.
              </p>
            </div>

            {/* Mobile Feature Highlights */}
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Natural Language Processing</h3>
                  <p className="text-slate-400 text-xs">Simply type "Schedule a meeting with John tomorrow at 3pm" and let AI handle the rest.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                  <Zap className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Instant Synchronization</h3>
                  <p className="text-slate-400 text-xs">Real-time sync with Google Calendar and Microsoft Outlook keeps everyone on the same page.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-lg flex items-center justify-center border border-pink-500/30">
                  <Shield className="h-4 w-4 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Enterprise Security</h3>
                  <p className="text-slate-400 text-xs">Bank-level encryption and OAuth 2.0 authentication protect your sensitive calendar data.</p>
                </div>
              </div>
            </div>

            {/* Mobile Stats */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
              <div className="text-center">
                <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">10K+</div>
                <div className="text-xs text-slate-400">Users</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">50K+</div>
                <div className="text-xs text-slate-400">Meetings</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent mb-1">99.9%</div>
                <div className="text-xs text-slate-400">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 animate-spin">
                <div className="h-16 w-16 rounded-full border-4 border-blue-500/20 border-t-blue-500" />
              </div>
              <AnimatedLogo className="h-8 w-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <p className="text-white font-medium">Authenticating...</p>
              <p className="text-slate-400 text-sm">Connecting to your calendar</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug Component */}
      <AuthDebug />
    </div>
  );
}