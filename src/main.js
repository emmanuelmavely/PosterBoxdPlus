import { state } from './state.js';
import { initRenderRuntime } from './rendering/runtime.js';
import { loadDemoPreset, loadRegionalNowPlayingMovies } from './controllers/media.js';
import { renderHistoryListUI, initHistory } from './ui/history.js';
import { configureNavigation, initNavigation, switchView } from './ui/navigation.js';
import { initSearch } from './ui/search.js';
import { initApiModal, openApiModal } from './ui/api-modal.js';
import { initReviewForm } from './ui/review-form.js';
import { initAssetControls } from './ui/assets.js';
import { initDesignControls } from './ui/design-controls.js';
import { initCanvasInteractions } from './ui/canvas-interactions.js';
import { initExportControls } from './ui/export-controls.js';

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
    if (!state.tmdbApiKey) {
      openApiModal();
    }
  }, 700);
}

async function bootstrap() {
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

  setSplashProgress(45, 'Loading archival typography & fonts...');
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  setSplashProgress(70, 'Connecting regional cinema database...');
  try {
    await loadRegionalNowPlayingMovies();
  } catch (error) {
    // Graceful fallback when network is offline
  }

  setSplashProgress(90, 'Finalizing PosterBoxd Studio interface...');
  switchView('home');

  await dismissSplashScreen();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
