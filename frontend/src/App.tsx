import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import React, { lazy, Suspense, memo, useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Toast from './components/Toast';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import './index.css';
import './styles/mobile.css';

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

/* ── Media-query based mobile detection (replaces userAgent) ── */
const getIsMobile = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;

/* ── Optimized Background ── */
const OptimizedBackground = memo(() => {
  const [isMobile] = useState(getIsMobile);

  if (isMobile) {
    return <div className="galaxy-bg opacity-30" />;
  }

  return (
    <>
      <div className="galaxy-bg" />
      <div className="stars">
        <div className="star" />
        <div className="star" />
        <div className="star" />
        <div className="star" />
        <div className="star" />
      </div>
      <div className="shooting-star" />
      <div className="shooting-star" />
      <div className="planet planet-1" />
      <div className="planet planet-2" />
    </>
  );
});
OptimizedBackground.displayName = 'OptimizedBackground';

/* ── Page Loader ── */
const PageLoader = () => (
  <div className="min-h-screen-dynamic flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-primary/30 border-t-transparent animate-spin rounded-full" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  </div>
);

/* ── Unified Auth Guard (merged OAuthCallbackGuard + ProtectedRoute) ── */
function AuthGuard({ children, requireAuth = false }: { children: React.ReactNode; requireAuth?: boolean }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Login page with tokens in URL = success callback
  const isLoginWithTokens = location.pathname === '/login' && location.search.includes('access_token=');

  // Other OAuth callback URLs
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

  // OAuth callback in progress
  if (isLoginWithTokens) return <>{children}</>;
  if (!isLoading && !isAuthenticated && isOAuthCallback) return <PageLoader />;

  // Protected route logic
  if (requireAuth) {
    if (isLoading) return <PageLoader />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/* ── Error Boundary ── */
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
        <div className="min-h-screen-dynamic flex flex-col items-center justify-center space-y-4">
          <p className="text-xl text-white">Something went wrong loading the component.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 rounded text-white font-medium">Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── App ── */
function App() {
  const [isMobile] = useState(getIsMobile);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen-dynamic bg-background relative flex flex-col">
          <OptimizedBackground />

          <AuthGuard>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Layout>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<AuthGuard requireAuth><StatsOverview /></AuthGuard>} />
                    <Route path="/chat" element={<AuthGuard requireAuth><Chat /></AuthGuard>} />
                    <Route path="/availability" element={<AuthGuard requireAuth><Availability /></AuthGuard>} />
                    <Route path="/history" element={<AuthGuard requireAuth><History /></AuthGuard>} />
                    <Route path="/settings" element={<AuthGuard requireAuth><Settings /></AuthGuard>} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </Suspense>
            </ErrorBoundary>
          </AuthGuard>

          <Toast />
          <PWAInstallPrompt />
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
            zIndex: 70,
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
