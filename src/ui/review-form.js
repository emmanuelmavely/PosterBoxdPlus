import { state } from '../state.js';
import { buildRelevantMovieReview } from '../utils.js';
import { tmdbFetch } from '../services/tmdb.js';
import { loadCorsImage, extractDominantPalette } from '../services/media-assets.js';
import { recordCurrentFetchToHistory } from '../services/storage.js';
import { renderAssetPickerStrips, renderPaletteSwatchesUI } from './assets.js';
import { renderHistoryListUI } from './history.js';
import { scheduleCanvasRender } from '../rendering/canvas-renderer.js';
import { showToast } from './toast.js';
import { syncQrToggleVisibility, syncQrUrlPreview } from './qr-controls.js';

function updateMediumPillsUI(activeMedium) {
  const label = document.getElementById('active-medium-label');
  if (label) label.textContent = activeMedium || 'None';

  document.querySelectorAll('.medium-pill').forEach((button) => {
    const isActive = (button.dataset.medium || '') === (activeMedium || '');
    button.classList.toggle('active', isActive);
    button.classList.toggle('border-lbblue', isActive);
    button.classList.toggle('bg-lbblue/20', isActive);
    button.classList.toggle('text-white', isActive);
    button.classList.toggle('border-white/10', !isActive);
    button.classList.toggle('bg-obsidian', !isActive);
    button.classList.toggle('text-gray-300', !isActive);
  });
}

function updateStarRatingUI(ratingValue) {
  const starsContainer = document.getElementById('interactive-stars');
  const badge = document.getElementById('rating-numeric-badge');
  const slider = document.getElementById('rating-range');
  const number = Number(ratingValue) || 0;

  if (slider) slider.value = number;
  if (badge) badge.textContent = number > 0 ? `${number.toFixed(1)} ★` : 'Unrated';
  if (!starsContainer) return;

  let html = '';
  for (let index = 1; index <= 5; index += 1) {
    const difference = number - (index - 1);
    let iconClass = 'fa-regular fa-star text-gray-600';
    if (difference >= 1) iconClass = 'fa-solid fa-star text-lbgreen';
    else if (difference >= 0.5) iconClass = 'fa-solid fa-star-half-stroke text-lbgreen';
    html += `<i data-star-index="${index}" class="${iconClass} text-xl transition-transform hover:scale-110"></i>`;
  }
  starsContainer.innerHTML = html;
}

function updateHeartButtonUI(isLiked) {
  const button = document.getElementById('heart-toggle-btn');
  const label = document.getElementById('heart-toggle-label');
  if (!button || !label) return;

  button.setAttribute('aria-pressed', String(Boolean(isLiked)));
  if (isLiked) {
    button.className = 'flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-lborange/50 bg-lborange/15 text-lborange font-semibold text-xs transition hover:scale-105';
    label.textContent = 'Liked';
  } else {
    button.className = 'flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 bg-obsidian text-gray-400 font-semibold text-xs transition hover:text-white';
    label.textContent = 'Like';
  }
}

