import { state, resetMediaState } from '../state.js';
import { tmdbFetch } from '../services/tmdb.js';
import {
  cleanLetterboxdRawTitle,
  cleanLetterboxdParagraphs
} from '../services/letterboxd.js';
import { loadCorsImage, extractDominantPalette } from '../services/media-assets.js';
import { recordCurrentFetchToHistory } from '../services/storage.js';
import { loadTmdbMediaDetails } from './media.js';
import { renderHistoryListUI } from '../ui/history.js';
import { renderPaletteSwatchesUI, renderAssetPickerStrips } from '../ui/assets.js';
import { syncReviewFormState } from '../ui/review-form.js';
import { syncQrToggleVisibility } from '../ui/qr-controls.js';
import { showToast } from '../ui/toast.js';
import { switchView, updateNavigationButtonsDisabledState } from '../ui/navigation.js';
import { scheduleCanvasRender } from '../rendering/canvas-renderer.js';

export async function applyLetterboxdReviewData(reviewData) {
  if (!reviewData) return false;

  const banner = document.getElementById('lb-fetch-status-banner');
  const statusText = document.getElementById('lb-fetch-status-text');
  if (banner) {
    banner.classList.remove('hidden');
    banner.classList.add('inline-flex');
  }

  try {
    let movieTitle = reviewData.movieTitle || '';
    let releaseYear = reviewData.releaseYear || '';
    let reviewer = reviewData.reviewer || '';
    let rating = Number(reviewData.rating) || 0;
    let isLiked = Boolean(reviewData.isLiked);
    let watchedDate = reviewData.watchedDate || '';
    let reviewLines = reviewData.reviewLines || [];
    let posterImgUrl = reviewData.posterImg || '';
    let reviewUrl = reviewData.url || '';

    // Support raw JSON structure like { url, movie: { title, year, posterUrl }, reviewer: { name }, review: { ratingStars, paragraphs, date } }
    if (reviewData.movie || reviewData.review) {
      const parsedTitleObj = cleanLetterboxdRawTitle(
        reviewData.movie?.title || '',
        reviewData.movie?.year || ''
      );
      movieTitle = parsedTitleObj.title;
      releaseYear = parsedTitleObj.year;
      posterImgUrl = reviewData.movie?.posterUrl || '';
      reviewer = reviewData.reviewer?.name || reviewer;
      rating = Number(reviewData.review?.ratingStars ?? rating) || 0;
      watchedDate = reviewData.review?.date || '';
      reviewLines = cleanLetterboxdParagraphs(reviewData.review?.paragraphs || []);
      reviewUrl = reviewData.url || '';
    }

    resetMediaState();
    state.isFromLetterboxd = true;
    state.showQrCode = Boolean(reviewUrl);
    state.letterboxdUrl = reviewUrl;
    state.hasSelectedMedia = true;
    updateNavigationButtonsDisabledState();
    syncQrToggleVisibility();

    if (movieTitle) state.title = movieTitle;
    if (releaseYear) {
      state.year = releaseYear;
      state.spine = `#${releaseYear}`;
    }
    if (reviewer) {
      state.username = reviewer;
      localStorage.setItem('posterboxd_username', reviewer);
    }
    const importedRating = rating;
    state.rating = importedRating;
    state.isLiked = isLiked;

    if (watchedDate && !/recently/i.test(watchedDate)) {
      const parsedD = new Date(watchedDate);
      if (!isNaN(parsedD.getTime())) {
        const yyyy = parsedD.getFullYear();
        const mm = String(parsedD.getMonth() + 1).padStart(2, '0');
        const dd = String(parsedD.getDate()).padStart(2, '0');
        state.watchedDate = `${yyyy}-${mm}-${dd}`;
      }
    }

    // Split review into punchy first-line headline and remaining detailed review notes
    if (reviewLines.length > 0) {
      state.review = reviewLines[0].substring(0, 220);
      state.detailedReview = reviewLines.slice(1).join(' ').trim();
    }

    // Load non-empty Letterboxd poster if available before TMDB enrichment
    if (posterImgUrl && !posterImgUrl.includes('empty-poster')) {
      const loadedPoster = await loadCorsImage(posterImgUrl);
      if (loadedPoster) {
        state.posters = [posterImgUrl];
        state.backdrops = [posterImgUrl];
        state.selectedPosterIndex = 0;
        state.selectedBackdropIndex = 0;
        state.posterImg = loadedPoster;
        state.backdropImg = loadedPoster;
        state.palette = extractDominantPalette(loadedPoster, state.palette);
        renderPaletteSwatchesUI();
      }
    }

    // Automatically match on TMDB to pull high-res posters, backdrops, logos, director & cast
    if (movieTitle && state.tmdbApiKey) {
      if (statusText) statusText.textContent = `Matched "${movieTitle}" (${releaseYear}) — Fetching TMDB artwork...`;
      try {
        let searchData = await tmdbFetch('/search/movie', { query: movieTitle, year: releaseYear });
        let firstHit = searchData.results?.[0];
        if (!firstHit && releaseYear) {
          searchData = await tmdbFetch('/search/movie', { query: movieTitle });
          firstHit = searchData.results?.[0];
        }
        if (firstHit) {
          await loadTmdbMediaDetails(firstHit.id, 'movie', true);
          state.isFromLetterboxd = true;
          state.rating = importedRating; // Freeze rating from PosterBoxd review strictly
          state.showQrCode = Boolean(reviewUrl);
          state.letterboxdUrl = reviewUrl;
          state.hasSelectedMedia = true;
          updateNavigationButtonsDisabledState();
          syncQrToggleVisibility();
          syncReviewFormState();
          recordCurrentFetchToHistory();
          renderHistoryListUI();
          showToast(`Imported Letterboxd review for "${state.title}" (${state.rating}★)`);
          return true;
        }
      } catch (tmdbErr) {}
    }

    if (movieTitle) state.title = movieTitle;
    if (releaseYear) state.year = releaseYear;
    // Explicitly clear any stale crew/metadata/logos when no TMDB key is present
    state.director = '';
    state.writer = '';
    state.dop = '';
    state.music = '';
    state.cast = '';
    state.genre = '';
    state.runtime = '';
    state.logos = [];
    state.logoImg = null;
    state.selectedLogoIndex = 0;

    renderAssetPickerStrips();
    syncReviewFormState();
    recordCurrentFetchToHistory();
    renderHistoryListUI();
    switchView('review');
    scheduleCanvasRender();
    showToast(`Imported Letterboxd review: ${state.title} (${state.rating}★)`);
    return true;
  } finally {
    if (banner) {
      banner.classList.add('hidden');
      banner.classList.remove('inline-flex');
    }
  }
}
