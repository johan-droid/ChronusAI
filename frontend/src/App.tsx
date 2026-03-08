import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { lazy, Suspense, memo, useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import Footer from './components/Footer';
import './index.css';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

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

// Mobile Navigation Component
const MobileNavigation = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = isMobileDevice();

  // Hide hamburger on Login, Signup and Landing pages
  const hidePaths = ['/login', '/signup', '/'];
  const currentPath = location.pathname.replace(/\/$/, '') || '/';

  if (!isMobile || hidePaths.includes(currentPath)) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/30">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-lg bg-card/50 border border-border/30 text-foreground"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border/30">
          <div className="p-4 space-y-2">
            <a
              href="/dashboard"
              className="block px-4 py-3 text-foreground hover:bg-card/50 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </a>
            <a
              href="/chat"
              className="block px-4 py-3 text-foreground hover:bg-card/50 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              AI Chat
            </a>
            <a
              href="/availability"
              className="block px-4 py-3 text-foreground hover:bg-card/50 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Availability
            </a>
            <a
              href="/history"
              className="block px-4 py-3 text-foreground hover:bg-card/50 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              History
            </a>
            <a
              href="/settings"
              className="block px-4 py-3 text-foreground hover:bg-card/50 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Settings
            </a>
          </div>
        </div>
      )}
    </div>
  );
});

MobileNavigation.displayName = 'MobileNavigation';

// OAuth Callback Guard Component
function OAuthCallbackGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Check if current URL is an OAuth callback
  const isOAuthCallback = location.pathname.includes('/auth/') ||
    location.pathname.includes('/callback') ||
    location.search.includes('code=') ||
    location.search.includes('access_token=');

  useEffect(() => {
    // If user is not authenticated and we're on an OAuth callback URL,
    // redirect to login to prevent back button navigation issues
    if (!isLoading && !isAuthenticated && isOAuthCallback) {
      // Clear the problematic URL from history
      window.history.replaceState({}, document.title, '/login');
      // Force navigation to login
      window.location.href = '/login' + location.search;
    }
  }, [isAuthenticated, isLoading, isOAuthCallback]);

  // If on OAuth callback URL and not authenticated, show loading
  if (!isLoading && !isAuthenticated && isOAuthCallback) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading indicator while checking authentication
  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    // Clear any OAuth remnants and redirect
    sessionStorage.clear();
    localStorage.removeItem('auth-storage');
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

          {/* Mobile Navigation */}
          <MobileNavigation />

          <main className="flex-1 relative z-5">
            <OAuthCallbackGuard>
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
            </OAuthCallbackGuard>
          </main>

          <Footer />
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
