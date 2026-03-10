import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOfflineMessage(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOfflineMessage(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline && !showOfflineMessage) {
        return null;
    }

    return (
        <AnimatePresence>
            {showOfflineMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white"
                >
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">You're offline</p>
                                    <p className="text-xs opacity-90">Some features may be limited until you reconnect</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {/* Offline features available */}
                                <div className="hidden sm:flex items-center gap-2 text-xs opacity-90">
                                    <span>Available:</span>
                                    <span className="bg-white/20 px-2 py-1 rounded">View calendar</span>
                                    <span className="bg-white/20 px-2 py-1 rounded">Chat history</span>
                                </div>
                                
                                {/* Retry button */}
                                <button
                                    onClick={() => window.location.reload()}
                                    className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Offline tips */}
                    <div className="bg-black/10 px-4 py-2">
                        <div className="container mx-auto">
                            <div className="flex items-center justify-center gap-4 text-xs opacity-80">
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Cached data available</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Actions will sync when online</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineIndicator;
