import { state, resetMediaState } from '../state.js';
import { DEMO_CATALOG } from '../data/demo-catalog.js';
import { buildRelevantMovieReview } from '../utils.js';
import { tmdbFetch, detectBrowserRegion } from '../services/tmdb.js';
import { fetchPublicTmdbDetail } from '../services/tmdb-public-search.js';
import { loadCorsImage, extractDominantPalette } from '../services/media-assets.js';
import { recordCurrentFetchToHistory } from '../services/storage.js';
import { renderHistoryListUI } from '../ui/history.js';
import { renderPaletteSwatchesUI, renderAssetPickerStrips } from '../ui/assets.js';
import { captureTvBaseState, syncMediaTypeControls, syncReviewFormState } from '../ui/review-form.js';
import { syncArchetypeUI } from '../ui/design-controls.js';
import { syncQrToggleVisibility } from '../ui/qr-controls.js';
import { showToast } from '../ui/toast.js';
import { switchView, updateNavigationButtonsDisabledState } from '../ui/navigation.js';

export async function loadDemoPreset(key, isExplicit = false) {
  const item = DEMO_CATALOG[key];
  if (!item) return;

  resetMediaState();
  state.hasSelectedMedia = Boolean(isExplicit);
  updateNavigationButtonsDisabledState();

  state.isFromLetterboxd = false;
  state.letterboxdUrl = '';
  state.showQrCode = false;
  syncQrToggleVisibility();

  state.tmdbId = null;
  state.mediaType = item.mediaType;
  state._baseTvDetails = null;
  state._currentSeasonData = null;
  state._currentSeasonAssets = null;
  state.seasonNumber = '';
  state.episodeNumber = '';
  state.posterOffsetX = 0;
  state.posterOffsetY = 0;
  state.title = item.title;
  state.year = item.year;
  state.director = item.director;
  state.writer = item.writer;
  state.dop = item.dop;
  state.music = item.music;
  state.cast = item.cast;
  state.genre = item.genre;
  state.runtime = item.runtime;
  state.spine = item.spine;
  state.episodeTitle = item.episodeTitle || '';
  state.rating = item.rating;
  state.isLiked = item.isLiked;
  state.medium = item.medium || 'IMAX';
  state.watchedAt = '';
  state.username = localStorage.getItem('posterboxd_username') || '';
  state.watchedDate = new Date().toISOString().split('T')[0];
  state.tags = item.tags;
  state.review = item.review;
  state.detailedReview = item.detailedReview;

  // Combine ALL posters and backdrops into BOTH pools so any combination can be chosen
  const unifiedPool = Array.from(new Set([...item.posters, ...item.backdrops]));
  state.posters = unifiedPool;
  state.backdrops = unifiedPool;
  state.logos = Array.from(new Set(item.logos));
  state.selectedPosterIndex = 0;
  state.selectedBackdropIndex = item.posters.length < unifiedPool.length ? item.posters.length : 0;
  state.selectedLogoIndex = 0;

  syncArchetypeUI();
  syncMediaTypeControls();
  syncReviewFormState();

  const [pImg, bImg, lImg] = await Promise.all([
    loadCorsImage(state.posters[state.selectedPosterIndex]),
    loadCorsImage(state.backdrops[state.selectedBackdropIndex]),
    loadCorsImage(state.logos[0])
  ]);
  state.posterImg = pImg;
  state.backdropImg = bImg;
  state.logoImg = lImg;

  syncArchetypeUI();

  if (pImg) {
    state.palette = extractDominantPalette(pImg, state.palette);
    renderPaletteSwatchesUI();
  }
  captureTvBaseState();
  renderAssetPickerStrips();
  switchView('review');
}

