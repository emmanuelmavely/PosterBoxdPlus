import { state } from '../state.js';
import { buildRelevantMovieReview } from '../utils.js';
import { getReviewCharacterLimit } from '../constants.js';
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

export function syncMediaTypeControls() {
  const isTv = state.mediaType === 'tv';
  const selectedMediumIsMovieOnly = isTv && document.querySelector(`.medium-pill[data-medium="${state.medium}"][data-movie-only="true"]`);

  if (selectedMediumIsMovieOnly) state.medium = 'OTT';

  document.querySelectorAll('.medium-pill[data-movie-only="true"]').forEach((button) => {
    const hidden = isTv;
    button.classList.toggle('hidden', hidden);
    button.disabled = hidden;
    button.setAttribute('aria-hidden', String(hidden));
  });
}

function getAssetSnapshot() {
  return {
    posters: [...state.posters],
    backdrops: [...state.backdrops],
    logos: [...state.logos],
    selectedPosterIndex: state.selectedPosterIndex,
    selectedBackdropIndex: state.selectedBackdropIndex,
    selectedLogoIndex: state.selectedLogoIndex,
    posterImg: state.posterImg,
    backdropImg: state.backdropImg,
    logoImg: state.logoImg,
    palette: [...state.palette]
  };
}

function applyAssetSnapshot(snapshot) {
  if (!snapshot) return;
  state.posters = [...(snapshot.posters || [])];
  state.backdrops = [...(snapshot.backdrops || [])];
  state.logos = [...(snapshot.logos || [])];
  state.selectedPosterIndex = snapshot.selectedPosterIndex || 0;
  state.selectedBackdropIndex = snapshot.selectedBackdropIndex || 0;
  state.selectedLogoIndex = snapshot.selectedLogoIndex || 0;
  state.posterImg = snapshot.posterImg || null;
  state.backdropImg = snapshot.backdropImg || null;
  state.logoImg = snapshot.logoImg || null;
  state.palette = [...(snapshot.palette || state.palette)];
}

function restoreTvBaseMetadata() {
  const base = state._baseTvDetails;
  if (!base) return;
  state.director = base.director || '';
  state.writer = base.writer || '';
  state.cast = base.cast || '';
  state.runtime = base.runtime || '';
  state.rating = Number.isFinite(base.rating) ? base.rating : 0;
  state.spine = base.spine || state.spine;
}

async function hydrateSelectedAssets() {
  if (!state.posterImg && state.posters[state.selectedPosterIndex]) {
    state.posterImg = await loadCorsImage(state.posters[state.selectedPosterIndex]);
  }
  if (!state.backdropImg && state.backdrops[state.selectedBackdropIndex]) {
    state.backdropImg = await loadCorsImage(state.backdrops[state.selectedBackdropIndex]);
  }
  if (!state.logoImg && state.logos[state.selectedLogoIndex]) {
    state.logoImg = await loadCorsImage(state.logos[state.selectedLogoIndex]);
  }
}

export function captureTvBaseState() {
  if (state.mediaType !== 'tv') {
    state._baseTvDetails = null;
    state._currentSeasonData = null;
    state._currentSeasonAssets = null;
    return;
  }

  const assets = getAssetSnapshot();
  state._showAllImages = [...state.posters];
  state._baseTvDetails = {
    director: state.director,
    writer: state.writer,
    cast: state.cast,
    runtime: state.runtime,
    rating: state.rating,
    spine: state.spine,
    assets
  };
  state._currentSeasonData = null;
  state._currentSeasonAssets = null;
}

export async function restoreTvBaseState() {
  const base = state._baseTvDetails;
  if (!base) return;

  restoreTvBaseMetadata();
  applyAssetSnapshot(base.assets);
  state._showAllImages = [...state.posters];
  state._currentSeasonData = null;
  state._currentSeasonAssets = null;
  state.seasonNumber = '';
  state.episodeNumber = '';
  state.episodeTitle = '';
  await hydrateSelectedAssets();
  renderPaletteSwatchesUI();
  renderAssetPickerStrips();
}

