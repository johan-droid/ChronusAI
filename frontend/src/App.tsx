import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { lazy, Suspense, memo } from 'react';
import { useAuthStore } from './store/authStore';
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

// Lazy load components for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const StatsOverview = lazy(() => import('./pages/StatsOverview'));
const Chat = lazy(() => import('./pages/Chat'));
const Availability = lazy(() => import('./pages/AvailabilityNew'));
const History = lazy(() => import('./pages/HistoryNew'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Optimized Background Component
const OptimizedBackground = memo(() => (
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
));

OptimizedBackground.displayName = 'OptimizedBackground';

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    // Clear any OAuth remnants and redirect
    sessionStorage.clear();
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background relative">
          <OptimizedBackground />
          
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(20, 15, 35, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 140, 0, 0.2)',
            color: 'white',
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
