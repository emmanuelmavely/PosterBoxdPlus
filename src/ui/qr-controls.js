import { state } from '../state.js';
import { getLetterboxdReviewUrl } from '../services/letterboxd.js';

export function syncQrUrlPreview() {
  const preview = document.getElementById('qr-url-preview');
  const url = getLetterboxdReviewUrl();
  if (preview) preview.textContent = url.replace(/^https?:\/\//i, '');
  return url;
}

export function syncQrToggleVisibility() {
  const row = document.getElementById('qrcode-toggle-row');
  const checkbox = document.getElementById('chk-qrcode');
  const isFromReviewUrl = Boolean(state.isFromLetterboxd && state.letterboxdUrl);

  if (row) {
    if (isFromReviewUrl) {
      row.classList.remove('hidden');
      row.classList.add('flex');
    } else {
      row.classList.add('hidden');
      row.classList.remove('flex');
    }
  }

  if (!isFromReviewUrl) {
    state.showQrCode = false;
  }
  if (checkbox) checkbox.checked = Boolean(state.showQrCode);
  syncQrUrlPreview();
}
