import { memo, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3,
    MessageSquare,
    Clock,
    Calendar,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';

interface NavButtonProps {
    path: string;
    label: string;
    icon: React.ElementType;
    isActive: boolean;
    onClick: (path: string) => void;
}

const NavButton = memo(({
    path,
    label,
    icon: Icon,
    isActive,
    onClick,
}: NavButtonProps) => (
    <button
        type="button"
        onClick={() => onClick(path)}
        className={`px-5 py-2.5 rounded-full text-sm font-medium smooth-transition flex items-center gap-2 ${isActive
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
    >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
    </button>
));
NavButton.displayName = 'NavButton';

interface NavigationBarProps {
    user: { full_name?: string; email: string } | null;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    setShowLogout: (show: boolean) => void;
}

const NavigationBar = memo(({
    user,
    mobileMenuOpen,
    setMobileMenuOpen,
    setShowLogout,
}: NavigationBarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleNav = useCallback((path: string) => {
        navigate(path);
        setMobileMenuOpen(false);
    }, [navigate, setMobileMenuOpen]);

    return (
        <nav className="relative z-50 border-b border-white/5 bg-[rgba(5,5,20,0.85)] backdrop-blur-xl safe-area-top">
            <div className="max-w-[100vw] mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between">
                    <button type="button" onClick={() => handleNav('/dashboard')} className="flex items-center gap-2 sm:gap-3 smooth-transition hover:opacity-90 min-h-[44px]">
                        <AnimatedLogo className="h-8 w-8 sm:h-10 sm:w-10" />
                        <span className="text-lg sm:text-xl font-bold gradient-text">ChronosAI</span>
                    </button>

                    <div className="hidden md:flex items-center gap-1.5 rounded-2xl bg-white/[0.03] p-1.5 border border-white/5">
                        <NavButton path="/dashboard" label="Dashboard" icon={BarChart3} isActive={currentPath === '/dashboard'} onClick={handleNav} />
                        <NavButton path="/chat" label="Chat" icon={MessageSquare} isActive={currentPath === '/chat'} onClick={handleNav} />
                        <NavButton path="/availability" label="Availability" icon={Clock} isActive={currentPath === '/availability'} onClick={handleNav} />
                        <NavButton path="/history" label="History" icon={Calendar} isActive={currentPath === '/history'} onClick={handleNav} />
                    </div>

                    <div className="flex items-center gap-3">
                        {user && (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="hidden sm:flex items-center gap-3 p-1.5 pl-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 smooth-transition active:scale-[0.98]"
                                >
                                    <div className="flex flex-col items-end">
                                        <p className="text-[11px] font-bold text-white leading-tight">{user.full_name || 'User'}</p>
                                        <p className="text-[9px] text-slate-500 font-medium truncate max-w-[120px]">{user.email}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center">
                                        <span className="text-xs font-bold text-blue-400">{(user.full_name || 'U')[0]}</span>
                                    </div>
                                </button>

                                {/* Profile Dropdown Menu */}
                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute right-0 mt-3 w-64 bg-[#0d0d1a]/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-3xl z-50 overflow-hidden"
                                            >
                                                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                                                    <p className="text-sm font-bold text-white">{user.full_name}</p>
                                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                                </div>
                                                <div className="p-2">
                                                    <button
                                                        onClick={() => { handleNav('/settings'); setIsProfileOpen(false); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 smooth-transition"
                                                    >
                                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                                                            <Calendar className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-xs font-medium">Account Settings</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { setShowLogout(true); setIsProfileOpen(false); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 smooth-transition"
                                                    >
                                                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                                                            <LogOut className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-xs font-medium">Sign Out</span>
                                                    </button>
                                                </div>
                                                <div className="px-4 py-2 bg-black/20 text-[10px] text-slate-600 flex justify-between">
                                                    <span>API v1.0</span>
                                                    <span>ChronosAI Premium</span>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden h-11 w-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white smooth-transition active:scale-90 z-[70]"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <>
                        {/* Heavy Blur Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[55] md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        {/* Mobile Menu Sidebar - Slides from right */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[280px] bg-[#0a0a14]/95 backdrop-blur-2xl border-l border-white/10 p-6 pt-20 space-y-3 md:hidden z-[60] shadow-2xl"
                        >
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="space-y-2">
                                {[
                                    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-blue-400' },
                                    { path: '/chat', label: 'Chat', icon: () => null, color: 'text-cyan-400' },
                                    { path: '/availability', label: 'Availability', icon: Clock, color: 'text-purple-400' },
                                    { path: '/history', label: 'History', icon: Calendar, color: 'text-emerald-400' },
                                ].map(({ path, label, icon: Icon, color }) => (
                                    <button
                                        key={path}
                                        type="button"
                                        onClick={() => handleNav(path)}
                                        className={`w-full px-4 py-3.5 rounded-xl text-base font-semibold flex items-center gap-3 smooth-transition active:scale-[0.98] border transition-all ${currentPath === path
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-lg shadow-blue-500/20'
                                            : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <Icon className={`h-5 w-5 ${currentPath === path ? 'text-white' : color}`} />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-4 mt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => { setShowLogout(true); setMobileMenuOpen(false); }}
                                    className="w-full px-4 py-3.5 rounded-xl bg-red-500/10 text-red-400 text-base font-semibold flex items-center gap-3 hover:bg-red-500/20 border border-red-500/20 smooth-transition active:scale-[0.98]"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </nav>
    );
});
NavigationBar.displayName = 'NavigationBar';

export default NavigationBar;
