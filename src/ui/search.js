import { state } from '../state.js';
import { tmdbFetch } from '../services/tmdb.js';
import { fetchLetterboxdReview } from '../services/letterboxd.js';
import { loadDemoPreset, loadTmdbMediaDetails, loadPublicMediaDetails } from '../controllers/media.js';
import { applyLetterboxdReviewData } from '../controllers/letterboxd-import.js';
import { searchPublicTmdb } from '../services/tmdb-public-search.js';
import { openApiModal } from './api-modal.js';

function promptLetterboxdProceedWithoutTmdb(onProceed) {
  if (state.tmdbApiKey && state.tmdbApiKey.trim().length > 0) {
    onProceed();
    return;
  }

  const modal = document.getElementById('tmdb-lb-warning-modal');
  if (!modal) {
    onProceed();
    return;
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  const closeBtn = document.getElementById('close-lb-warning-modal-btn');
  const proceedBtn = document.getElementById('lb-warning-proceed-btn');
  const addKeyBtn = document.getElementById('lb-warning-add-key-btn');

  const cleanup = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    closeBtn?.removeEventListener('click', onClose);
    proceedBtn?.removeEventListener('click', onAccept);
    addKeyBtn?.removeEventListener('click', onAddKey);
    modal.removeEventListener('click', onBackdrop);
    window.removeEventListener('keydown', onKey);
  };

  const onClose = () => cleanup();
  const onAccept = () => {
    cleanup();
    onProceed();
  };
  const onAddKey = () => {
    cleanup();
    openApiModal();
  };
  const onBackdrop = (e) => {
    if (e.target === modal) cleanup();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') cleanup();
  };

  closeBtn?.addEventListener('click', onClose);
  proceedBtn?.addEventListener('click', onAccept);
  addKeyBtn?.addEventListener('click', onAddKey);
  modal.addEventListener('click', onBackdrop);
  window.addEventListener('keydown', onKey);
}

