import { state } from '../state.js';

const HISTORY_STORAGE_KEY = 'posterboxd_fetch_history_v1';
const TRANSFORMS_STORAGE_KEY = 'posterboxd_transforms_v3';

export function getSavedHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

export function saveHistoryArray(entries) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, 35)));
  } catch (error) {
    // Browsers can reject localStorage in private or quota-limited contexts.
  }
}

export function recordCurrentFetchToHistory() {
  if (!state.title) return;
  const history = getSavedHistory();
  const entryId = `${state.mediaType}-${state.tmdbId || state.title.toLowerCase()}-${state.year}`;
  const newEntry = {
    id: entryId,
    timestamp: Date.now(),
    mediaType: state.mediaType,
    tmdbId: state.tmdbId,
    title: state.title,
    year: state.year,
    director: state.director,
    writer: state.writer,
    dop: state.dop,
    music: state.music,
    cast: state.cast,
    genre: state.genre,
    runtime: state.runtime,
    spine: state.spine,
    baseSpine: state._baseTvDetails?.spine || '',
    episodeTitle: state.episodeTitle || '',
    seasonNumber: state.seasonNumber || '',
    episodeNumber: state.episodeNumber || '',
    rating: state.rating,
    isLiked: state.isLiked,
    medium: state.medium,
    watchedAt: state.watchedAt,
    username: state.username,
    watchedDate: state.watchedDate,
    review: state.review,
    detailedReview: state.detailedReview,
    detailedReviewCharacterLimit: state.detailedReviewCharacterLimit,
    detailedReviewCharacterLimits: state.detailedReviewCharacterLimits,
    showDetailedReview: state.showDetailedReview,
    isFromLetterboxd: state.isFromLetterboxd,
    letterboxdUrl: state.letterboxdUrl,
    showQrCode: state.showQrCode,
    posterOffsetX: state.posterOffsetX || 0,
    posterOffsetY: state.posterOffsetY || 0,
    archetype: state.archetype,
    aspectRatio: state.aspectRatio,
    backdropBrightness: state.backdropBrightness,
    backdropBlur: state.backdropBlur,
    posterScale: state.posterScale,
    fontScale: state.fontScale,
    gradientOverlay: state.gradientOverlay,
    filmGrain: state.filmGrain,
    marqueeBulbMode: state.marqueeBulbMode,
    useLogoImage: state.useLogoImage,
    selectedPosterUrl: state.posters[state.selectedPosterIndex] || '',
    selectedBackdropUrl: state.backdrops[state.selectedBackdropIndex] || '',
    selectedLogoUrl: state.logos[state.selectedLogoIndex] || '',
    posters: state.posters.slice(0, 8),
    backdrops: state.backdrops.slice(0, 8),
    logos: state.logos.slice(0, 4)
  };
  const filtered = history.filter(item => item.id !== entryId);
  filtered.unshift(newEntry);
  saveHistoryArray(filtered);
}

export function saveTransformsToStorage() {
  try {
    localStorage.setItem(TRANSFORMS_STORAGE_KEY, JSON.stringify(state.elementTransformsByArchetype));
  } catch (error) {
    // Ignore storage failures; the current session still retains transforms.
  }
}
