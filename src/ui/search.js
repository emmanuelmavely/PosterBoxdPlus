import { state } from '../state.js';
import { tmdbFetch } from '../services/tmdb.js';
import { fetchLetterboxdReview } from '../services/letterboxd.js';
import { loadDemoPreset, loadTmdbMediaDetails } from '../controllers/media.js';
import { applyLetterboxdReviewData } from '../controllers/letterboxd-import.js';

export function initSearch() {
  const homeInput = document.getElementById('home-search-input');
  const homeResults = document.getElementById('home-search-results');
  const headerInput = document.getElementById('header-search-input');
  const headerResults = document.getElementById('header-search-results');

  // Reusable search function for both Home Search and Header Search (Supports Letterboxd URLs, Raw JSON, and TMDB Search)
  const runLiveSearch = async (inputEl, resultsEl) => {
    const q = inputEl.value.trim();
    if (!q) return;

    // 1. Check if user pasted raw Letterboxd JSON output directly
    if (q.startsWith('{') && q.endsWith('}')) {
      try {
        const parsedJson = JSON.parse(q);
        if (parsedJson.movie || parsedJson.review || parsedJson.url) {
          resultsEl.classList.add('hidden');
          await applyLetterboxdReviewData(parsedJson);
          return;
        }
      } catch (e) {}
    }

    // 2. Check if user pasted a Letterboxd URL
    const lbUrlMatch = q.match(/https?:\/\/(?:www\.)?(?:letterboxd\.com|boxd\.it)\/[^\s]+/i);
    if (lbUrlMatch) {
      const reviewUrl = lbUrlMatch[0];
      const banner = document.getElementById('lb-fetch-status-banner');
      const statusText = document.getElementById('lb-fetch-status-text');
      if (banner) {
        banner.classList.remove('hidden');
        banner.classList.add('inline-flex');
      }
      if (statusText) statusText.textContent = 'Fetching Letterboxd review page...';
      resultsEl.classList.remove('hidden');
      resultsEl.innerHTML = `<div class="text-xs font-mono text-lbblue py-3 text-center"><i class="fa-solid fa-circle-notch fa-spin mr-1.5"></i>Fetching Letterboxd review...</div>`;

      const reviewData = await fetchLetterboxdReview(reviewUrl);
      if (reviewData && reviewData.movieTitle) {
        resultsEl.classList.add('hidden');
        await applyLetterboxdReviewData(reviewData);
        return;
      } else {
        // Fallback: Extract username & film slug from the URL itself so it still works even if CORS proxies are rate-limited
        try {
          const u = new URL(reviewUrl);
          const parts = u.pathname.split('/').filter(Boolean);
          const filmIdx = parts.indexOf('film');
          const slug = filmIdx !== -1 ? parts[filmIdx + 1] : '';
          const user = filmIdx > 0 ? parts[0] : '';
          if (slug) {
            const yearInSlug = slug.match(/-(\d{4})$/);
            const cleanSlugTitle = slug.replace(/-(\d{4})$/, '').replace(/-/g, ' ');
            resultsEl.classList.add('hidden');
            await applyLetterboxdReviewData({
              url: reviewUrl,
              movieTitle: cleanSlugTitle,
              releaseYear: yearInSlug ? yearInSlug[1] : '',
              reviewer: user,
              rating: state.rating,
              reviewLines: []
            });
            return;
          }
        } catch (err) {}
      }
    }

    if (!state.tmdbApiKey) {
      const apiModal = document.getElementById('api-modal');
      if (apiModal) {
        apiModal.classList.remove('hidden');
        apiModal.classList.add('flex');
      }
      return;
    }

    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = `<div class="text-xs font-mono text-gray-400 py-3 text-center"><i class="fa-solid fa-circle-notch fa-spin mr-1.5 text-lbgreen"></i>Searching TMDB...</div>`;

    try {
      const [movies, tvShows] = await Promise.all([
        tmdbFetch('/search/movie', { query: q }),
        tmdbFetch('/search/tv', { query: q })
      ]);
      const combined = [
        ...(movies.results || []).map(m => ({ ...m, media_type: 'movie' })),
        ...(tvShows.results || []).map(t => ({ ...t, media_type: 'tv' }))
      ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 6);

      if (combined.length === 0) {
        resultsEl.innerHTML = `<div class="text-xs text-gray-400 p-3">No results found for "${q}".</div>`;
        return;
      }

      resultsEl.innerHTML = combined.map(item => {
        const title = item.title || item.name;
        const year = (item.release_date || item.first_air_date || '').substring(0, 4) || '—';
        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : '';
        return `
          <button type="button" data-sel-id="${item.id}" data-sel-type="${item.media_type}"
            class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-elevated text-left transition">
            ${poster ? `<img src="${poster}" class="w-9 h-13 object-cover rounded shrink-0" />` : `<div class="w-9 h-13 bg-obsidian rounded shrink-0"></div>`}
            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold text-white truncate">${title} (${year})</div>
              <div class="text-[11px] text-gray-400 truncate">${item.media_type === 'tv' ? 'TV Series' : 'Movie'} · ${item.overview || 'Tap to select'}</div>
            </div>
          </button>
        `;
      }).join('');

      resultsEl.querySelectorAll('[data-sel-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
          resultsEl.classList.add('hidden');
          await loadTmdbMediaDetails(btn.dataset.selId, btn.dataset.selType);
        });
      });
    } catch (err) {
      resultsEl.innerHTML = `<div class="text-xs text-red-400 p-3">Search error: ${err.message}</div>`;
    }
  };

  homeInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); runLiveSearch(homeInput, homeResults); }
  });
  document.getElementById('home-search-submit-btn')?.addEventListener('click', () => runLiveSearch(homeInput, homeResults));

  headerInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); runLiveSearch(headerInput, headerResults); }
  });
  document.getElementById('header-search-btn')?.addEventListener('click', () => runLiveSearch(headerInput, headerResults));

  // Close search dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#header-search-container')) headerResults?.classList.add('hidden');
    if (!e.target.closest('#view-home')) homeResults?.classList.add('hidden');
  });

  document.querySelectorAll('.demo-chip').forEach(btn => {
    btn.addEventListener('click', () => loadDemoPreset(btn.dataset.demo));
  });
}