export async function loadRegionalNowPlayingMovies() {
  const regionInfo = detectBrowserRegion();
  const regionLabel = document.getElementById('trending-region-label');
  const chipsContainer = document.getElementById('home-trending-chips');
  if (!chipsContainer) return;

  if (!state.tmdbApiKey) {
    chipsContainer.innerHTML = '';
    if (regionLabel?.parentElement) regionLabel.parentElement.classList.add('hidden');
    return;
  }
  if (regionLabel?.parentElement) regionLabel.parentElement.classList.remove('hidden');

  try {
    if (regionLabel) regionLabel.textContent = `In Theaters Now (${regionInfo.name}):`;
    const data = await tmdbFetch('/movie/now_playing', { region: regionInfo.code });
    const topMovies = (data.results || []).slice(0, 5);
    if (topMovies.length === 0) return;

    chipsContainer.innerHTML = topMovies.map(m => {
      const yr = (m.release_date || '').substring(0, 4);
      return `<button type="button" data-live-id="${m.id}" class="text-xs px-3 py-1.5 rounded-full bg-cardbg hover:bg-elevated border border-lbgreen/30 text-gray-100 transition flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-lbgreen"></span>
        <span>${m.title}${yr ? ` (${yr})` : ''}</span>
      </button>`;
    }).join('');

    chipsContainer.querySelectorAll('[data-live-id]').forEach(btn => {
      btn.addEventListener('click', () => loadTmdbMediaDetails(btn.dataset.liveId, 'movie'));
    });
  } catch (e) {}
}

