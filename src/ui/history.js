import { state } from '../state.js';
import { loadCorsImage, extractDominantPalette } from '../services/media-assets.js';
import { getSavedHistory, saveHistoryArray } from '../services/storage.js';
import { renderPaletteSwatchesUI, renderAssetPickerStrips } from './assets.js';
import { syncReviewFormState } from './review-form.js';
import { showToast } from './toast.js';
import { switchView, updateHeaderHistoryVisibility } from './navigation.js';

export function renderHistoryListUI() {
  updateHeaderHistoryVisibility();
  const container = document.getElementById('history-list-container');
  if (!container) return;
  const history = getSavedHistory();
  if (history.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-gray-400 text-xs font-mono">
        No history saved yet. Search a movie or import a Letterboxd review to build your history!
      </div>
    `;
    return;
  }

  container.innerHTML = history.map((item, idx) => {
    const thumb = (item.posters && item.posters[0]) || '';
    const dateFormatted = new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `
      <div class="bg-cardbg hover:bg-elevated border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 transition">
        <button type="button" data-history-load="${idx}" class="flex-1 flex items-center gap-3 text-left min-w-0">
          ${thumb
            ? `<img src="${thumb}" alt="${item.title}" class="w-11 h-16 object-cover rounded-lg border border-white/10 shrink-0 bg-obsidian" />`
            : `<div class="w-11 h-16 rounded-lg bg-obsidian border border-white/10 shrink-0 flex items-center justify-center text-[10px] text-gray-500">Art</div>`
          }
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${item.isFromLetterboxd ? 'bg-lborange/20 text-lborange' : 'bg-lbgreen/15 text-lbgreen'} font-semibold">
                ${item.isFromLetterboxd ? 'Letterboxd' : (item.mediaType === 'tv' ? 'TV' : 'Movie')}
              </span>
              <span class="text-[11px] font-mono text-lbgreen font-bold">${Number(item.rating || 0).toFixed(1)} ★</span>
              <span class="text-[10px] font-mono text-gray-500 ml-auto">${dateFormatted}</span>
            </div>
            <div class="font-display font-bold text-sm text-white truncate mt-0.5">${item.title} ${item.year ? `<span class="text-xs font-mono text-gray-400 font-normal">(${item.year})</span>` : ''}</div>
            <div class="text-[11px] text-gray-400 truncate">${item.review || item.director || 'Tap to restore poster'}</div>
          </div>
        </button>
        <button type="button" data-history-delete="${idx}" title="Delete from History"
          class="w-8 h-8 rounded-lg bg-obsidian hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 flex items-center justify-center shrink-0 transition">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-history-load]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.historyLoad, 10);
      const item = getSavedHistory()[idx];
      if (!item) return;
      Object.assign(state, {
        mediaType: item.mediaType || 'movie',
        tmdbId: item.tmdbId || null,
        title: item.title || '',
        year: item.year || '',
        director: item.director || '',
        writer: item.writer || '',
        dop: item.dop || '',
        music: item.music || '',
        cast: item.cast || '',
        genre: item.genre || '',
        runtime: item.runtime || '',
        spine: item.spine || '#2026',
        rating: item.rating ?? 4.5,
        isLiked: Boolean(item.isLiked),
        medium: item.medium || 'THEATER',
        watchedAt: item.watchedAt || '',
        username: item.username || state.username,
        watchedDate: item.watchedDate || state.watchedDate,
        review: item.review || '',
        detailedReview: item.detailedReview || '',
        showDetailedReview: item.showDetailedReview !== undefined ? item.showDetailedReview : true,
        isFromLetterboxd: Boolean(item.isFromLetterboxd),
        letterboxdUrl: item.letterboxdUrl || '',
        showQrCode: Boolean(item.showQrCode),
        posters: item.posters || [],
        backdrops: item.backdrops || [],
        logos: item.logos || [],
        selectedPosterIndex: 0,
        selectedBackdropIndex: (item.backdrops && item.backdrops.length > 1) ? 1 : 0,
        selectedLogoIndex: 0
      });
      syncReviewFormState();
      const [pImg, bImg, lImg] = await Promise.all([
        loadCorsImage(state.posters[state.selectedPosterIndex]),
        loadCorsImage(state.backdrops[state.selectedBackdropIndex]),
        loadCorsImage(state.logos[0])
      ]);
      state.posterImg = pImg;
      state.backdropImg = bImg;
      state.logoImg = lImg;
      if (pImg) {
        state.palette = extractDominantPalette(pImg, state.palette);
        renderPaletteSwatchesUI();
      }
      renderAssetPickerStrips();
      switchView('preview');
      showToast(`Restored "${state.title}" from History`);
    });
  });

  container.querySelectorAll('[data-history-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.historyDelete, 10);
      const history = getSavedHistory();
      history.splice(idx, 1);
      saveHistoryArray(history);
      renderHistoryListUI();
      showToast('Removed entry from History');
    });
  });
}

export function initHistory() {
  document.getElementById('clear-all-history-btn')?.addEventListener('click', () => {
    saveHistoryArray([]);
    renderHistoryListUI();
    showToast('Cleared all saved fetch history');
  });
}
