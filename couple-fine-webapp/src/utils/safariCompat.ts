// Safari compatibility utilities

// Check if running on Safari
export const isSafari = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1;
};

// Check if running on iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Clear all caches and storage for Safari
export const clearSafariCache = async () => {
  if (isSafari() || isIOS()) {
    try {
      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }

      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

    } catch (error) {
      console.error('Failed to clear Safari cache:', error);
    }
  }
};

// Add viewport meta tag fix for iOS
export const fixIOSViewport = () => {
  if (isIOS()) {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
  }
};

// Polyfill for Safari
export const applySafariPolyfills = () => {
  // Add smooth scroll polyfill
  if (!('scrollBehavior' in document.documentElement.style)) {
    // Simple smooth scroll polyfill
    window.scroll = (options: any) => {
      if (options && options.behavior === 'smooth') {
        const start = window.pageYOffset;
        const distance = (options.top || 0) - start;
        const duration = 500;
        let start_time: number | null = null;

        const animation = (current_time: number) => {
          if (start_time === null) start_time = current_time;
          const time_elapsed = current_time - start_time;
          const progress = Math.min(time_elapsed / duration, 1);

          window.scrollTo(0, start + distance * progress);

          if (time_elapsed < duration) {
            requestAnimationFrame(animation);
          }
        };

        requestAnimationFrame(animation);
      } else {
        window.scrollTo(options);
      }
    };
  }
};

// Initialize Safari compatibility fixes
export const initSafariCompat = () => {
  if (isSafari() || isIOS()) {

    fixIOSViewport();
    applySafariPolyfills();

    // Clear cache on first load if version changed
    const appVersion = 'v3.0.0';
    const storedVersion = localStorage.getItem('app-version');

    if (storedVersion !== appVersion) {
      clearSafariCache().then(() => {
        localStorage.setItem('app-version', appVersion);

      });
    }
  }
};