export async function loadTmdbMediaDetails(id, mediaType, preserveCustomReview = false) {
  showToast('Loading TMDB artwork & credits...');
  try {
    const endpoint = mediaType === 'tv' ? `/tv/${id}` : `/movie/${id}`;
    const requests = [
      tmdbFetch(endpoint),
      tmdbFetch(`${endpoint}/credits`),
      tmdbFetch(`${endpoint}/images`),
      tmdbFetch(`${endpoint}/watch/providers`).catch(() => null)
    ];
    if (mediaType === 'movie') {
      requests.push(tmdbFetch(`/movie/${id}/release_dates`).catch(() => null));
    }
    const [details, credits, images, providersData, releaseDatesData] = await Promise.all(requests);

    const preservedReview = preserveCustomReview ? {
      review: state.review,
      detailedReview: state.detailedReview,
      showDetailedReview: state.showDetailedReview,
      rating: state.rating,
      isLiked: state.isLiked,
      watchedDate: state.watchedDate,
      username: state.username,
      isFromLetterboxd: state.isFromLetterboxd,
      letterboxdUrl: state.letterboxdUrl,
      showQrCode: state.showQrCode
    } : null;

    resetMediaState();

    if (preservedReview) {
      Object.assign(state, preservedReview);
    }

    state.tmdbId = id;
    state.mediaType = mediaType;
    state.title = details.title || details.name || '';
    state.spine = `#${String(id).slice(-4)}`;
    state.episodeTitle = '';
    syncArchetypeUI();

    // Set rating to actual TMDB score (vote_average / 2, rounded to nearest 0.5), or 0 (Unrated) if none
    if (!preserveCustomReview && !state.isFromLetterboxd) {
      if (typeof details.vote_average === 'number' && details.vote_average > 0) {
        state.rating = Math.max(0.5, Math.min(5, Math.round((details.vote_average / 2) * 2) / 2));
      } else {
        state.rating = 0;
      }
    }

    if (mediaType === 'tv') {
      const firstY = details.first_air_date ? details.first_air_date.substring(0, 4) : '';
      const lastY = details.last_air_date ? details.last_air_date.substring(0, 4) : '';
      state.year = firstY ? `${firstY}${lastY && lastY !== firstY ? `–${lastY}` : ''}` : '';
      state.director = details.created_by?.map(c => c.name).join(', ') || credits.crew?.find(c => c.job === 'Director')?.name || '';
      const seasonsCount = details.number_of_seasons || 1;
      state.runtime = `${seasonsCount} Season${seasonsCount > 1 ? 's' : ''}`;
      const seasonSel = document.getElementById('tv-season-select');
      const validSeasons = (details.seasons || []).filter(s => s.season_number > 0);
      seasonSel.innerHTML = '<option value="">All Seasons</option>' +
        validSeasons.map(s => `<option value="${s.season_number}">Season ${s.season_number} (${s.episode_count} eps)</option>`).join('');
      document.getElementById('tv-episode-select').disabled = true;
    } else {
      state.year = details.release_date ? details.release_date.substring(0, 4) : '';
      state.director = credits.crew?.find(c => c.job === 'Director')?.name || '';
      if (details.runtime) {
        const h = Math.floor(details.runtime / 60);
        const m = details.runtime % 60;
        state.runtime = h > 0 ? `${h}h ${m}m` : `${m}m`;
      } else state.runtime = '';
    }

    // Requirement 12: Automatically detect OTT vs Theater release from TMDB release_dates & watch/providers
    const regionCode = detectBrowserRegion().code;
    const regionProviders = providersData?.results?.[regionCode] || providersData?.results?.US || providersData?.results?.IN || Object.values(providersData?.results || {})[0];
    const flatrateList = regionProviders?.flatrate || [];
    let hasDigitalRelease = false;
    if (releaseDatesData?.results) {
      hasDigitalRelease = releaseDatesData.results.some(r =>
        (r.release_dates || []).some(d => d.type >= 4) // TMDB type 4 = Digital, 5 = Physical, 6 = TV
      );
    }
    const releaseYearNum = parseInt(state.year, 10);
    const ageMonths = details.release_date ? (Date.now() - new Date(details.release_date).getTime()) / (1000 * 3600 * 24 * 30) : 0;

    if (mediaType === 'tv' || flatrateList.length > 0 || hasDigitalRelease || ageMonths > 3.5 || (releaseYearNum && releaseYearNum < new Date().getFullYear())) {
      const provNames = flatrateList.map(p => (p.provider_name || '').toLowerCase()).join(' ');
      if (provNames.includes('netflix')) state.medium = 'NETFLIX';
      else if (provNames.includes('hotstar') || provNames.includes('jio')) state.medium = 'JIOHOTSTAR';
      else if (provNames.includes('prime') || provNames.includes('amazon')) state.medium = 'PRIME';
      else state.medium = 'OTT';
    } else {
      state.medium = 'THEATER';
    }

    state.writer = credits.crew?.filter(c => ['Writer', 'Screenplay', 'Story'].includes(c.job)).slice(0, 2).map(c => c.name).join(', ') || state.director;
    state.dop = credits.crew?.find(c => ['Director of Photography', 'Cinematography'].includes(c.job))?.name || '';
    state.music = credits.crew?.find(c => ['Original Music Composer', 'Music'].includes(c.job))?.name || '';
    state.cast = credits.cast?.slice(0, 4).map(c => c.name).join(', ') || '';
    state.genre = details.genres?.slice(0, 3).map(g => g.name).join(' | ') || '';

    if (!preserveCustomReview) {
      state.isFromLetterboxd = false;
      state.letterboxdUrl = '';
      state.showQrCode = false;
      state.review = buildRelevantMovieReview(state.title, state.director, state.cast, state.genre, state.mediaType, state.rating);
      // Do NOT dump TMDB's plot synopsis into Detailed Review by default (keeps posters uncluttered!)
      state.detailedReview = '';
    }
    syncQrToggleVisibility();

    // In TV Series, skip movie-only poster styles if user is currently on a cinema ticket style
    if (mediaType === 'tv') {
      if (['ticket', 'marquee'].includes(state.archetype)) {
        state.archetype = 'classic';
      }
    }

    const posterUrls = Array.from(new Set([details.poster_path, ...(images.posters || []).slice(0, 16).map(p => p.file_path)].filter(Boolean)))
      .map(p => `https://image.tmdb.org/t/p/w780${p}`);
    const backdropUrls = Array.from(new Set([details.backdrop_path, ...(images.backdrops || []).slice(0, 16).map(b => b.file_path)].filter(Boolean)))
      .map(b => `https://image.tmdb.org/t/p/w1280${b}`);

    const allCombinedImages = Array.from(new Set([...posterUrls, ...backdropUrls]));
    state.posters = allCombinedImages;
    state.backdrops = allCombinedImages;
    state._showAllImages = allCombinedImages;

    const sortedLogos = [...(images.logos || [])].sort((a, b) => {
      const isEnA = (a.iso_639_1 === 'en' || a.iso_639_1 === 'en-US' || a.iso_639_1 === null) ? 1 : 0;
      const isEnB = (b.iso_639_1 === 'en' || b.iso_639_1 === 'en-US' || b.iso_639_1 === null) ? 1 : 0;
      if (isEnA !== isEnB) return isEnB - isEnA; // English / US priority 1
      return (b.vote_average || 0) - (a.vote_average || 0);
    });
    const rawLogos = sortedLogos.slice(0, 24).map(l => `https://image.tmdb.org/t/p/w500${l.file_path}`);
    state.logos = Array.from(new Set(rawLogos));

    state.selectedPosterIndex = 0;
    const firstBackdropIdx = posterUrls.length < allCombinedImages.length ? posterUrls.length : 0;
    state.selectedBackdropIndex = firstBackdropIdx;
    state.selectedLogoIndex = 0;
    state.posterOffsetX = 0;
    state.posterOffsetY = 0;

    const [pImg, bImg, lImg] = await Promise.all([
      loadCorsImage(state.posters[state.selectedPosterIndex]),
      loadCorsImage(state.backdrops[state.selectedBackdropIndex]),
      loadCorsImage(state.logos[0])
    ]);
    state.posterImg = pImg;
    state.backdropImg = bImg;
    state.logoImg = lImg;

    state.hasSelectedMedia = true;
    updateNavigationButtonsDisabledState();

    syncArchetypeUI();
    syncMediaTypeControls();

    if (pImg) {
      state.palette = extractDominantPalette(pImg, state.palette);
      renderPaletteSwatchesUI();
    }
    captureTvBaseState();
    renderAssetPickerStrips();
    syncReviewFormState();
    recordCurrentFetchToHistory();
    renderHistoryListUI();
    switchView('review');
    showToast(`Selected "${state.title}" (${state.medium})`);
  } catch (err) {
    showToast(`Could not load TMDB details: ${err.message}`, true);
  }
}

