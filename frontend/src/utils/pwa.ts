// Lightweight PWA utilities: register service worker and handle install prompt

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = '/sw.js';
    navigator.serviceWorker.register(swUrl).then((reg) => {
      console.log('[PWA] Service worker registered:', reg);
    }).catch((err) => {
      console.warn('[PWA] Service worker registration failed:', err);
    });
  });
}

// Capture the beforeinstallprompt event so we can trigger it later from UI
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    // notify app that install prompt is available
    window.dispatchEvent(new CustomEvent('pwa:install-available'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App was installed');
    window.dispatchEvent(new CustomEvent('pwa:installed'));
    deferredPrompt = null;
  });
}

export async function promptInstall(): Promise<'accepted' | 'dismissed'> {
  if (!deferredPrompt) return Promise.reject(new Error('No install prompt available'));
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return choice.outcome;
}

export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null;
}
