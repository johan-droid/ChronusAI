import { type ReactNode, useState, memo } from 'react';
import { useLocation } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import Footer from './Footer';
import LogoutMenu from './LogoutMenu';
import { useAuthStore } from '../store/authStore';

/* ── Z-Index Scale ──
   --z-backdrop : 40
   --z-nav      : 50
   --z-modal    : 60
   --z-toast    : 70
*/

const AUTHENTICATED_PATHS = ['/dashboard', '/chat', '/availability', '/history', '/settings'];

interface LayoutProps {
  children: ReactNode;
}

/**
 * Universal App Shell
 * Uses CSS Grid to prevent Footer/Toast content occlusion.
 * Manages NavigationBar + Footer + safe-area offsets.
 */
const Layout = memo(({ children }: LayoutProps) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const [showLogout, setShowLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPath = location.pathname.replace(/\/$/, '') || '/';
  const isAuthPage = AUTHENTICATED_PATHS.includes(currentPath);
  const showNav = isAuthenticated && isAuthPage;
  const showFooter = !isAuthPage;

  return (
    <div className="app-shell">
      {/* Navigation — only on authenticated pages */}
      {showNav && (
        <NavigationBar
          user={user}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          setShowLogout={setShowLogout}
        />
      )}

      {/* Main Content Area */}
      <main className="app-shell__content">
        {children}
      </main>

      {/* Footer — only on public pages */}
      {showFooter && <Footer />}

      {/* Logout Modal */}
      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
});
Layout.displayName = 'Layout';

export default Layout;
