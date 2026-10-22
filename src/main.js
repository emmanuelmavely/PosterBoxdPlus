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

async function bootstrap() {
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

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  try {
    await loadDemoPreset('dune2');
    await loadRegionalNowPlayingMovies();
  } catch (error) {
    // The built-in preset remains usable when optional external loading fails.
  }

  switchView('home');

  if (!state.tmdbApiKey) {
    openApiModal();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
