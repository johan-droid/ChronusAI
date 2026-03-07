import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Loader2, Shield, ArrowRight, CheckCircle, Zap, Users, Clock, Sparkles, Star } from 'lucide-react';
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
        { id: '', email: '', full_name: '', timezone: 'UTC', provider: 'outlook' } as any,
        accessToken,
        refreshToken
      );

      window.history.replaceState({}, document.title, '/login');

      setTimeout(async () => {
        try {
          const userData = await apiClient.getCurrentUser();
          useAuthStore.getState().setAuth(userData, accessToken, refreshToken);
          window.history.replaceState(null, '', '/dashboard');
          navigate('/dashboard', { replace: true });
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          setError('Authentication failed. Please try again.');
        }
      }, 100);
    }
  }, [navigate]);

  const handleOAuthLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await apiClient.getAuthUrl('outlook');

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
    { icon: <Zap className="h-5 w-5" />, title: "AI-Powered Scheduling", desc: "Let AI handle the complexity" },
    { icon: <Users className="h-5 w-5" />, title: "Multi-Calendar Sync", desc: "Unified calendar experience" },
    { icon: <Clock className="h-5 w-5" />, title: "Smart Conflicts", desc: "Resolve overlaps instantly" },
    { icon: <Shield className="h-5 w-5" />, title: "Enterprise Security", desc: "SOC 2 & GDPR compliant" }
  ];

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg-layer" />
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-container">
        {/* Left Side - Branding & Features */}
        <div className={`login-hero ${isAnimated ? 'login-hero--visible' : ''}`}>
          <div className="login-hero-inner">
            {/* Logo */}
            <div className="login-logo">
              <div className="login-logo-icon">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="login-logo-text">ChronosAI</h1>
                <p className="login-logo-sub">Enterprise Meeting Intelligence</p>
              </div>
            </div>

            {/* Hero headline */}
            <div className="login-headline">
              <h2 className="login-headline-main">
                Schedule meetings with
                <span className="login-headline-gradient"> natural language</span>
              </h2>
              <p className="login-headline-sub">
                Transform your calendar management with AI-powered scheduling.
                Simply tell ChronosAI what you need, and watch it handle the rest.
              </p>
            </div>

            {/* Feature cards */}
            <div className="login-features">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="login-feature-card"
                  style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                >
                  <div className="login-feature-icon">{feature.icon}</div>
                  <div>
                    <p className="login-feature-title">{feature.title}</p>
                    <p className="login-feature-desc">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats strip */}
            <div className="login-stats">
              <div className="login-stat">
                <span className="login-stat-value">99.9%</span>
                <span className="login-stat-label">Uptime SLA</span>
              </div>
              <div className="login-stat-divider" />
              <div className="login-stat">
                <span className="login-stat-value">10k+</span>
                <span className="login-stat-label">Meetings Scheduled</span>
              </div>
              <div className="login-stat-divider" />
              <div className="login-stat">
                <span className="login-stat-value">500+</span>
                <span className="login-stat-label">Enterprise Users</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className={`login-form-wrapper ${isAnimated ? 'login-form-wrapper--visible' : ''}`}>
          {/* Mobile logo */}
          <div className="login-mobile-logo">
            <div className="login-logo-icon login-logo-icon--lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h1 className="login-logo-text login-logo-text--lg">ChronosAI</h1>
            <p className="login-logo-sub">Enterprise AI Meeting Scheduler</p>
          </div>

          {/* Card */}
          <div className="login-card">
            <div className="login-card-header">
              <div className="login-card-badge">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Secure Sign In</span>
              </div>
              <h2 className="login-card-title">Welcome back</h2>
              <p className="login-card-subtitle">
                Sign in with your Microsoft account to continue
              </p>
            </div>

            {error && (
              <div className="login-error">
                <p>{error}</p>
              </div>
            )}

            {/* Microsoft Login Button */}
            <button
              onClick={handleOAuthLogin}
              disabled={isLoading}
              className="login-oauth-btn"
              id="microsoft-login-btn"
            >
              <div className="login-oauth-btn-inner">
                <div className="login-oauth-btn-icon">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none">
                      <rect width="11" height="11" fill="#f25022" />
                      <rect x="12" width="11" height="11" fill="#7fba00" />
                      <rect y="12" width="11" height="11" fill="#00a4ef" />
                      <rect x="12" y="12" width="11" height="11" fill="#ffb900" />
                    </svg>
                  )}
                </div>
                <div className="login-oauth-btn-text">
                  <p className="login-oauth-btn-label">Continue with Microsoft</p>
                  <p className="login-oauth-btn-desc">Access your Microsoft 365 workspace</p>
                </div>
                <ArrowRight className="login-oauth-btn-arrow" />
              </div>
            </button>

            {/* Security footer */}
            <div className="login-security">
              <Shield className="h-3.5 w-3.5" />
              <p>Secured with OAuth 2.0 & enterprise-grade encryption</p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="login-trust">
            <div className="login-trust-item">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>SOC 2 Compliant</span>
            </div>
            <div className="login-trust-item">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>GDPR Ready</span>
            </div>
            <div className="login-trust-item">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="login-overlay">
          <div className="login-overlay-inner">
            <div className="login-overlay-spinner">
              <div className="login-overlay-ring" />
              <Calendar className="h-6 w-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="login-overlay-text">Authenticating...</p>
            <p className="login-overlay-sub">Connecting to your Microsoft account</p>
          </div>
        </div>
      )}
    </div>
  );
}