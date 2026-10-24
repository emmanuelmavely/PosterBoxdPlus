import { showToast } from './toast.js';

let deferredPrompt = null;

function isRunningStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');
}

function isIosDevice() {
  const userAgent = window.navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
}

export function openIosInstallModal() {
  const modal = document.getElementById('pwa-install-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

export function closeIosInstallModal() {
  const modal = document.getElementById('pwa-install-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function initPwaInstall() {
  const installBtn = document.getElementById('install-pwa-btn');
  const modalCloseBtn = document.getElementById('close-pwa-modal-btn');
  const modalDismissBtn = document.getElementById('dismiss-pwa-modal-btn');
  const modal = document.getElementById('pwa-install-modal');

  function showUpdateNotification() {
    const banner = document.getElementById('pwa-update-banner');
    if (banner) {
      banner.classList.remove('hidden');
      banner.classList.add('flex');
    }
  }

  function hideUpdateNotification() {
    const banner = document.getElementById('pwa-update-banner');
    if (banner) {
      banner.classList.add('hidden');
      banner.classList.remove('flex');
    }
  }

  // Register Service Worker & handle automatic update detection
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('PosterBoxd Service Worker registered with scope:', reg.scope);

          // If an updated service worker is already waiting
          if (reg.waiting && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }

          // When a new service worker is found and installed in the background
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateNotification();
              }
            });
          });

          // Check for new updates whenever the device reconnects to internet
          window.addEventListener('online', () => {
            reg.update().catch(() => {});
          });

          // Check periodically for updates every 60 minutes
          setInterval(() => {
            if (navigator.onLine) {
              reg.update().catch(() => {});
            }
          }, 60 * 60 * 1000);
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped/failed:', err);
        });
    });

    // Update banner button actions
    document.getElementById('pwa-refresh-btn')?.addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('pwa-dismiss-update-btn')?.addEventListener('click', () => {
      hideUpdateNotification();
    });
  }

  // If already running standalone, do not show install button
  if (isRunningStandalone()) {
    if (installBtn) installBtn.classList.add('hidden');
    return;
  }

  // Handle native Chromium / Android install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
      installBtn.classList.remove('hidden');
      installBtn.classList.add('inline-flex');
    }
  });

  // iOS Safari detection: show install button with guided instructions
  if (isIosDevice() && !isRunningStandalone()) {
    if (installBtn) {
      installBtn.classList.remove('hidden');
      installBtn.classList.add('inline-flex');
    }
  }

  // Install button click
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          showToast('Installing PosterBoxd...');
          installBtn.classList.add('hidden');
        }
        deferredPrompt = null;
      } else {
        // iOS or browser without beforeinstallprompt trigger: open guided modal
        openIosInstallModal();
      }
    });
  }

  // Close modal handlers
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeIosInstallModal);
  if (modalDismissBtn) modalDismissBtn.addEventListener('click', closeIosInstallModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeIosInstallModal();
    });
  }

  // Listen for successful installation
  window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.classList.add('hidden');
    deferredPrompt = null;
    showToast('PosterBoxd installed to your Home Screen!');
  });
}