export function syncReviewFormState() {
  const title = document.getElementById('review-media-title');
  const year = document.getElementById('review-media-year');
  const meta = document.getElementById('review-media-meta');
  const poster = document.getElementById('review-media-poster');
  const mediaTypeBadge = document.getElementById('review-media-type-badge');
  const episodeBox = document.getElementById('tv-episode-box');
  const reviewInput = document.getElementById('input-review');
  const detailedReviewInput = document.getElementById('input-detailed-review');
  const detailedReviewToggle = document.getElementById('chk-show-detailed-review');
  const watchedAtInput = document.getElementById('input-watched-at');
  const usernameInput = document.getElementById('input-username');
  const watchedDateInput = document.getElementById('input-watched-date');
  const characterCount = document.getElementById('review-char-count');

  if (title) title.textContent = state.title;
  if (year) year.textContent = state.year;
  if (meta) meta.textContent = `${state.mediaType === 'tv' ? 'Created by' : 'Directed by'} ${state.director || 'Unknown'}`;
  if (poster && (state.posters[state.selectedPosterIndex] || state.posters[0])) {
    poster.src = state.posters[state.selectedPosterIndex] || state.posters[0];
  }
  if (mediaTypeBadge) mediaTypeBadge.textContent = state.mediaType === 'tv' ? 'TV Series' : 'Movie';
  if (episodeBox) episodeBox.classList.toggle('hidden', state.mediaType !== 'tv');

  const review = state.review || '';
  if (reviewInput) reviewInput.value = review;
  if (detailedReviewInput) detailedReviewInput.value = state.detailedReview || '';
  if (detailedReviewToggle) detailedReviewToggle.checked = Boolean(state.showDetailedReview);
  if (watchedAtInput) watchedAtInput.value = state.watchedAt || '';
  if (usernameInput) usernameInput.value = state.username || '';
  if (watchedDateInput) watchedDateInput.value = state.watchedDate || '';
  if (characterCount) characterCount.textContent = `${review.length} / 220`;

  syncQrToggleVisibility();
  syncQrUrlPreview();
  updateMediumPillsUI(state.medium);
  updateStarRatingUI(state.rating);
  updateHeartButtonUI(state.isLiked);
}

