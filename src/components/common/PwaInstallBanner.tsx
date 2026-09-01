import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';
import { subscribePWAInstall, promptPWAInstall, isStandaloneMode } from '../../utils/pwaManager';

interface PwaInstallBannerProps {
  variant?: 'floating-banner' | 'embedded-card';
  onInstalled?: () => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({
  variant = 'floating-banner',
  onInstalled
}) => {
  const [canInstall, setCanInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());
    const unsubscribe = subscribePWAInstall((installable) => {
      setCanInstall(installable);
    });
    return () => unsubscribe();
  }, []);

  // If already running in standalone mode, do not show
  if (isStandalone) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const outcome = await promptPWAInstall();
      if (outcome === 'accepted') {
        if (onInstalled) onInstalled();
      }
    } finally {
      setInstalling(false);
    }
  };

  // 1. Embedded Card Variant (e.g. for Profile or Settings view)
  if (variant === 'embedded-card') {
    return (
      <div className="bg-[#FAF7F2] border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#7C3AED] border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_#000000] shrink-0 font-black text-xl">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm uppercase block text-black">
                Install SentinelFin Progressive Web App
              </span>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-black px-1.5 py-0.2 rounded">
                PWA READY
              </span>
            </div>
            <span className="text-xs font-semibold text-black/60 block mt-0.5">
              Install to your home screen for instantaneous zero-trust protection, biometric auth, and offline mode.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstallClick}
          disabled={installing}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span>{installing ? 'Installing...' : 'Install App'}</span>
        </button>
      </div>
    );
  }

  // 2. Floating Banner Variant (Only visible when browser fires beforeinstallprompt and user hasn't dismissed)
  if (!canInstall || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[6px_6px_0px_#000000] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED] border-2 border-black flex items-center justify-center text-white font-black text-lg shadow-[2px_2px_0px_#000000] shrink-0">
            ⚡
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black uppercase text-black truncate">
                Install SentinelFin
              </h4>
              <span className="text-[9px] font-bold bg-purple-100 text-[#7C3AED] px-1 py-0.2 rounded border border-purple-300">
                PWA
              </span>
            </div>
            <p className="text-[11px] font-semibold text-black/70 line-clamp-1">
              Add to Home Screen for fast, offline payment protection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={installing}
            className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-lg text-xs font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 text-black/50 hover:text-black hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
