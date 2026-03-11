import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import React, { lazy, Suspense, memo, useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import Footer from './components/Footer';
import Toast from './components/Toast';
import './index.css';

// Hide footer on authenticated app pages
const AUTHENTICATED_PATHS = ['/dashboard', '/chat', '/availability', '/history', '/settings'];
const ConditionalFooter = () => {
  const location = useLocation();
  const currentPath = location.pathname.replace(/\/$/, '') || '/';
  if (AUTHENTICATED_PATHS.includes(currentPath)) return null;
  return <Footer />;
};


// Lazy load components for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const StatsOverview = lazy(() => import('./pages/StatsOverview'));
const Chat = lazy(() => import('./pages/Chat'));
const Availability = lazy(() => import('./pages/AvailabilityNew'));
const History = lazy(() => import('./pages/HistoryNew'));
const Settings = lazy(() => import('./pages/Settings'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Android Mobile Detection
const isAndroidDevice = () => {
  return /Android/i.test(navigator.userAgent) || /android/i.test(navigator.userAgent);
};

const isMobileDevice = () => {
  return /Mobi|Android/i.test(navigator.userAgent);
};

// Optimized Background Component
const OptimizedBackground = memo(() => {
  const [isMobile] = useState(() => isMobileDevice());

  if (isMobile) {
    return (
      <div className="galaxy-bg opacity-30" />
    );
  }

  return (
    <>
      {/* Galaxy Background */}
      <div className="galaxy-bg" />

      {/* Optimized Stars - Reduced count for better performance */}
      <div className="stars">
        <div className="star" />
        <div className="star" />
        <div className="star" />
        <div className="star" />
        <div className="star" />
      </div>

      {/* Shooting Stars - Reduced for mobile */}
      <div className="shooting-star" />
      <div className="shooting-star" />

      {/* Planets - Hidden on mobile for performance */}
      <div className="planet planet-1" />
      <div className="planet planet-2" />
    </>
  );
});

OptimizedBackground.displayName = 'OptimizedBackground';

// Loading Component with Android optimizations
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-primary/30 border-t-transparent animate-spin rounded-full"></div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  </div>
);




// OAuth Callback Guard Component
function OAuthCallbackGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Login page with tokens in URL = success callback; let Login component handle it
  const isLoginWithTokens = location.pathname === '/login' && location.search.includes('access_token=');

  // Other OAuth callback URLs (e.g. /auth/..., code= without access_token yet)
  const isOAuthCallback = !isLoginWithTokens && (
    location.pathname.includes('/auth/') ||
    location.pathname.includes('/callback') ||
    location.search.includes('code=')
  );

  useEffect(() => {
    if (isLoginWithTokens) return;
    if (!isLoading && !isAuthenticated && isOAuthCallback) {
      window.history.replaceState({}, document.title, '/login');
      window.location.href = '/login' + location.search;
    }
  }, [isAuthenticated, isLoading, isOAuthCallback, isLoginWithTokens, location.search]);

  // When on /login?access_token=..., always render children so Login can process the callback
  if (isLoginWithTokens) {
    return <>{children}</>;
  }
  if (!isLoading && !isAuthenticated && isOAuthCallback) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
          <p className="text-xl text-white">Something went wrong loading the component.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 rounded text-white font-medium">Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Clear any OAuth remnants and redirect safely outside render cycle
    if (!isLoading && !isAuthenticated) {
      sessionStorage.clear();
      localStorage.removeItem('auth-storage');
    }
  }, [isLoading, isAuthenticated]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const [isMobile] = useState(() => isMobileDevice());

  useEffect(() => {
    // Add Android-specific optimizations
    if (isAndroidDevice()) {
      // Prevent zoom on input focus
      const handleTouchStart = (e: TouchEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          e.target.style.fontSize = '16px';
        }
      };

      document.addEventListener('touchstart', handleTouchStart);

      // Add viewport meta tag for Android
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
      };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background relative flex flex-col">
          <OptimizedBackground />

          {/* Mobile Navigation handled by individual pages */}

          <main className="flex-1 relative z-5 overflow-y-auto">
            <OAuthCallbackGuard>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <StatsOverview />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/chat"
                      element={
                        <ProtectedRoute>
                          <Chat />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/availability"
                      element={
                        <ProtectedRoute>
                          <Availability />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/history"
                      element={
                        <ProtectedRoute>
                          <History />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </OAuthCallbackGuard>
          </main>

          <ConditionalFooter />
          <Toast />
        </div>
      </Router>
      <Toaster
        position={isMobile ? "bottom-center" : "top-right"}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(20, 15, 35, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 140, 0, 0.2)',
            color: 'white',
            ...(isMobile && {
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              right: 'auto',
              margin: '0 auto',
              maxWidth: 'calc(100vw - 32px)',
            })
          },
        }}
      />
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;
