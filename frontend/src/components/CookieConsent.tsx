import { useState, useEffect } from 'react';
import { Cookie, Shield, Info } from 'lucide-react';

interface CookieConsentProps {
  onAccept?: () => void;
  onReject?: () => void;
}

export default function CookieConsent({ onAccept, onReject }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-analytics', 'true');
    localStorage.setItem('cookie-marketing', 'false');
    setIsVisible(false);
    onAccept?.();
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    localStorage.setItem('cookie-analytics', 'false');
    localStorage.setItem('cookie-marketing', 'false');
    setIsVisible(false);
    onReject?.();
  };

  const handleCustomize = () => {
    setShowDetails(true);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 shadow-2xl animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Cookie Preferences
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                Your data is never shared with third parties.
              </p>
              
              {showDetails && (
                <div className="space-y-2 text-xs text-muted-foreground bg-card/50 p-3 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      <span>Essential Cookies</span>
                    </div>
                    <span className="text-green-500">Required</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-3 h-3" />
                      <span>Analytics Cookies</span>
                    </div>
                    <span className="text-blue-500">Optional</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cookie className="w-3 h-3" />
                      <span>Marketing Cookies</span>
                    </div>
                    <span className="text-orange-500">Disabled</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {!showDetails ? (
              <>
                <button
                  onClick={handleCustomize}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 px-3 py-1.5 rounded-md border border-border/30 hover:border-border/50"
                >
                  Customize
                </button>
                <button
                  onClick={handleReject}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 px-3 py-1.5 rounded-md border border-border/30 hover:border-border/50"
                >
                  Reject
                </button>
                <button
                  onClick={handleAccept}
                  className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 px-4 py-1.5 rounded-md font-medium shadow-lg shadow-primary/20"
                >
                  Accept All
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 px-3 py-1.5 rounded-md border border-border/30 hover:border-border/50"
                >
                  Back
                </button>
                <button
                  onClick={handleAccept}
                  className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 px-4 py-1.5 rounded-md font-medium shadow-lg shadow-primary/20"
                >
                  Save Preferences
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