async function selectTvSeason(seasonNumber, episodeSelect) {
  const base = state._baseTvDetails;
  if (!base) return;

  restoreTvBaseMetadata();
  applyAssetSnapshot(base.assets);
  state._currentSeasonData = null;
  state._currentSeasonAssets = null;
  state.seasonNumber = String(seasonNumber);
  state.episodeNumber = '';
  state.episodeTitle = `Season ${seasonNumber}`;
  state.spine = `#S${String(seasonNumber).padStart(2, '0')}`;

  episodeSelect.innerHTML = '<option value="">All Episodes</option>';
  episodeSelect.disabled = true;

  if (state.tmdbId) {
    try {
      const [seasonData, seasonImages] = await Promise.all([
        tmdbFetch(`/tv/${state.tmdbId}/season/${seasonNumber}`),
        tmdbFetch(`/tv/${state.tmdbId}/season/${seasonNumber}/images`).catch(() => null)
      ]);
      state._currentSeasonData = seasonData;

      const seasonPosters = (seasonImages?.posters || [])
        .slice(0, 8)
        .map((poster) => `https://image.tmdb.org/t/p/w780${poster.file_path}`);
      if (seasonData.poster_path) seasonPosters.unshift(`https://image.tmdb.org/t/p/w780${seasonData.poster_path}`);
      const uniqueSeasonPosters = Array.from(new Set(seasonPosters.filter(Boolean)));

      if (uniqueSeasonPosters.length > 0) {
        state.posters = uniqueSeasonPosters;
        state.backdrops = uniqueSeasonPosters;
        state.selectedPosterIndex = 0;
        state.selectedBackdropIndex = 0;
        const seasonImage = await loadCorsImage(uniqueSeasonPosters[0]);
        state.posterImg = seasonImage || base.assets.posterImg;
        state.backdropImg = seasonImage || base.assets.backdropImg;
        if (state.posterImg) state.palette = extractDominantPalette(state.posterImg, state.palette);
      }

      state._currentSeasonAssets = getAssetSnapshot();
      episodeSelect.innerHTML += (seasonData.episodes || [])
        .map((episode) => `<option value="${episode.episode_number}">E${episode.episode_number} · ${episode.name}</option>`)
        .join('');
      episodeSelect.disabled = false;
    } catch (error) {
      // Keep the season label and base artwork usable when optional season data fails.
      state._currentSeasonAssets = getAssetSnapshot();
    }
  } else {
    state._currentSeasonAssets = getAssetSnapshot();
  }

  renderPaletteSwatchesUI();
  renderAssetPickerStrips();
}

