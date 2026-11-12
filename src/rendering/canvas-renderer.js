import { state } from '../state.js';
import { drawRoundedRectPath, getVividPaletteColor } from './primitives.js';
import { POSTER_RENDERERS } from './posters.js';
import { renderRuntime } from './runtime.js';

let renderPending = false;
const afterRenderListeners = [];
let thumbnailSource = null;

export function addAfterRenderListener(listener) {
  if (typeof listener === 'function') afterRenderListeners.push(listener);
}

// Draws one style at full size off-screen and scales it into `targetCanvas`.
// Used for the style thumbnails; it never touches the visible poster or its hit boxes.
export function renderArchetypeInto(targetCanvas, archetype, pixelHeight = 176) {
  const renderPoster = POSTER_RENDERERS[archetype];
  if (!targetCanvas || !renderPoster) return;
  const ratioKey = CANVAS_SIZES[state.aspectRatio] ? state.aspectRatio : '9:16';
  const { w, h } = CANVAS_SIZES[ratioKey];
  if (!thumbnailSource) thumbnailSource = document.createElement('canvas');
  if (thumbnailSource.width !== w || thumbnailSource.height !== h) {
    thumbnailSource.width = w;
    thumbnailSource.height = h;
  }
  const ctx = thumbnailSource.getContext('2d');
  const saved = { archetype: state.archetype, hitBoxes: state.hitBoxes };
  ctx.clearRect(0, 0, w, h);
  state.archetype = archetype;
  state.hitBoxes = [];
  try {
    renderPoster(ctx, w, h);
  } catch (error) {
    console.error(`Thumbnail render error for "${archetype}":`, error);
  } finally {
    state.archetype = saved.archetype;
    state.hitBoxes = saved.hitBoxes;
  }
  const targetH = pixelHeight;
  const targetW = Math.round(pixelHeight * (w / h));
  if (targetCanvas.width !== targetW || targetCanvas.height !== targetH) {
    targetCanvas.width = targetW;
    targetCanvas.height = targetH;
  }
  const targetCtx = targetCanvas.getContext('2d');
  targetCtx.imageSmoothingQuality = 'high';
  targetCtx.clearRect(0, 0, targetW, targetH);
  targetCtx.drawImage(thumbnailSource, 0, 0, targetW, targetH);
}

export const CANVAS_SIZES = Object.freeze({
  '9:16': { w: 1080, h: 1920, label: 'Story' },
  '4:5': { w: 1080, h: 1350, label: 'Instagram post' },
  '1:1': { w: 1080, h: 1080, label: 'Square' },
  '2:3': { w: 1200, h: 1800, label: 'Print poster' }
});

function syncStageChrome(ratioKey, targetW, targetH) {
  const glow = document.getElementById('stage-ambient-glow');
  const glowColor = getVividPaletteColor('');
  if (glow && glowColor && glow.dataset.color !== glowColor) {
    glow.dataset.color = glowColor;
    glow.style.backgroundColor = glowColor;
  }
  const readout = document.getElementById('stage-dimensions-readout');
  const text = `${CANVAS_SIZES[ratioKey].label} ${ratioKey} · ${targetW}×${targetH} PNG`;
  if (readout && readout.textContent !== text) readout.textContent = text;
}

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

  const ratioKey = CANVAS_SIZES[state.aspectRatio] ? state.aspectRatio : '9:16';
  const { w: targetW, h: targetH } = CANVAS_SIZES[ratioKey];

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  syncStageChrome(ratioKey, targetW, targetH);

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

  afterRenderListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('After-render listener failed:', error);
    }
  });
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
