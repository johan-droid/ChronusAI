import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        // Check if app is already installed
        const checkIfInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isIOSStandalone = window.navigator.standalone === true;
            setIsInstalled(isStandalone || isIOSStandalone);
        };

        checkIfInstalled();

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        // Listen for appinstalled event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                setShowPrompt(false);
                setDeferredPrompt(null);
            }
        } catch (error) {
            console.error('Install prompt error:', error);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Store dismissal in localStorage to not show again for 7 days
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    // Check if user has dismissed recently
    useEffect(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            if (parseInt(dismissed) > sevenDaysAgo) {
                setShowPrompt(false);
            }
        }
    }, []);

    // Don't show if already installed or no prompt available
    if (isInstalled || !showPrompt || !deferredPrompt) {
        return null;
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.9 }}
                    className="fixed bottom-6 right-6 z-50 max-w-sm mx-4"
                >
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-2xl backdrop-blur-lg border border-white/10">
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    Install ChronosAI
                                </h3>
                                <p className="text-white/80 text-sm mb-4">
                                    Get the desktop app experience with offline access and push notifications
                                </p>

                                {/* Features */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-white/90 text-xs">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>Offline calendar access</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/90 text-xs">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>Push notifications</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/90 text-xs">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>Desktop shortcut</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleInstallClick}
                                        className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
                                    >
                                        Install App
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="flex-shrink-0 text-white/80 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors"
                                    >
                                        Later
                                    </button>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={handleDismiss}
                                className="flex-shrink-0 text-white/60 hover:text-white/80 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Platform-specific instructions */}
                    <div className="mt-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <p className="text-white/70 text-xs">
                            {/iPhone|iPad|iPod/.test(navigator.userAgent) ? (
                                <>
                                    Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
                                </>
                            ) : /Android/.test(navigator.userAgent) ? (
                                <>
                                    Tap the menu button → <strong>Install app</strong>
                                </>
                            ) : (
                                <>
                                    Click the install button above or look for the install icon in your browser
                                </>
                            )}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
