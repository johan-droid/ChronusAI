// Cookie Consent Utility Functions

export const clearCookieConsent = () => {
  localStorage.removeItem('cookie-consent');
  localStorage.removeItem('cookie-analytics');
  localStorage.removeItem('cookie-marketing');
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent('cookieConsentCleared'));
};

export const setCookieConsent = (consent: 'accepted' | 'rejected') => {
  localStorage.setItem('cookie-consent', consent);
  localStorage.setItem('cookie-analytics', consent === 'accepted' ? 'true' : 'false');
  localStorage.setItem('cookie-marketing', 'false');
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
    detail: { consent } 
  }));
};

export const getCookieConsent = () => {
  const consent = localStorage.getItem('cookie-consent');
  const analytics = localStorage.getItem('cookie-analytics');
  const marketing = localStorage.getItem('cookie-marketing');
  
  return {
    consent,
    analytics: analytics === 'true',
    marketing: marketing === 'true',
    isComplete: !!(consent && analytics && marketing)
  };
};

export const resetCookieConsent = () => {
  clearCookieConsent();
  // Force page reload to reset cookie consent state
  window.location.reload();
};

// Development helper - call this in browser console to debug
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).cookieUtils = {
    clear: clearCookieConsent,
    set: setCookieConsent,
    get: getCookieConsent,
    reset: resetCookieConsent
  };
  
  console.log('Cookie utils available at window.cookieUtils');
}