export function initReviewForm() {
  document.getElementById('auto-fill-review-btn')?.addEventListener('click', () => {
    state.review = buildRelevantMovieReview(state.title, state.director, state.cast, state.genre, state.mediaType, state.rating);
    const reviewInput = document.getElementById('input-review');
    const characterCount = document.getElementById('review-char-count');
    if (reviewInput) reviewInput.value = state.review;
    if (characterCount) characterCount.textContent = `${state.review.length} / 220`;
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
    renderHistoryListUI();
    showToast('Generated review based on genre & rating!');
  });

  document.getElementById('clear-review-btn')?.addEventListener('click', () => {
    state.review = '';
    const reviewInput = document.getElementById('input-review');
    const characterCount = document.getElementById('review-char-count');
    if (reviewInput) reviewInput.value = '';
    if (characterCount) characterCount.textContent = '0 / 220';
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
    renderHistoryListUI();
    showToast('Cleared one-line review');
  });

  document.getElementById('clear-detailed-review-btn')?.addEventListener('click', () => {
    state.detailedReview = '';
    const detailedReviewInput = document.getElementById('input-detailed-review');
    if (detailedReviewInput) detailedReviewInput.value = '';
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
    renderHistoryListUI();
    showToast('Cleared detailed review');
  });

  const seasonSelect = document.getElementById('tv-season-select');
  const episodeSelect = document.getElementById('tv-episode-select');
  if (seasonSelect && episodeSelect) {
    seasonSelect.addEventListener('change', async () => {
      const seasonNumber = seasonSelect.value;
      if (!seasonNumber) {
        state.episodeTitle = '';
        episodeSelect.innerHTML = '<option value="">All Episodes</option>';
        episodeSelect.disabled = true;
        if (state._baseTvDetails) {
          state.director = state._baseTvDetails.director || '';
          state.writer = state._baseTvDetails.writer || '';
          state.cast = state._baseTvDetails.cast || '';
          state.runtime = state._baseTvDetails.runtime || '';
        }
        if (state._showAllImages) {
          state.posters = [...state._showAllImages];
          state.backdrops = [...state._showAllImages];
          renderAssetPickerStrips();
        }
        syncReviewFormState();
        scheduleCanvasRender();
        recordCurrentFetchToHistory();
        renderHistoryListUI();
        return;
      }

      state.episodeTitle = `Season ${seasonNumber}`;
      if (state.tmdbId && state.tmdbApiKey) {
        try {
          const [seasonData, seasonImages] = await Promise.all([
            tmdbFetch(`/tv/${state.tmdbId}/season/${seasonNumber}`),
            tmdbFetch(`/tv/${state.tmdbId}/season/${seasonNumber}/images`).catch(() => null)
          ]);
          state._currentSeasonData = seasonData;

          // Filter posters to relevant Season posters only (fallback to all show images if none)
          const seasonPosters = (seasonImages?.posters || []).slice(0, 8).map(p => `https://image.tmdb.org/t/p/w780${p.file_path}`);
          if (seasonData.poster_path) {
            seasonPosters.unshift(`https://image.tmdb.org/t/p/w780${seasonData.poster_path}`);
          }
          const uniqueSeasonPosters = Array.from(new Set(seasonPosters.filter(Boolean)));
          if (uniqueSeasonPosters.length > 0) {
            state.posters = uniqueSeasonPosters;
            state.backdrops = uniqueSeasonPosters;
            state.selectedPosterIndex = 0;
            state.selectedBackdropIndex = 0;
            const pImg = await loadCorsImage(state.posters[0]);
            if (pImg) {
              state.posterImg = pImg;
              state.backdropImg = pImg;
              state.palette = extractDominantPalette(pImg, state.palette);
              renderPaletteSwatchesUI();
            }
            renderAssetPickerStrips();
          } else if (state._showAllImages) {
            state.posters = [...state._showAllImages];
            state.backdrops = [...state._showAllImages];
            renderAssetPickerStrips();
          }

          episodeSelect.innerHTML = '<option value="">All Episodes</option>' +
            (seasonData.episodes || []).map((episode) => `<option value="${episode.episode_number}">E${episode.episode_number} · ${episode.name}</option>`).join('');
          episodeSelect.disabled = false;
        } catch (error) {
          // Keep the selector usable when the optional episode request fails.
        }
      }
      syncReviewFormState();
      scheduleCanvasRender();
      recordCurrentFetchToHistory();
      renderHistoryListUI();
    });

    episodeSelect.addEventListener('change', async () => {
      const seasonNumber = seasonSelect.value;
      const episodeNumber = episodeSelect.value;
      if (!seasonNumber || !episodeNumber) {
        if (seasonNumber) state.episodeTitle = `Season ${seasonNumber}`;
        if (state._baseTvDetails) {
          state.director = state._baseTvDetails.director || '';
          state.writer = state._baseTvDetails.writer || '';
          state.cast = state._baseTvDetails.cast || '';
          state.runtime = state._baseTvDetails.runtime || '';
        }
        syncReviewFormState();
        scheduleCanvasRender();
        recordCurrentFetchToHistory();
        renderHistoryListUI();
        return;
      }

      const epNumPad = String(episodeNumber).padStart(2, '0');
      const seNumPad = String(seasonNumber).padStart(2, '0');
      const epObj = state._currentSeasonData?.episodes?.find(e => String(e.episode_number) === String(episodeNumber));
      const epName = epObj?.name || episodeSelect.options[episodeSelect.selectedIndex]?.text?.replace(/^E\d+\s*·\s*/, '') || '';
      
      // Emphasized single episode format: "S01E01 - Episode title"
      state.episodeTitle = `S${seNumPad}E${epNumPad} - ${epName}`;
      state.spine = `#S${seNumPad}E${epNumPad}`;

      // Update episode director, cast, and runtime if available from TMDB episode data
      if (epObj) {
        const epDirector = epObj.crew?.find(c => c.job === 'Director')?.name;
        if (epDirector) state.director = epDirector;
        else if (state._baseTvDetails) state.director = state._baseTvDetails.director;

        const epWriters = epObj.crew?.filter(c => ['Writer', 'Screenplay', 'Story'].includes(c.job)).slice(0, 2).map(c => c.name).join(', ');
        if (epWriters) state.writer = epWriters;

        const epCast = (epObj.guest_stars || []).concat(state._baseTvDetails?.cast ? [] : []).slice(0, 4).map(c => c.name).join(', ');
        if (epCast) state.cast = epCast;
        else if (state._baseTvDetails) state.cast = state._baseTvDetails.cast;

        if (epObj.runtime) {
          const h = Math.floor(epObj.runtime / 60);
          const m = epObj.runtime % 60;
          state.runtime = h > 0 ? `${h}h ${m}m` : `${m}m`;
        }

        // Add episode still as a backdrop option if available
        if (epObj.still_path) {
          const stillUrl = `https://image.tmdb.org/t/p/w1280${epObj.still_path}`;
          state.backdrops = [stillUrl, ...state.backdrops];
          state.selectedBackdropIndex = 0;
          const bImg = await loadCorsImage(stillUrl);
          if (bImg) state.backdropImg = bImg;
          renderAssetPickerStrips();
        }

        if (typeof epObj.vote_average === 'number' && epObj.vote_average > 0) {
          state.rating = Math.max(0.5, Math.min(5, Math.round((epObj.vote_average / 2) * 2) / 2));
        }
      }

      syncReviewFormState();
      scheduleCanvasRender();
      recordCurrentFetchToHistory();
      renderHistoryListUI();
    });
  }

  document.querySelectorAll('.medium-pill').forEach((button) => {
    button.addEventListener('click', () => {
      state.medium = button.dataset.medium;
      updateMediumPillsUI(state.medium);
      scheduleCanvasRender();
      recordCurrentFetchToHistory();
      renderHistoryListUI();
    });
  });

  const starsElement = document.getElementById('interactive-stars');
  if (starsElement) {
    const handleStarPointer = (clientX, commit = false) => {
      const rect = starsElement.getBoundingClientRect();
      const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const snapped = Math.max(0.5, Math.min(5, Math.ceil((relativeX / rect.width) * 10) / 2));
      updateStarRatingUI(snapped);
      if (commit) {
        state.rating = snapped;
        scheduleCanvasRender();
        recordCurrentFetchToHistory();
        renderHistoryListUI();
      }
    };

    starsElement.addEventListener('mousemove', (event) => handleStarPointer(event.clientX, false));
    starsElement.addEventListener('mouseleave', () => updateStarRatingUI(state.rating));
    starsElement.addEventListener('click', (event) => handleStarPointer(event.clientX, true));
  }

  document.getElementById('rating-range')?.addEventListener('input', (event) => {
    state.rating = parseFloat(event.target.value);
    updateStarRatingUI(state.rating);
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
    renderHistoryListUI();
  });

  document.getElementById('clear-rating-btn')?.addEventListener('click', () => {
    state.rating = 0;
    updateStarRatingUI(0);
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
    renderHistoryListUI();
  });

  document.getElementById('heart-toggle-btn')?.addEventListener('click', () => {
    state.isLiked = !state.isLiked;
    updateHeartButtonUI(state.isLiked);
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
    renderHistoryListUI();
  });

  const bindReviewInput = (id, stateKey) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => {
      state[stateKey] = input.value;
      if (id === 'input-username') {
        localStorage.setItem('posterboxd_username', input.value);
        syncQrUrlPreview();
      }
      if (id === 'input-review') {
        const characterCount = document.getElementById('review-char-count');
        if (characterCount) characterCount.textContent = `${input.value.length} / 220`;
      }
      scheduleCanvasRender();
      recordCurrentFetchToHistory();
      renderHistoryListUI();
    });
  };

  bindReviewInput('input-review', 'review');
  bindReviewInput('input-detailed-review', 'detailedReview');
  bindReviewInput('input-watched-at', 'watchedAt');
  bindReviewInput('input-username', 'username');
  bindReviewInput('input-watched-date', 'watchedDate');

  document.getElementById('chk-show-detailed-review')?.addEventListener('change', (event) => {
    state.showDetailedReview = event.target.checked;
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
    renderHistoryListUI();
  });
}
