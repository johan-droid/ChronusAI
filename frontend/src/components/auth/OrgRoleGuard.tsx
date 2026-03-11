/**
 * OrgRoleGuard — Organization-domain guard.
 *
 * Wraps routes that require the user to have a minimum role inside the
 * currently active organization.  Must be used inside a `<ProtectedRoute />`
 * (i.e. the user is already authenticated).
 *
 * Props
 * ─────
 * • `requiredRole`  — minimum role required: 'member' | 'admin' | 'owner'.
 * • `fallback`      — optional element to render instead of redirecting
 *                     (e.g. a 403 page).  Defaults to a redirect to /dashboard.
 *
 * Usage
 * ─────
 * <Route element={<OrgRoleGuard requiredRole="admin" />}>
 *   <Route path="/org/settings" element={<OrgSettings />} />
 * </Route>
 *
 * The guard also shows a loading state while organizations are being fetched
 * and prompts the user to select an org if none is currently active.
 */
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  useOrganizationStore,
  type OrgRole,
} from '../../store/organizationStore';

interface OrgRoleGuardProps {
  requiredRole?: OrgRole;
  /** Custom element rendered on access denial instead of redirecting. */
  fallback?: React.ReactNode;
}

const OrgRoleGuard: React.FC<OrgRoleGuardProps> = ({
  requiredRole = 'member',
  fallback,
}) => {
  const { activeOrg, hasMinRole, isLoadingOrgs } = useOrganizationStore();
  const location = useLocation();

  // While orgs are being fetched from the API, show a spinner.
  if (isLoadingOrgs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // No active org selected — nudge the user to pick one.
  if (!activeOrg) {
    return (
      <Navigate
        to="/organizations"
        state={{ from: location, reason: 'no-active-org' }}
        replace
      />
    );
  }

  // Insufficient role.
  if (!hasMinRole(requiredRole)) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You need at least the{' '}
          <span className="font-semibold capitalize">{requiredRole}</span> role
          in <span className="font-semibold">{activeOrg.name}</span> to view
          this page.
        </p>
        <a
          href="/dashboard"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  return <Outlet />;
};

export default OrgRoleGuard;
