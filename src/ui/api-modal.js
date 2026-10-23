import { state } from '../state.js';
import { tmdbFetch } from '../services/tmdb.js';
import { loadRegionalNowPlayingMovies } from '../controllers/media.js';
import { showToast } from './toast.js';

function updateApiStatusPill() {
  const dot = document.getElementById('api-status-dot');
  if (!dot) return;
  if (state.tmdbApiKey && state.tmdbApiKey.trim().length > 0) {
    dot.className = 'w-2.5 h-2.5 rounded-full bg-lbgreen ring-2 ring-obsidian absolute -top-1 -right-1 pointer-events-none';
  } else {
    dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-obsidian absolute -top-1 -right-1 pointer-events-none animate-pulse';
  }
}

export function openApiModal() {
  const apiModal = document.getElementById('api-modal');
  const keyInput = document.getElementById('tmdb-key-input');
  if (!apiModal || !keyInput) return;
  keyInput.value = state.tmdbApiKey;
  apiModal.classList.remove('hidden');
  apiModal.classList.add('flex');
  setTimeout(() => keyInput.focus(), 50);
}

export function closeApiModal() {
  const apiModal = document.getElementById('api-modal');
  if (!apiModal) return;
  apiModal.classList.add('hidden');
  apiModal.classList.remove('flex');
}

export function initApiModal() {
  const keyInput = document.getElementById('tmdb-key-input');
  const feedback = document.getElementById('api-modal-feedback');
  const openButton = document.getElementById('open-api-modal-btn');
  const closeButton = document.getElementById('close-api-modal-btn');
  const cancelButton = document.getElementById('cancel-api-modal-btn');
  const saveButton = document.getElementById('save-api-key-btn');
  const clearButton = document.getElementById('clear-api-key-btn');

  updateApiStatusPill();
  openButton?.addEventListener('click', openApiModal);
  closeButton?.addEventListener('click', closeApiModal);
  cancelButton?.addEventListener('click', closeApiModal);

  // Close modal when clicking on the dimmed backdrop outside the inner modal
  const apiModal = document.getElementById('api-modal');
  apiModal?.addEventListener('click', (e) => {
    if (e.target === apiModal) {
      closeApiModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && apiModal && !apiModal.classList.contains('hidden')) {
      closeApiModal();
    }
  });

  keyInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveButton?.click();
    }
  });

  saveButton?.addEventListener('click', async () => {
    const candidate = keyInput.value.trim();
    if (!candidate) {
      feedback.textContent = 'Please paste a valid TMDB v3 key or v4 Read Token.';
      feedback.className = 'text-xs font-mono text-amber-400';
      return;
    }
    const prev = state.tmdbApiKey;
    state.tmdbApiKey = candidate;
    feedback.textContent = 'Verifying key with TMDB...';
    feedback.className = 'text-xs font-mono text-lbblue';
    try {
      await tmdbFetch('/configuration');
      localStorage.setItem('posterboxd_tmdb_key', candidate);
      updateApiStatusPill();
      loadRegionalNowPlayingMovies();
      showToast('TMDB API Key connected!');
      closeApiModal();
    } catch (err) {
      state.tmdbApiKey = prev;
      feedback.textContent = 'Invalid TMDB Key. Please check your v3 key or token.';
      feedback.className = 'text-xs font-mono text-red-400';
    }
  });

  clearButton?.addEventListener('click', () => {
    state.tmdbApiKey = '';
    keyInput.value = '';
    localStorage.removeItem('posterboxd_tmdb_key');
    updateApiStatusPill();
    closeApiModal();
    showToast('TMDB key cleared');
  });
}
