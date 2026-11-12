import { state } from '../../state.js';
import { formatSafeDate } from '../../utils.js';
import {
  drawImageCover,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  getReadableTextColor,
  getWrappedLines
} from '../primitives.js';

// Layout frame shared by the studio-series posters: keeps content inside the
// Instagram Story safe band at 9:16 and reserves the footer brand row.
export function getStudioFrame(w, h) {
  const isStory = h === 1920;
  const isSquare = h <= 1080;
  const isCompact = h < 1500;
  const footerY = isStory ? 1755 : h - 26;
  return {
    isStory,
    isSquare,
    isCompact,
    top: isStory ? 155 : 0,
    footerY,
    contentBottom: footerY - 64,
    fs: Math.min(1.2, state.fontScale || 1) * (isSquare ? 0.82 : (isCompact ? 0.9 : 1))
  };
}

export function getHandle() {
  const raw = (state.username || '').trim().replace(/^@/, '');
  return raw ? `@${raw.toUpperCase()}` : '@POSTERBOXD';
}

export function getLoggedDate() {
  return (formatSafeDate(state.watchedDate) || state.year || '').toString().toUpperCase();
}

export function getScoreText() {
  if (!(state.rating > 0)) return '';
  return Number.isInteger(state.rating) ? `${state.rating}.0` : state.rating.toFixed(1);
}

// "2h 46m" -> minutes. Returns 0 when the runtime is unknown.
export function parseRuntimeMinutes(runtime) {
  const text = String(runtime || '');
  const hours = /(\d+)\s*h/i.exec(text);
  const minutes = /(\d+)\s*m/i.exec(text);
  if (!hours && !minutes) return 0;
  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}

