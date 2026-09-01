import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, ShieldCheck, X, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pushNotificationService, PushNotificationPayload } from '../../services/pushNotificationService';

export const PushNotificationToast: React.FC = () => {
  const [activeNotification, setActiveNotification] = useState<PushNotificationPayload | null>(null);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    let progressInterval: any;
    let dismissTimer: any;

    const unsubscribe = pushNotificationService.subscribe((notification) => {
      setActiveNotification(notification);
      setProgress(100);

      // Smooth progress drain over 7 seconds
      const startTime = Date.now();
      const duration = 7000;

      if (progressInterval) clearInterval(progressInterval);
      if (dismissTimer) clearTimeout(dismissTimer);

      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
      }, 50);

      dismissTimer = setTimeout(() => {
        setActiveNotification(null);
        clearInterval(progressInterval);
      }, duration);
    });

    return () => {
      unsubscribe();
      if (progressInterval) clearInterval(progressInterval);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setActiveNotification(null);
  };

  if (!activeNotification) return null;

  const isWarning = activeNotification.type === 'BUDGET_80_PERCENT_WARNING';
  const isExceeded = activeNotification.type === 'BUDGET_EXCEEDED';
  const isSecurity = activeNotification.type === 'SECURITY';

  // Palette definition
  const badgeBg = isExceeded
    ? 'bg-red-100 text-red-700 border-red-300'
    : isWarning
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-purple-100 text-[#7C3AED] border-purple-300';

  const iconBg = isExceeded
    ? 'bg-red-600 text-white'
    : isWarning
    ? 'bg-amber-500 text-black'
    : 'bg-[#7C3AED] text-white';

  const barColor = isExceeded ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[#7C3AED]';

  return (
    <aside
      aria-label="System Notifications"
      className="fixed top-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] pointer-events-auto"
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-white border-2 border-black rounded-xl p-4 shadow-[6px_6px_0px_#000000] relative overflow-hidden"
        >
          {/* Top Progress bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gray-100">
            <div
              className={`h-full ${barColor} transition-all duration-75`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`${iconBg} w-9 h-9 rounded-lg border border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000000]`}>
                {isExceeded ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeBg}`}>
                    {isExceeded ? 'Budget Breach' : isWarning ? '80% Spending Alert' : 'Threat Intelligence'}
                  </span>
                  <span className="text-[10px] font-bold text-black/40">Just Now</span>
                </div>

                <h4 className="text-sm font-black text-black leading-tight mt-1 truncate">
                  {activeNotification.title}
                </h4>

                <p className="text-xs font-medium text-black/70 leading-relaxed mt-1 line-clamp-2">
                  {activeNotification.body}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss notification"
              className="text-black/40 hover:text-black p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
};