export function initSearch() {
  const homeInput = document.getElementById('home-search-input');
  const homeResults = document.getElementById('home-search-results');
  const headerInput = document.getElementById('header-search-input');
  const headerResults = document.getElementById('header-search-results');

  // Reusable search function for both Home Search and Header Search (Supports Letterboxd URLs, Raw JSON, and TMDB Search)
  const runLiveSearch = async (inputEl, resultsEl) => {
    const q = inputEl.value.trim();
    if (!q) {
      inputEl.focus();
      return;
    }

    // 1. Check if user pasted raw Letterboxd JSON output directly
    if (q.startsWith('{') && q.endsWith('}')) {
      try {
        const parsedJson = JSON.parse(q);
        if (parsedJson.movie || parsedJson.review || parsedJson.url || parsedJson.movieTitle) {
          const mTitle = parsedJson.movie?.title || parsedJson.movieTitle || 'Review Film';
          const mYear = parsedJson.movie?.year || parsedJson.releaseYear || '';
          const mUser = parsedJson.reviewer?.name || parsedJson.reviewer || 'user';
          const mRating = parsedJson.review?.ratingStars || parsedJson.rating || '';
          const mText = (parsedJson.review?.paragraphs?.[0] || parsedJson.review || 'Letterboxd review import').substring(0, 110);
          const mPoster = parsedJson.movie?.posterUrl || parsedJson.posterImg || '';

          resultsEl.classList.remove('hidden');
          resultsEl.innerHTML = `
            <div class="p-1 space-y-1">
              <div class="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-lbgreen flex items-center justify-between">
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-square-check"></i> Letterboxd JSON Found</span>
                <span class="text-[9px] text-gray-400 font-mono">1 Match</span>
              </div>
              <button type="button" id="select-lb-json-hit"
                class="w-full flex items-center gap-3 p-2.5 rounded-xl bg-cardbg hover:bg-elevated border border-lbgreen/30 text-left transition group">
                ${mPoster ? `<img src="${mPoster}" class="w-10 h-14 object-cover rounded shrink-0 shadow" />` : `<div class="w-10 h-14 bg-obsidian border border-white/10 rounded flex items-center justify-center shrink-0 text-lbgreen"><i class="fa-solid fa-code text-base"></i></div>`}
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-bold text-white flex items-center gap-2 truncate">
                    <span class="truncate">${mTitle} ${mYear ? `(${mYear})` : ''}</span>
                    ${mRating ? `<span class="text-amber-400 font-mono text-[11px] shrink-0 font-normal">★ ${mRating}</span>` : ''}
                  </div>
                  <div class="text-[11px] text-gray-300 truncate mt-0.5">
                    <span class="text-lbblue font-semibold">@${mUser}</span>: "${mText}"
                  </div>
                  <div class="text-[10px] text-lbgreen font-mono mt-1 flex items-center gap-1 group-hover:underline">
                    <i class="fa-solid fa-arrow-pointer text-[9px]"></i> Click to select & build poster
                  </div>
                </div>
              </button>
            </div>
          `;
          document.getElementById('select-lb-json-hit')?.addEventListener('click', () => {
            resultsEl.classList.add('hidden');
            promptLetterboxdProceedWithoutTmdb(async () => {
              await applyLetterboxdReviewData(parsedJson);
            });
          });
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

      let reviewData = await fetchLetterboxdReview(reviewUrl);
      if (!reviewData || !reviewData.movieTitle) {
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
            reviewData = {
              url: reviewUrl,
              movieTitle: cleanSlugTitle,
              releaseYear: yearInSlug ? yearInSlug[1] : '',
              reviewer: user,
              rating: Number.isFinite(state.rating) ? state.rating : 0,
              reviewLines: []
            };
          }
        } catch (err) {}
      }

      if (banner) {
        banner.classList.add('hidden');
        banner.classList.remove('inline-flex');
      }

      if (reviewData && reviewData.movieTitle) {
        const starStr = reviewData.rating ? '★ ' + Number(reviewData.rating).toFixed(1) : '';
        const excerpt = (reviewData.reviewLines && reviewData.reviewLines.length > 0)
          ? reviewData.reviewLines[0].substring(0, 110)
          : (reviewData.review ? reviewData.review.substring(0, 110) : 'Tap to import review & generate poster');
        const posterSrc = reviewData.posterImg && !reviewData.posterImg.includes('empty-poster') ? reviewData.posterImg : '';

        resultsEl.innerHTML = `
          <div class="p-1 space-y-1">
            <div class="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-lbgreen flex items-center justify-between">
              <span class="flex items-center gap-1.5"><i class="fa-solid fa-square-check"></i> Letterboxd Review Found</span>
              <span class="text-[9px] text-gray-400 font-mono">1 Match</span>
            </div>
            <button type="button" id="select-lb-review-hit"
              class="w-full flex items-center gap-3 p-2.5 rounded-xl bg-cardbg hover:bg-elevated border border-lbgreen/30 text-left transition group">
              ${posterSrc ? `<img src="${posterSrc}" class="w-10 h-14 object-cover rounded shrink-0 shadow" />` : `<div class="w-10 h-14 bg-obsidian border border-white/10 rounded flex items-center justify-center shrink-0 text-lbgreen"><i class="fa-solid fa-film text-base"></i></div>`}
              <div class="flex-1 min-w-0">
                <div class="text-xs font-bold text-white flex items-center gap-2 truncate">
                  <span class="truncate">${reviewData.movieTitle} ${reviewData.releaseYear ? `(${reviewData.releaseYear})` : ''}</span>
                  ${starStr ? `<span class="text-amber-400 font-mono text-[11px] shrink-0 font-normal">${starStr}</span>` : ''}
                </div>
                <div class="text-[11px] text-gray-300 truncate mt-0.5">
                  <span class="text-lbblue font-semibold">@${reviewData.reviewer || 'user'}</span>: "${excerpt}"
                </div>
                <div class="text-[10px] text-lbgreen font-mono mt-1 flex items-center gap-1 group-hover:underline">
                  <i class="fa-solid fa-arrow-pointer text-[9px]"></i> Click to select & build poster
                </div>
              </div>
            </button>
          </div>
        `;

        document.getElementById('select-lb-review-hit')?.addEventListener('click', () => {
          resultsEl.classList.add('hidden');
          promptLetterboxdProceedWithoutTmdb(async () => {
            await applyLetterboxdReviewData(reviewData);
          });
        });
        return;
      } else {
        resultsEl.innerHTML = `<div class="text-xs text-red-400 p-3">Could not load Letterboxd review from that URL. Please try again.</div>`;
        return;
      }
    }

    // 3. TMDB Search (Official API if key is set, otherwise Experimental No-API scraper)
    if (!state.tmdbApiKey) {
      resultsEl.classList.remove('hidden');
      resultsEl.innerHTML = `
        <div class="text-xs font-mono text-purple-300 py-3 text-center flex items-center justify-center gap-2">
          <i class="fa-solid fa-flask fa-spin text-purple-400"></i>
          <span>Searching TMDB (No-API mode)...</span>
        </div>
      `;

      try {
        const response = await searchPublicTmdb(q);
        const results = (response.results || []).slice(0, 8);

        if (results.length === 0) {
          resultsEl.innerHTML = `
            <div class="p-3 text-center space-y-1 text-gray-400 text-xs font-mono">
              <div>No titles found for "${q}".</div>
              <div class="text-[10px] text-gray-500">Try a different spelling or check proxy connection.</div>
            </div>
          `;
          return;
        }

        resultsEl.innerHTML = `
          <div class="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-purple-300/90 flex items-center justify-between border-b border-white/10 mb-1">
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-flask text-purple-400 text-[10px]"></i> No-API Search Matches</span>
            <span class="text-[9px] text-gray-400 font-mono">${results.length} found</span>
          </div>
          ${results.map((item, index) => {
            const title = item.title || item.name || 'Untitled';
            const year = item.release_year || (item.release_date || item.first_air_date || '').substring(0, 4) || '—';
            const poster = item.poster_url || (item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : '');
            return `
              <button type="button" data-public-index="${index}"
                class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-elevated text-left transition group">
                ${poster ? `<img src="${poster}" class="w-9 h-13 object-cover rounded shrink-0 shadow" />` : `<div class="w-9 h-13 bg-obsidian border border-white/10 rounded flex items-center justify-center shrink-0 text-gray-500 text-[10px]">No Art</div>`}
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    <span class="truncate">${title}</span>
                    <span class="text-gray-400 font-mono text-[11px] font-normal">(${year})</span>
                    <span class="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/15 text-purple-300 font-semibold uppercase shrink-0">${item.media_type === 'tv' ? 'TV' : 'Movie'}</span>
                  </div>
                  <div class="text-[11px] text-gray-400 truncate mt-0.5">${item.overview || 'Tap to load into Poster Studio'}</div>
                </div>
              </button>
            `;
          }).join('')}
        `;

        resultsEl.querySelectorAll('[data-public-index]').forEach(btn => {
          btn.addEventListener('click', async () => {
            resultsEl.classList.add('hidden');
            const item = results[Number(btn.dataset.publicIndex)];
            if (item) {
              await loadPublicMediaDetails(item);
            }
          });
        });
      } catch (err) {
        resultsEl.innerHTML = `
          <div class="p-3 text-center space-y-2">
            <div class="text-xs text-red-400">Search error: ${err.message}</div>
            <button type="button" id="public-search-open-api-btn" class="px-3 py-1.5 rounded-lg bg-lbgreen text-obsidian font-bold text-xs">
              Add TMDb API Key
            </button>
          </div>
        `;
        document.getElementById('public-search-open-api-btn')?.addEventListener('click', openApiModal);
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
  document.getElementById('home-search-submit-btn')?.addEventListener('click', () => {
    runLiveSearch(homeInput, homeResults);
  });

  headerInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); runLiveSearch(headerInput, headerResults); }
  });
  document.getElementById('header-search-btn')?.addEventListener('click', () => {
    runLiveSearch(headerInput, headerResults);
  });

  // Close search dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#header-search-container')) headerResults?.classList.add('hidden');
    if (!e.target.closest('#view-home')) homeResults?.classList.add('hidden');
  });

  document.querySelectorAll('.demo-chip').forEach(btn => {
    btn.addEventListener('click', () => loadDemoPreset(btn.dataset.demo, true));
  });
}
