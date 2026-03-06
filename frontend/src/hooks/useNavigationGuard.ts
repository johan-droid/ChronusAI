import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function useNavigationGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Prevent back navigation to OAuth pages
    const handlePopState = (event: PopStateEvent) => {
      const currentPath = window.location.pathname;
      
      // If user is authenticated and tries to go back to login/OAuth pages
      if (isAuthenticated && (currentPath === '/login' || currentPath === '/')) {
        event.preventDefault();
        window.history.pushState(null, '', '/dashboard');
        navigate('/dashboard', { replace: true });
        return;
      }
      
      // If user is not authenticated and tries to access protected pages
      if (!isAuthenticated && currentPath !== '/login' && currentPath !== '/') {
        event.preventDefault();
        window.history.pushState(null, '', '/login');
        navigate('/login', { replace: true });
        return;
      }
    };

    // Add popstate listener
    window.addEventListener('popstate', handlePopState);
    
    // Push current state to prevent back navigation issues
    if (isAuthenticated && location.pathname === '/dashboard') {
      window.history.pushState(null, '', '/dashboard');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated, navigate, location.pathname]);
}