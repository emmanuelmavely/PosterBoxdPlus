import { state } from '../state.js';
import { drawRoundedRectPath } from './primitives.js';
import { POSTER_RENDERERS } from './posters.js';
import { renderRuntime } from './runtime.js';

let renderPending = false;

export function scheduleCanvasRender() {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(() => {
    renderPending = false;
    renderPosterToCanvas();
  });
}

export function renderPosterToCanvas() {
  const canvas = document.getElementById('poster-canvas');
  if (!canvas) return;

  let targetW = 1080, targetH = 1920;
  if (state.aspectRatio === '4:5') { targetW = 1080; targetH = 1350; }
  else if (state.aspectRatio === '2:3') { targetW = 1200; targetH = 1800; }

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, targetW, targetH);
  state.hitBoxes = [];

  const renderPoster = POSTER_RENDERERS[state.archetype];
  if (renderPoster) {
    try {
      renderPoster(ctx, targetW, targetH);
    } catch (err) {
      console.error(`Poster render error for archetype "${state.archetype}":`, err);
    }
  }

  if (state.filmGrain && renderRuntime.grainPatternCanvas) {
    ctx.save();
    const pattern = ctx.createPattern(renderRuntime.grainPatternCanvas, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, targetW, targetH);
    }
    ctx.restore();
  }

  if (state.isInteractiveEdit || state.showSafeZoneGuide) {
    drawStorySafeZoneGuides(ctx, targetW, targetH);
  }

  if (state.isInteractiveEdit) {
    state.hitBoxes.forEach(box => {
      const isSelected = box.id === state.selectedElementId;
      ctx.save();
      drawRoundedRectPath(ctx, box.x - 8, box.y - 8, box.w + 16, box.h + 16, 12);
      ctx.strokeStyle = isSelected ? '#00E054' : 'rgba(0, 224, 84, 0.45)';
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.setLineDash(isSelected ? [] : [8, 6]);
      ctx.stroke();
      ctx.restore();
    });
  }
}

function drawStorySafeZoneGuides(ctx, targetW, targetH) {
  if (targetW !== 1080 || targetH !== 1920) return;
  const dangerTop = 155;
  const dangerBottom = 155;
  const safeBottom = targetH - dangerBottom; // 1765

  ctx.save();
  // Top danger zone overlay (profile picture, handle, close button)
  ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
  ctx.fillRect(0, 0, targetW, dangerTop);

  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(0, dangerTop);
  ctx.lineTo(targetW, dangerTop);
  ctx.stroke();

  ctx.font = '700 16px "JetBrains Mono", monospace';
  ctx.fillStyle = '#FCA5A5';
  ctx.textAlign = 'center';
  ctx.fillText('▲ INSTAGRAM STORY DANGER ZONE · TOP 155px (PROFILE & CONTROLS) ▲', targetW / 2, dangerTop - 70);
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.fillStyle = '#FECACA';
  ctx.fillText('Poster content stays below this line', targetW / 2, dangerTop - 38);

  // Bottom danger zone overlay (reply input bar, reaction buttons)
  ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
  ctx.fillRect(0, safeBottom, targetW, dangerBottom);

  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(0, safeBottom);
  ctx.lineTo(targetW, safeBottom);
  ctx.stroke();

  ctx.font = '700 16px "JetBrains Mono", monospace';
  ctx.fillStyle = '#FCA5A5';
  ctx.textAlign = 'center';
  ctx.fillText('▼ INSTAGRAM STORY DANGER ZONE · BOTTOM 155px (REPLY INPUT BAR) ▼', targetW / 2, safeBottom + 65);
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.fillStyle = '#FECACA';
  ctx.fillText('Poster content stays above this line', targetW / 2, safeBottom + 95);

  // Safe zone indicator tag
  ctx.fillStyle = '#00E054';
  ctx.font = '700 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('● 1080 × 1610 SAFE ZONE', 24, dangerTop + 26);

  ctx.restore();
}
