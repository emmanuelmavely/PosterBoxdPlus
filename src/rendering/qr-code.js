import { state } from '../state.js';
import { getLetterboxdReviewUrl } from '../services/letterboxd.js';
import { drawRoundedRectPath } from './primitives.js';

export function syncQrUrlPreview() {
  const preview = document.getElementById('qr-url-preview');
  if (preview) preview.textContent = getLetterboxdReviewUrl().replace(/^https?:\/\//i, '');
}

export function drawPosterQrCode(context, x, y, size = 112, isLightMode = false) {
  if (!state.showQrCode || typeof qrcode === 'undefined') return;
  const url = getLetterboxdReviewUrl();
  try {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const count = qr.getModuleCount();
    const padding = Math.round(size * 0.12);
    const innerSize = size - padding * 2;
    const cellSize = innerSize / count;

    context.save();
    drawRoundedRectPath(context, x, y, size, size, 14);
    context.fillStyle = isLightMode ? 'rgba(24, 24, 27, 0.04)' : 'rgba(255, 255, 255, 0.04)';
    context.fill();
    context.lineWidth = 1.25;
    context.strokeStyle = isLightMode ? 'rgba(87, 83, 78, 0.28)' : 'rgba(161, 161, 170, 0.26)';
    context.stroke();
    context.fillStyle = isLightMode ? 'rgba(68, 64, 60, 0.82)' : 'rgba(212, 212, 216, 0.78)';
    for (let row = 0; row < count; row++) {
      for (let column = 0; column < count; column++) {
        if (qr.isDark(row, column)) {
          const cellX = x + padding + column * cellSize;
          const cellY = y + padding + row * cellSize;
          context.beginPath();
          context.arc(cellX + cellSize / 2, cellY + cellSize / 2, cellSize * 0.46, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
    context.restore();
  } catch (error) {
    // A malformed URL should not interrupt poster rendering.
  }
}