export function formatTimecode(totalMinutes) {
  const seconds = Math.max(0, Math.round(totalMinutes * 60));
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  return `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

// Shrinks the font until the whole text fits in maxLines (or minPx is reached).
export function fitTextBlock(ctx, text, maxWidth, maxLines, basePx, minPx, fontFor) {
  let px = basePx;
  let lines = [];
  for (;;) {
    ctx.font = fontFor(px);
    lines = getWrappedLines(ctx, text, maxWidth, maxLines);
    const overflows = lines.some((line) => line.endsWith('…') || ctx.measureText(line).width > maxWidth);
    if (!overflows || px <= minPx) break;
    px -= 2;
  }
  return { px, lines, lineHeight: Math.round(px * 1.28) };
}

export function fitSingleLine(ctx, text, maxWidth) {
  return getWrappedLines(ctx, text, maxWidth, 1)[0] || '';
}

// Removes colour from whatever is already painted inside the rectangle. Uses a
// blend mode instead of ctx.filter so it also works on older iOS Safari.
export function desaturateRect(ctx, x, y, width, height) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.globalCompositeOperation = 'saturation';
  ctx.fillStyle = '#000000';
  ctx.fillRect(x, y, width, height);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

// Deterministic barcode: the same title always produces the same bars.
export function drawSeededBarcode(ctx, x, y, width, height, color) {
  const seedText = `${state.tmdbId || ''}${state.title || 'posterboxd'}${state.year || ''}`;
  let seed = 7;
  for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.save();
  ctx.fillStyle = color;
  let cursor = x;
  while (cursor < x + width) {
    const bar = 2 + Math.floor(next() * 3) * 2;
    const gap = 3 + Math.floor(next() * 3) * 2;
    if (cursor + bar > x + width) break;
    ctx.fillRect(Math.round(cursor), y, bar, height);
    cursor += bar + gap;
  }
  ctx.restore();
}

export function drawDashedRule(ctx, x1, x2, y, color, lineWidth = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Building blocks shared by the second studio batch (glass + editorial styles).
// ---------------------------------------------------------------------------

export function getCastNames(max = 3) {
  return String(state.cast || '').split(',').map((name) => name.trim()).filter(Boolean).slice(0, max);
}

export function getCrewList(max = 3) {
  const first = (value) => String(value || '').split(',')[0].trim();
  const merged = [];
  [
    { role: state.mediaType === 'tv' ? 'CREATOR' : 'DIRECTOR', name: first(state.director) },
    { role: 'WRITER', name: first(state.writer) },
    { role: 'CINEMATOGRAPHY', name: first(state.dop) },
    { role: 'MUSIC', name: first(state.music) }
  ].filter((person) => person.name).forEach((person) => {
    // One person holding several jobs (writer-director) gets a single row.
    const existing = merged.find((entry) => entry.name.toLowerCase() === person.name.toLowerCase());
    if (existing) existing.role = `${existing.role} · ${person.role}`;
    else merged.push({ ...person });
  });
  return merged.slice(0, max);
}

// Full-canvas artwork with a brightness dim and optional blur.
export function drawArtBackdrop(ctx, w, h, image, { blur = 0, dim = 0 } = {}) {
  ctx.save();
  ctx.fillStyle = '#08080C';
  ctx.fillRect(0, 0, w, h);
  if (image) {
    const bleed = blur * 2.5;
    if (blur) ctx.filter = `blur(${blur}px)`;
    drawImageCover(ctx, image, -bleed, -bleed, w + bleed * 2, h + bleed * 2);
    ctx.filter = 'none';
  }
  const brightnessDim = 0.6 * (1 - Math.min(100, state.backdropBrightness) / 100);
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.9, dim + brightnessDim).toFixed(3)})`;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Frosted-glass panel: blurred copy of the artwork behind a translucent tint.
export function drawFrostedPanel(ctx, x, y, width, height, radius, image, canvasW, canvasH, { shadow = true } = {}) {
  if (shadow) {
    ctx.save();
    drawRoundedRectPath(ctx, x, y, width, height, radius);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 56;
    ctx.shadowOffsetY = 22;
    ctx.fillStyle = 'rgba(14, 14, 22, 0.5)';
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  drawRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.clip();
  if (image) {
    ctx.filter = 'blur(28px) saturate(170%)';
    drawImageCover(ctx, image, -40, -40, canvasW + 80, canvasH + 80, 0, 0);
    ctx.filter = 'none';
  }
  const tint = ctx.createLinearGradient(x, y, x + width, y + height);
  tint.addColorStop(0, 'rgba(34, 34, 46, 0.60)');
  tint.addColorStop(1, 'rgba(14, 14, 22, 0.78)');
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
  ctx.save();
  drawRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

// Recessed inner panel used inside frosted panels.
export function drawWell(ctx, x, y, width, height, radius) {
  ctx.save();
  drawRoundedRectPath(ctx, x, y, width, height, radius);
  const fill = ctx.createLinearGradient(x, y, x, y + height);
  fill.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
  fill.addColorStop(1, 'rgba(10, 10, 16, 0.50)');
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.19)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function drawScorePill(ctx, x, y, fs, accent, align = 'right', scale = 1) {
  const score = getScoreText();
  const height = Math.round(48 * fs * scale);
  if (!score) return { w: 0, h: height };
  ctx.save();
  ctx.font = `800 ${Math.round(25 * fs * scale)}px "JetBrains Mono", monospace`;
  const label = `${score} ★`;
  const width = Math.round(ctx.measureText(label).width + 34 * scale);
  const left = align === 'right' ? x - width : x;
  drawRoundedRectPath(ctx, left, y, width, height, Math.round(11 * scale));
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.fillStyle = getReadableTextColor(accent);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, left + width / 2, y + height / 2 + 1);
  ctx.restore();
  return { w: width, h: height };
}

export function drawMonogram(ctx, cx, cy, radius, name) {
  const initials = String(name || '?').split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(40, 40, 54, 0.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = `700 ${Math.round(radius * 0.82)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, cx, cy + 1);
  ctx.restore();
}

export function drawStars(ctx, x, y, starR, color, align = 'left', onLight = false) {
  drawRatingAndHeartRow(ctx, {
    x, y, rating: state.rating, isLiked: state.isLiked, starSize: starR, gap: Math.round(starR * 0.42), align,
    starColor: color, emptyColor: onLight ? 'rgba(17, 17, 21, 0.16)' : 'rgba(255, 255, 255, 0.2)'
  });
}

// Picks the largest font (basePx down to minPx) at which the whole quote fits the box.
export function layoutQuote(ctx, text, width, height, { basePx, minPx, font, maxLines = 10 }) {
  const empty = { px: 0, lines: [], lineHeight: 0, height: 0 };
  if (!text || height < minPx * 1.28) return empty;
  for (let px = basePx; px >= minPx; px -= 2) {
    ctx.font = font(px);
    const lines = getWrappedLines(ctx, text, width, 60);
    const lineHeight = Math.round(px * 1.28);
    if (lines.length <= maxLines && lines.length * lineHeight <= height) {
      return { px, lines, lineHeight, height: lines.length * lineHeight };
    }
  }
  ctx.font = font(minPx);
  const lineHeight = Math.round(minPx * 1.28);
  const cap = Math.max(1, Math.min(maxLines, Math.floor(height / lineHeight)));
  const lines = getWrappedLines(ctx, text, width, cap);
  return { px: minPx, lines, lineHeight, height: lines.length * lineHeight };
}

export function drawQuoteLines(ctx, quote, x, y, { font, color = '#FFFFFF', align = 'left' }) {
  ctx.save();
  ctx.font = font(quote.px);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  let ty = y;
  quote.lines.forEach((line) => {
    ty += quote.lineHeight;
    ctx.fillText(line, x, ty - Math.round(quote.px * 0.2));
  });
  ctx.restore();
  return ty;
}

export function getQuoteText() {
  return state.review ? `“${state.review}”` : '';
}
