import { state, resetMediaState } from '../state.js';
import { getReviewCharacterLimit } from '../constants.js';
import { tmdbFetch } from '../services/tmdb.js';
import {
  cleanLetterboxdRawTitle,
  cleanLetterboxdParagraphs
} from '../services/letterboxd.js';
import { loadCorsImage, extractDominantPalette } from '../services/media-assets.js';
import { loadTmdbMediaDetails } from './media.js';
import { recordCurrentFetchToHistory } from '../services/storage.js';
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
    let director = reviewData.director || '';
    let writer = reviewData.writer || '';
    let cast = reviewData.cast || '';
    let genre = reviewData.genre || '';
    let runtime = reviewData.runtime || null;
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
      director = reviewData.movie?.director || director;
      writer = reviewData.movie?.writer || writer;
      cast = reviewData.movie?.cast || cast;
      genre = reviewData.movie?.genre || genre;
      runtime = reviewData.movie?.runtime || runtime;
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
    state.director = director;
    state.writer = writer || director;
    state.cast = cast;
    state.genre = Array.isArray(genre) ? genre.join(' | ') : genre;
    if (runtime) {
      const minutes = Number(runtime);
      if (Number.isFinite(minutes) && minutes > 0) {
        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;
        state.runtime = ((hours ? hours + 'h ' : '') + (remainder ? remainder + 'm' : '')).trim();
      } else { state.runtime = String(runtime); }
    }
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

    // Keep one sentence on the poster and move every remaining sentence into details.
    const fullReview = reviewLines.map(line => String(line || '').trim()).filter(Boolean).join(' ').trim();
    if (fullReview) {
      const sentences = typeof Intl.Segmenter === 'function'
        ? Array.from(new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(fullReview), part => part.segment.trim()).filter(Boolean)
        : (fullReview.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [fullReview]).map(sentence => sentence.trim()).filter(Boolean);
      const firstSentence = sentences.shift() || fullReview;
      const reviewLimit = getReviewCharacterLimit(state.archetype);
      state.review = firstSentence.slice(0, reviewLimit);
      const overflow = firstSentence.slice(reviewLimit).trim();
      state.detailedReview = [overflow, ...sentences].filter(Boolean).join(' ').trim();
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

    // Automatically match on the hosted TMDB proxy to pull high-res posters, backdrops, logos, director & cast.
    if (movieTitle) {
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
      } catch (tmdbErr) {
        if (statusText) statusText.textContent = `TMDB enrichment failed for "${movieTitle}". Keeping Letterboxd data.`;
        showToast(`TMDB enrichment failed. Kept the Letterboxd review and available metadata.`, true);
      }
    }

    if (movieTitle) state.title = movieTitle;
    state.director = director;
    state.writer = writer || director;
    state.cast = cast;
    state.genre = Array.isArray(genre) ? genre.join(' | ') : genre;
    if (runtime) {
      const minutes = Number(runtime);
      if (Number.isFinite(minutes) && minutes > 0) {
        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;
        state.runtime = ((hours ? hours + 'h ' : '') + (remainder ? remainder + 'm' : '')).trim();
      } else { state.runtime = String(runtime); }
    }
    if (releaseYear) state.year = releaseYear;
    // resetMediaState cleared prior media; preserve metadata read from Letterboxd.
    state.director = state.director || director;
    state.writer = state.writer || writer || state.director;
    state.cast = state.cast || cast;
    state.genre = state.genre || (Array.isArray(genre) ? genre.join(' | ') : genre);
    if (!state.runtime && runtime) state.runtime = String(runtime);

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
