import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

export default function CookiesPolicyModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted or declined cookies
    if (typeof window !== "undefined" && window.localStorage) {
      const cookieConsent = window.localStorage.getItem("cookieConsent");
      if (!cookieConsent) {
        // Small delay for better UX
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("cookieConsent", "accepted");
    }
    setIsVisible(false);
  };

  const handleDecline = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("cookieConsent", "declined");
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[420px] z-50">
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl relative">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 shrink-0">
            <Cookie className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">We value your privacy</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleAccept}
                className="flex-1 bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Accept All
              </button>
              <button 
                onClick={handleDecline}
                className="flex-1 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
