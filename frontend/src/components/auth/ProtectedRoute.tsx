/**
 * ProtectedRoute — User-domain guard.
 *
 * Wraps any route that requires an authenticated user.
 *
 * Behaviour
 * ─────────
 * 1. While the initial silent-refresh is in progress (`isLoading`), render a
 *    spinner so the user doesn't see a flash-of-login.
 * 2. If no access token is present after loading, attempt ONE silent refresh
 *    (cookie-based).  On success the user stays; on failure redirect to /login.
 * 3. If authenticated, render children.
 *
 * Usage
 * ─────
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 */
import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '@/lib/axios';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, accessToken, setAuth, setLoading } =
    useAuthStore();
  const location = useLocation();
  const hasTried = useRef(false);

  useEffect(() => {
    // Only attempt a silent refresh once per mount if we have a persisted user
    // profile but no in-memory access token.
    if (!isLoading || hasTried.current) return;

    const { user } = useAuthStore.getState();
    if (!accessToken && user) {
      hasTried.current = true;
      authApi
        .refresh()
        .then(({ data }: { data: { access_token: string } }) => {
          setAuth(user, data.access_token);
        })
        .catch(() => {
          setLoading(false); // refresh failed → will redirect to /login
        });
    } else {
      setLoading(false);
    }
  }, [isLoading, accessToken, setAuth, setLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
