let deferredPrompt: any = null;

type PWAInstallChangeCallback = (canInstall: boolean) => void;
const listeners: Set<PWAInstallChangeCallback> = new Set();

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SentinelFin PWA] ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[SentinelFin PWA] ServiceWorker registration failed:', error);
        });
    });

    // Listen for BeforeInstallPrompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      deferredPrompt = e;
      notifyListeners(true);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      notifyListeners(false);
      console.log('[SentinelFin PWA] App was successfully installed');
    });
  }
}

export function canInstallPWA(): boolean {
  return !isStandaloneMode() && deferredPrompt !== null;
}

export async function promptPWAInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
  if (!deferredPrompt) {
    return 'unsupported';
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyListeners(false);
    return outcome;
  } catch (err) {
    console.error('[SentinelFin PWA] Install prompt error:', err);
    return 'unsupported';
  }
}

function notifyListeners(canInstall: boolean) {
  listeners.forEach((cb) => {
    try {
      cb(canInstall);
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribePWAInstall(callback: PWAInstallChangeCallback): () => void {
  listeners.add(callback);
  callback(canInstallPWA());
  return () => {
    listeners.delete(callback);
  };
}
