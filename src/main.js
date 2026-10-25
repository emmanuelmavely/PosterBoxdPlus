import { state } from './state.js';
import { initRenderRuntime } from './rendering/runtime.js';
import { loadDemoPreset, loadRegionalNowPlayingMovies } from './controllers/media.js';
import { renderHistoryListUI, initHistory } from './ui/history.js';
import { configureNavigation, initNavigation, switchView } from './ui/navigation.js';
import { initSearch } from './ui/search.js';
import { initApiModal } from './ui/api-modal.js';
import { initReviewForm } from './ui/review-form.js';
import { initAssetControls } from './ui/assets.js';
import { initDesignControls } from './ui/design-controls.js';
import { initCanvasInteractions } from './ui/canvas-interactions.js';
import { initExportControls } from './ui/export-controls.js';
import { initPwaInstall } from './ui/pwa-install.js';
import { initWhatsNewMenu } from './ui/whats-new.js';

function setSplashProgress(pct, msg) {
  const bar = document.getElementById('splash-progress-bar');
  const text = document.getElementById('splash-status-message');
  if (bar) bar.style.width = `${pct}%`;
  if (text && msg) text.textContent = msg;
}

async function dismissSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  setSplashProgress(100, 'Studio ready!');
  await new Promise((resolve) => setTimeout(resolve, 450));
  splash.classList.add('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    splash.classList.add('hidden');
  }, 700);
}

async function bootstrap() {
  try {
    setSplashProgress(20, 'Initializing rendering engine...');
    initRenderRuntime();
    configureNavigation({ historyRenderer: renderHistoryListUI });
    initNavigation();
    initSearch();
    initHistory();
    initApiModal();
    initReviewForm();
    initAssetControls();
    initDesignControls();
    initCanvasInteractions();
    initExportControls();
    initPwaInstall();
    initWhatsNewMenu();

    setSplashProgress(45, 'Loading archival typography & fonts...');
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 2500))
      ]);
    }

    setSplashProgress(70, 'Connecting regional cinema database...');
    await loadRegionalNowPlayingMovies();
  } catch (error) {
    console.error('PosterBoxd startup recovered from an initialization error:', error);
    setSplashProgress(90, 'Starting with limited network features...');
  } finally {
    setSplashProgress(95, 'Finalizing PosterBoxd interface...');
    switchView('home');
    await dismissSplashScreen();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
