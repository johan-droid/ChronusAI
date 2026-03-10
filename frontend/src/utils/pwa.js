// ChronosAI PWA Utilities
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.swRegistration = null;
        this.isInstalled = false;
        this.init();
    }

    async init() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 ChronosAI PWA: Install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('📱 ChronosAI PWA: App installed successfully');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstallSuccess();
        });

        // Register service worker
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/sw.js');
                console.log('📱 ChronosAI PWA: Service Worker registered');
                
                // Listen for service worker updates
                this.swRegistration.addEventListener('updatefound', () => {
                    const newWorker = this.swRegistration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateButton();
                        }
                    });
                });

                // Listen for controlling service worker changes
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('📱 ChronosAI PWA: Service Worker updated');
                    window.location.reload();
                });

            } catch (error) {
                console.error('📱 ChronosAI PWA: Service Worker registration failed:', error);
            }
        }

        // Check if app is already installed
        this.checkIfInstalled();
    }

    checkIfInstalled() {
        // Check if running in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('📱 ChronosAI PWA: Running in standalone mode');
        }

        // Check if app is installed on iOS
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('📱 ChronosAI PWA: Running in iOS standalone mode');
        }

        // Check if app is installed on Android
        if (window.matchMedia('(display-mode: minimal-ui)').matches) {
            this.isInstalled = true;
            console.log('📱 ChronosAI PWA: Running in Android minimal-ui mode');
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            console.log('📱 ChronosAI PWA: No install prompt available');
            return false;
        }

        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('📱 ChronosAI PWA: User accepted install prompt');
                this.deferredPrompt = null;
                return true;
            } else {
                console.log('📱 ChronosAI PWA: User dismissed install prompt');
                return false;
            }
        } catch (error) {
            console.error('📱 ChronosAI PWA: Install prompt error:', error);
            return false;
        }
    }

    showInstallButton() {
        // Create or show install button
        let installButton = document.getElementById('pwa-install-button');
        
        if (!installButton) {
            installButton = this.createInstallButton();
            document.body.appendChild(installButton);
        }
        
        installButton.style.display = 'flex';
    }

    hideInstallButton() {
        const installButton = document.getElementById('pwa-install-button');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }

    createInstallButton() {
        const button = document.createElement('div');
        button.id = 'pwa-install-button';
        button.innerHTML = `
            <div class="pwa-install-content">
                <div class="pwa-install-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                </div>
                <div class="pwa-install-text">
                    <div class="pwa-install-title">Install ChronosAI</div>
                    <div class="pwa-install-subtitle">Get the desktop app experience</div>
                </div>
                <div class="pwa-install-close" onclick="pwaManager.hideInstallButton()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #pwa-install-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                color: white;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
                cursor: pointer;
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                transition: all 0.3s ease;
                max-width: 320px;
                backdrop-filter: blur(10px);
            }

            #pwa-install-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 40px rgba(59, 130, 246, 0.5);
            }

            .pwa-install-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .pwa-install-icon {
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .pwa-install-text {
                flex: 1;
            }

            .pwa-install-title {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 2px;
            }

            .pwa-install-subtitle {
                font-size: 12px;
                opacity: 0.8;
            }

            .pwa-install-close {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s ease;
                flex-shrink: 0;
            }

            .pwa-install-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            @media (max-width: 480px) {
                #pwa-install-button {
                    bottom: 16px;
                    right: 16px;
                    left: 16px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);

        // Add click handler
        button.addEventListener('click', () => {
            this.installApp();
        });

        return button;
    }

    showInstallSuccess() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div class="pwa-success-content">
                <div class="pwa-success-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                </div>
                <div class="pwa-success-text">
                    ChronosAI installed successfully!
                </div>
            </div>
        `;

        // Add success styles
        const style = document.createElement('style');
        style.textContent = `
            .pwa-success-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
                z-index: 1001;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                animation: slideIn 0.3s ease;
            }

            .pwa-success-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .pwa-success-icon {
                width: 32px;
                height: 32px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .pwa-success-text {
                font-size: 14px;
                font-weight: 600;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        notification.className = 'pwa-success-notification';
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showUpdateButton() {
        const updateButton = document.createElement('div');
        updateButton.innerHTML = `
            <div class="pwa-update-content">
                <div class="pwa-update-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                    </svg>
                </div>
                <div class="pwa-update-text">
                    New version available
                </div>
                <div class="pwa-update-action" onclick="pwaManager.updateApp()">
                    Update
                </div>
            </div>
        `;

        // Add update styles
        const style = document.createElement('style');
        style.textContent = `
            .pwa-update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
                z-index: 1002;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                animation: slideDown 0.3s ease;
            }

            .pwa-update-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .pwa-update-icon {
                width: 24px;
                height: 24px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .pwa-update-text {
                font-size: 13px;
                font-weight: 500;
            }

            .pwa-update-action {
                background: rgba(255, 255, 255, 0.2);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease;
            }

            .pwa-update-action:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            @keyframes slideDown {
                from {
                    transform: translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        updateButton.className = 'pwa-update-notification';
        document.body.appendChild(updateButton);
    }

    async updateApp() {
        if (this.swRegistration && this.swRegistration.waiting) {
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    }

    // Request notification permission
    async requestNotificationPermission() {
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                console.log('📱 ChronosAI PWA: Notification permission:', permission);
                return permission === 'granted';
            } catch (error) {
                console.error('📱 ChronosAI PWA: Notification permission error:', error);
                return false;
            }
        }
        return false;
    }

    // Show notification
    async showNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification(title, {
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/badge-72x72.png',
                    ...options
                });

                notification.onclick = () => {
                    notification.close();
                    window.focus();
                };

                return notification;
            } catch (error) {
                console.error('📱 ChronosAI PWA: Notification error:', error);
            }
        }
    }

    // Check if app is installed
    isAppInstalled() {
        return this.isInstalled;
    }
}

// Initialize PWA Manager
const pwaManager = new PWAManager();

// Export for global access
window.pwaManager = pwaManager;

export default pwaManager;