export async function loadPublicMediaDetails(item) {
  showToast('Loading TMDB details (No-API mode)...');
  try {
    const detail = await fetchPublicTmdbDetail(item);

    resetMediaState();
    state.hasSelectedMedia = true;
    updateNavigationButtonsDisabledState();

    state.isFromLetterboxd = false;
    state.letterboxdUrl = '';
    state.showQrCode = false;
    syncQrToggleVisibility();

    state.tmdbId = detail.id || item.id;
    state.mediaType = detail.media_type || item.media_type || 'movie';
    state.title = detail.title || detail.name || item.title || item.name || 'Untitled';
    state.year = detail.release_year || item.release_year || '';
    state.spine = state.year ? `#${state.year}` : `#${String(state.tmdbId).slice(-4)}`;
    state.director = detail.director || '';
    state.writer = detail.writer || '';
    state.dop = '';
    state.music = '';
    state.cast = (detail.credits?.cast || []).slice(0, 4).map(c => c.name).join(', ') || '';
    state.genre = (detail.genres || []).slice(0, 3).map(g => g.name).join(' | ') || '';
    if (detail.runtime) {
      const h = Math.floor(detail.runtime / 60);
      const m = detail.runtime % 60;
      state.runtime = h > 0 ? `${h}h ${m}m` : `${m}m`;
    } else {
      state.runtime = '';
    }
    state.medium = 'THEATER';
    if (!state.isFromLetterboxd) {
      if (typeof detail.vote_average === 'number' && detail.vote_average > 0) {
        state.rating = Math.max(0.5, Math.min(5, Math.round((detail.vote_average / 2) * 2) / 2));
      } else {
        state.rating = 0;
      }
      state.review = buildRelevantMovieReview(state.title, state.director, state.cast, state.genre, state.mediaType, state.rating);
      state.detailedReview = '';
    }

    const pUrls = Array.from(new Set([
      ...(detail.all_posters || []),
      detail.poster_url,
      item.poster_url
    ].filter(Boolean)));

    const bUrls = Array.from(new Set([
      ...(detail.all_backdrops || []),
      detail.backdrop_url,
      ...pUrls
    ].filter(Boolean)));

    state.posters = pUrls.length > 0 ? pUrls : [];
    state.backdrops = bUrls.length > 0 ? bUrls : [];
    state._showAllImages = Array.from(new Set([...state.posters, ...state.backdrops]));
    state.selectedPosterIndex = 0;
    state.selectedBackdropIndex = 0;
    state.logos = [];
    state.selectedLogoIndex = 0;
    state.logoImg = null;

    const [pImg, bImg] = await Promise.all([
      loadCorsImage(state.posters[0]),
      loadCorsImage(state.backdrops[0] || state.posters[0])
    ]);
    state.posterImg = pImg;
    state.backdropImg = bImg;

    if (pImg) {
      state.palette = extractDominantPalette(pImg, state.palette);
      renderPaletteSwatchesUI();
    }

    syncArchetypeUI();
    syncMediaTypeControls();
    captureTvBaseState();
    renderAssetPickerStrips();
    syncReviewFormState();
    recordCurrentFetchToHistory();
    renderHistoryListUI();
    switchView('review');
    showToast(`Loaded "${state.title}" (No-API mode)`);
  } catch (err) {
    showToast(`Could not load title details: ${err.message}`, true);
  }
}