async function selectTvEpisode(seasonNumber, episodeNumber, episodeSelect, preserveRating = false) {
  const base = state._baseTvDetails;
  if (!base || !seasonNumber) return;

  const seasonData = state._currentSeasonData;
  const seasonAssets = state._currentSeasonAssets || base.assets;
  restoreTvBaseMetadata();
  applyAssetSnapshot(seasonAssets);
  state._currentSeasonData = seasonData;
  state._currentSeasonAssets = seasonAssets;
  state.seasonNumber = String(seasonNumber);
  state.episodeNumber = episodeNumber ? String(episodeNumber) : '';

  const seasonNumberPadded = String(seasonNumber).padStart(2, '0');
  if (!episodeNumber) {
    state.episodeTitle = `Season ${seasonNumber}`;
    state.spine = `#S${seasonNumberPadded}`;
    await hydrateSelectedAssets();
    renderPaletteSwatchesUI();
    renderAssetPickerStrips();
    return;
  }

  const episodeNumberPadded = String(episodeNumber).padStart(2, '0');
  const episode = seasonData?.episodes?.find((item) => String(item.episode_number) === String(episodeNumber));
  const episodeName = episode?.name
    || episodeSelect.options[episodeSelect.selectedIndex]?.text?.replace(/^E\d+\s*·\s*/, '')
    || '';
  state.episodeTitle = `S${seasonNumberPadded}E${episodeNumberPadded} - ${episodeName}`;
  state.spine = `#S${seasonNumberPadded}E${episodeNumberPadded}`;

  if (episode) {
    const episodeDirector = episode.crew?.find((crew) => crew.job === 'Director')?.name;
    const episodeWriters = episode.crew
      ?.filter((crew) => ['Writer', 'Screenplay', 'Story'].includes(crew.job))
      .slice(0, 2)
      .map((crew) => crew.name)
      .join(', ');
    const episodeCast = (episode.guest_stars || []).slice(0, 4).map((cast) => cast.name).join(', ');

    state.director = episodeDirector || base.director || '';
    state.writer = episodeWriters || base.writer || '';
    state.cast = episodeCast || base.cast || '';
    if (episode.runtime) {
      const hours = Math.floor(episode.runtime / 60);
      const minutes = episode.runtime % 60;
      state.runtime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    if (!preserveRating && typeof episode.vote_average === 'number' && episode.vote_average > 0) {
      state.rating = Math.max(0.5, Math.min(5, Math.round((episode.vote_average / 2) * 2) / 2));
    }

    if (episode.still_path) {
      const stillUrl = `https://image.tmdb.org/t/p/w1280${episode.still_path}`;
      state.backdrops = [stillUrl, ...state.backdrops.filter((url) => url !== stillUrl)];
      state.selectedBackdropIndex = 0;
      state.backdropImg = await loadCorsImage(stillUrl) || state.backdropImg;
    }
  }

  renderPaletteSwatchesUI();
  renderAssetPickerStrips();
}

export async function restoreTvSelectionFromHistory() {
  const seasonSelect = document.getElementById('tv-season-select');
  const episodeSelect = document.getElementById('tv-episode-select');
  if (!seasonSelect || !episodeSelect || state.mediaType !== 'tv' || !state.tmdbId || !state.seasonNumber) return;

  try {
    const requestedSeason = String(state.seasonNumber);
    const requestedEpisode = String(state.episodeNumber || '');
    const details = await tmdbFetch(`/tv/${state.tmdbId}`);
    const validSeasons = (details.seasons || []).filter((season) => season.season_number > 0);
    seasonSelect.innerHTML = '<option value="">All Seasons</option>' +
      validSeasons.map((season) => `<option value="${season.season_number}">Season ${season.season_number} (${season.episode_count} eps)</option>`).join('');
    seasonSelect.value = requestedSeason;
    if (seasonSelect.value !== requestedSeason) return;

    await selectTvSeason(requestedSeason, episodeSelect);
    if (requestedEpisode) {
      episodeSelect.value = requestedEpisode;
      if (episodeSelect.value === requestedEpisode) {
        await selectTvEpisode(requestedSeason, requestedEpisode, episodeSelect, true);
      }
    }
    syncReviewFormState();
  } catch (error) {
    // The history entry remains usable even when TMDB is temporarily unavailable.
  }
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

export function syncRatingPaneFreeze() {
  const isFrozen = Boolean(state.isFromLetterboxd);
  const ratingRange = document.getElementById('rating-range');
  const clearBtn = document.getElementById('clear-rating-btn');
  const starsElement = document.getElementById('interactive-stars');
  const lockedBadge = document.getElementById('rating-locked-badge');

  if (lockedBadge) {
    lockedBadge.classList.toggle('hidden', !isFrozen);
    lockedBadge.classList.toggle('inline-flex', isFrozen);
  }
  if (ratingRange) {
    ratingRange.disabled = isFrozen;
    ratingRange.classList.toggle('opacity-40', isFrozen);
    ratingRange.classList.toggle('cursor-not-allowed', isFrozen);
  }
  if (clearBtn) {
    clearBtn.disabled = isFrozen;
    clearBtn.classList.toggle('opacity-20', isFrozen);
    clearBtn.classList.toggle('pointer-events-none', isFrozen);
  }
  if (starsElement) {
    starsElement.classList.toggle('pointer-events-none', isFrozen);
    starsElement.classList.toggle('cursor-not-allowed', isFrozen);
    starsElement.classList.toggle('opacity-80', isFrozen);
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
  const detailedCharacterCount = document.getElementById('detailed-review-char-count');

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
  if (detailedReviewInput) {
    detailedReviewInput.removeAttribute('maxlength');
    detailedReviewInput.value = state.detailedReview || '';
  }
  if (detailedReviewToggle) detailedReviewToggle.checked = Boolean(state.showDetailedReview);
  if (watchedAtInput) watchedAtInput.value = state.watchedAt || '';
  if (usernameInput) usernameInput.value = state.username || '';
  if (watchedDateInput) watchedDateInput.value = state.watchedDate || '';
  if (characterCount) characterCount.textContent = `${review.length} / 220`;
  if (detailedCharacterCount) detailedCharacterCount.textContent = `${(state.detailedReview || '').length} chars`;

  syncQrToggleVisibility();
  syncMediaTypeControls();
  syncQrUrlPreview();
  updateMediumPillsUI(state.medium);
  updateStarRatingUI(state.rating);
  syncRatingPaneFreeze();
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
    const detailedCharacterCount = document.getElementById('detailed-review-char-count');
    if (detailedReviewInput) detailedReviewInput.value = '';
    if (detailedCharacterCount) detailedCharacterCount.textContent = '0 chars';
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
        episodeSelect.innerHTML = '<option value="">All Episodes</option>';
        episodeSelect.disabled = true;
        await restoreTvBaseState();
        syncReviewFormState();
        scheduleCanvasRender();
        recordCurrentFetchToHistory();
        renderHistoryListUI();
        return;
      }

      await selectTvSeason(seasonNumber, episodeSelect);
      syncReviewFormState();
      scheduleCanvasRender();
      recordCurrentFetchToHistory();
      renderHistoryListUI();
    });

    episodeSelect.addEventListener('change', async () => {
      const seasonNumber = seasonSelect.value;
      const episodeNumber = episodeSelect.value;
      if (!seasonNumber || !episodeNumber) {
        if (seasonNumber) await selectTvEpisode(seasonNumber, '', episodeSelect);
        syncReviewFormState();
        scheduleCanvasRender();
        recordCurrentFetchToHistory();
        renderHistoryListUI();
        return;
      }

      await selectTvEpisode(seasonNumber, episodeNumber, episodeSelect);
      syncReviewFormState();
      scheduleCanvasRender();
      recordCurrentFetchToHistory();
      renderHistoryListUI();
    });
  }

  document.querySelectorAll('.medium-pill').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.mediaType === 'tv' && button.dataset.movieOnly === 'true') return;
      state.medium = button.dataset.medium;
      syncMediaTypeControls();
      updateMediumPillsUI(state.medium);
      scheduleCanvasRender();
      recordCurrentFetchToHistory();
      renderHistoryListUI();
    });
  });

  const starsElement = document.getElementById('interactive-stars');
  if (starsElement) {
    const handleStarPointer = (clientX, commit = false) => {
      if (state.isFromLetterboxd) return;
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
    if (state.isFromLetterboxd) return;
    state.rating = parseFloat(event.target.value);
    updateStarRatingUI(state.rating);
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
    renderHistoryListUI();
  });

  document.getElementById('clear-rating-btn')?.addEventListener('click', () => {
    if (state.isFromLetterboxd) return;
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
        if (characterCount) characterCount.textContent = `${input.value.length} / ${getReviewCharacterLimit(state.archetype)}`;
      }
      if (id === 'input-detailed-review') {
        const detailedCharacterCount = document.getElementById('detailed-review-char-count');
        if (detailedCharacterCount) detailedCharacterCount.textContent = `${input.value.length} chars`;
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
