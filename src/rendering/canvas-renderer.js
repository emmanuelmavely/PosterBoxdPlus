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
