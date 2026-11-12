import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawRoundedRectPath,
  ensureVisibleAccentOnDark,
  getVividPaletteColor
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';
import {
  drawArtBackdrop,
  drawFrostedPanel,
  drawMonogram,
  drawQuoteLines,
  drawScorePill,
  drawStars,
  drawWell,
  fitSingleLine,
  getCastNames,
  getCrewList,
  getHandle,
  getLoggedDate,
  getQuoteText,
  getScoreText,
  getStudioFrame,
  layoutQuote
} from './studio-shared.js';

const MONO = '"JetBrains Mono", monospace';
const SANS = '"Plus Jakarta Sans", sans-serif';
const QUOTE = (px) => `600 ${px}px ${SANS}`;
const SOFT = 'rgba(255, 255, 255, 0.72)';

function getAccent() {
  return ensureVisibleAccentOnDark(getVividPaletteColor('#E2A84B'), '#E2A84B');
}

function drawTitle(ctx, layout, x, y, family = '"Syne", sans-serif') {
  ctx.font = `800 ${layout.fontPx}px ${family}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  let ty = y;
  layout.lines.forEach((line) => {
    ty += layout.lineHeight;
    ctx.fillText(line, x, ty - Math.round(layout.fontPx * 0.13));
  });
  return ty;
}

function drawThumb(ctx, image, x, y, width, height, radius) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  drawRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.clip();
  if (image) drawImageCover(ctx, image, x, y, width, height);
  ctx.restore();
  ctx.save();
  drawRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// Handle on the left, stars on the right, on one baseline.
function drawHandleStarsRow(ctx, x, y, width, fs, accent) {
  const starR = Math.round(16 * fs);
  ctx.font = `600 ${Math.round(20 * fs)}px ${MONO}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(fitSingleLine(ctx, getHandle(), width * 0.5), x, y + starR + 1);
  ctx.textBaseline = 'alphabetic';
  drawStars(ctx, x + width, y, starR, accent, 'right');
  return starR * 2;
}

// ---------------------------------------------------------------------------
// Spatial Window — a floating glass app window: hero banner, people, review.
// ---------------------------------------------------------------------------
export function renderSpatialWindowPoster(ctx, w, h) {
  const frame = getStudioFrame(w, h);
  const { fs, top, isSquare, isStory, contentBottom } = frame;
  const accent = getAccent();
  const bgImg = state.posterImg || state.backdropImg;
  const heroImg = state.backdropImg || state.posterImg;

  drawArtBackdrop(ctx, w, h, bgImg, { blur: Math.min(state.backdropBlur, 6), dim: 0.1 });
  const halo = ctx.createRadialGradient(w / 2, h * 0.24, 0, w / 2, h * 0.24, h * 0.75);
  halo.addColorStop(0, `${accent}55`);
  halo.addColorStop(0.55, 'rgba(10, 10, 16, 0.64)');
  halo.addColorStop(1, 'rgba(6, 6, 10, 0.88)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  const winX = 44;
  const winY = top + 40;
  const winW = w - winX * 2;
  const winH = contentBottom - winY;
  drawFrostedPanel(ctx, winX, winY, winW, winH, 54, bgImg, w, h);

  const inPad = Math.round(34 * fs);
  const ix = winX + inPad;
  const iw = winW - inPad * 2;
  const small = Math.round(19 * fs);

  // Window bar
  let y = winY + inPad;
  const barH = Math.round(40 * fs);
  ['#FF5F56', '#FFBD2E', '#27C93F'].forEach((color, index) => {
    ctx.beginPath();
    ctx.arc(ix + 12 + index * 32, y + barH / 2, 11, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${small}px ${MONO}`;
  let rightEdge = ix + iw;
  if (state.year) {
    const yw = ctx.measureText(String(state.year)).width + 34;
    drawRoundedRectPath(ctx, rightEdge - yw, y, yw, barH, barH / 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(String(state.year), rightEdge - yw / 2, y + barH / 2 + 1);
    rightEdge -= yw + 14;
  }
  if (state.medium) {
    ctx.fillStyle = accent;
    ctx.textAlign = 'right';
    ctx.fillText(state.medium.toUpperCase(), rightEdge, y + barH / 2 + 1);
    rightEdge -= ctx.measureText(state.medium.toUpperCase()).width + 18;
  }
  ctx.font = `600 ${small}px ${MONO}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'left';
  ctx.fillText(fitSingleLine(ctx, 'POSTERBOXD // SPATIAL OS', rightEdge - (ix + 112)), ix + 112, y + barH / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  y += barH + 18;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(ix, y, iw, 2);
  y += 20;

  // Hero banner
  const heroH = Math.round((isSquare ? 190 : (isStory ? 400 : 300)) * Math.min(1.15, Math.max(0.7, state.posterScale)));
  const heroY = y;
  drawMovableGroup(ctx, 'artwork', 'Hero Banner', { x: ix, y: heroY, w: iw, h: heroH }, () => {
    ctx.save();
    drawRoundedRectPath(ctx, ix, heroY, iw, heroH, 34);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.clip();
    if (heroImg) drawImageCover(ctx, heroImg, ix, heroY, iw, heroH);
    const fade = ctx.createLinearGradient(0, heroY, 0, heroY + heroH);
    fade.addColorStop(0.2, 'rgba(0, 0, 0, 0)');
    fade.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
    ctx.fillStyle = fade;
    ctx.fillRect(ix, heroY, iw, heroH);
    ctx.restore();
    ctx.save();
    drawRoundedRectPath(ctx, ix, heroY, iw, heroH, 34);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    const titleW = iw - 56;
    if (state.useLogoImage && state.logoImg) {
      const maxH = Math.round(heroH * 0.34);
      const ratio = Math.min(titleW * 0.7 / state.logoImg.width, maxH / state.logoImg.height);
      const lw = Math.round(state.logoImg.width * ratio);
      const lh = Math.round(state.logoImg.height * ratio);
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 20;
      ctx.drawImage(state.logoImg, ix + 28, heroY + heroH - lh - 24, lw, lh);
      ctx.restore();
    } else {
      const tLayout = computeAdaptiveTitleLayout(ctx, String(state.title || '').toUpperCase(), titleW, Math.round(54 * fs), '"Syne", sans-serif', '800', 2);
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 20;
      drawTitle(ctx, tLayout, ix + 28, heroY + heroH - 22 - tLayout.lines.length * tLayout.lineHeight);
      ctx.restore();
    }
  });
  y += heroH + 22;

  // Columns
  const colsTop = y;
  const colsH = winY + winH - inPad - colsTop;
  const gap = 20;
  const leftW = Math.round((iw - gap) * 0.42);
  const rightW = iw - gap - leftW;
  const rightX = ix + leftW + gap;
  drawWell(ctx, ix, colsTop, leftW, colsH, 32);
  drawWell(ctx, rightX, colsTop, rightW, colsH, 32);

  // People sidebar
  const wp = Math.round(24 * fs);
  const avatarR = Math.round((isSquare ? 22 : 27) * fs);
  const namePx = Math.round(21 * fs);
  const rolePx = Math.round(15 * fs);
  const tiny = Math.round(16 * fs);
  const rowH = avatarR * 2 + 14;
  const cast = getCastNames(3).map((name) => ({ name, role: '' }));
  const crew = getCrewList(isSquare ? 2 : 3);
  const headH = tiny + 14;
  const available = colsH - wp * 2;
  let castCount = cast.length;
  let crewCount = crew.length;
  const needed = () => (castCount ? headH + castCount * rowH : 0) + (crewCount ? headH + crewCount * rowH : 0) + (castCount && crewCount ? 22 : 0);
  while (needed() > available && (castCount > 1 || crewCount > 1)) {
    if (castCount >= crewCount && castCount > 1) castCount -= 1;
    else if (crewCount > 1) crewCount -= 1;
    else break;
  }
  if (needed() > available) { crewCount = 0; }
  let py = colsTop + wp;
  const drawPeople = (label, list, showRole) => {
    ctx.font = `600 ${tiny}px ${MONO}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.textAlign = 'left';
    ctx.fillText(label, ix + wp, py + tiny);
    py += headH;
    list.forEach((person) => {
      const cy = py + avatarR;
      drawMonogram(ctx, ix + wp + avatarR, cy, avatarR, person.name);
      const tx = ix + wp + avatarR * 2 + 14;
      const tw = leftW - wp * 2 - avatarR * 2 - 14;
      ctx.font = `600 ${namePx}px ${SANS}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(fitSingleLine(ctx, person.name, tw), tx, showRole ? cy - rolePx * 0.55 : cy + 1);
      if (showRole) {
        ctx.font = `600 ${rolePx}px ${MONO}`;
        ctx.fillStyle = accent;
        ctx.fillText(fitSingleLine(ctx, person.role, tw), tx, cy + namePx * 0.62);
      }
      ctx.textBaseline = 'alphabetic';
      py += rowH;
    });
  };
  if (castCount) drawPeople('STARRING CAST', cast.slice(0, castCount), false);
  if (castCount && crewCount) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(ix + wp, py + 2, leftW - wp * 2, 2);
    py += 22;
  }
  if (crewCount) drawPeople('KEY CREW', crew.slice(0, crewCount), true);

  // Review card
  const rx = rightX + wp;
  const rw = rightW - wp * 2;
  const headRowH = drawHandleStarsRow(ctx, rx, colsTop + wp, rw, fs, accent);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(rx, colsTop + wp + headRowH + 12, rw, 2);

  const pillH = Math.round(48 * fs);
  const specPx = Math.round(17 * fs);
  const specH = specPx * 2 + 12;
  const bottomY = colsTop + colsH - wp;
  const specY = bottomY - specH;
  const qrSize = state.showQrCode ? Math.min(Math.round(specH + pillH + 24), 108) : 0;
  ctx.font = `500 ${specPx}px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(fitSingleLine(ctx, state.genre || '', rw - (qrSize ? qrSize + 12 : 0)), rx, specY + specPx);
  ctx.fillStyle = SOFT;
  ctx.fillText(fitSingleLine(ctx, [state.runtime, getLoggedDate()].filter(Boolean).join(' • '), rw - (qrSize ? qrSize + 12 : 0)), rx, specY + specPx * 2 + 10);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(rx, specY - 14, rw - (qrSize ? qrSize + 12 : 0), 2);
  const scoreRowY = specY - 28 - pillH;
  if (getScoreText()) {
    ctx.font = `600 ${tiny}px ${MONO}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOUR SCORE', rx, scoreRowY + pillH / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    drawMovableGroup(ctx, 'rating', 'Score Pill', { x: rx + rw - 150 - (qrSize ? qrSize + 12 : 0), y: scoreRowY, w: 150, h: pillH }, () => {
      drawScorePill(ctx, rx + rw - (qrSize ? qrSize + 12 : 0), scoreRowY, fs, accent, 'right');
    });
  }
  if (qrSize) {
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: rx + rw - qrSize, y: bottomY - qrSize, w: qrSize, h: qrSize }, () => {
      drawPosterQrCode(ctx, rx + rw - qrSize, bottomY - qrSize, qrSize, false);
    });
  }

  const qTop = colsTop + wp + headRowH + 28;
  const qRoom = scoreRowY - 22 - qTop;
  const quote = layoutQuote(ctx, getQuoteText(), rw, qRoom, { basePx: Math.round(42 * fs), minPx: Math.round(21 * fs), font: QUOTE, maxLines: 12 });
  if (quote.lines.length) {
    const qy = Math.round(qTop + (qRoom - quote.height) / 2);
    drawMovableGroup(ctx, 'review', 'Review Quote', { x: rx, y: qy, w: rw, h: quote.height }, () => {
      drawQuoteLines(ctx, quote, rx, qy, { font: QUOTE });
    });
  }

  drawFooterBrand(ctx, w / 2, frame.footerY, false);
}

// ---------------------------------------------------------------------------
// Glass Stack — lock-screen style widgets stacked over the key art.
// ---------------------------------------------------------------------------
export function renderGlassStackPoster(ctx, w, h) {
  const frame = getStudioFrame(w, h);
  const { fs, top, isSquare, contentBottom } = frame;
  const pad = 52;
  const innerW = w - pad * 2;
  const accent = getAccent();
  const bgImg = state.posterImg || state.backdropImg;
  const small = Math.round(18 * fs);

  drawArtBackdrop(ctx, w, h, bgImg, { blur: Math.min(state.backdropBlur, 6), dim: 0.08 });
  const shade = ctx.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
  shade.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);

  // Top notification widget
  const tp = Math.round(26 * fs);
  const thumbH = Math.round((isSquare ? 130 : 168) * Math.min(1.15, Math.max(0.7, state.posterScale)));
  const thumbW = Math.round(thumbH * 2 / 3);
  const topH = thumbH + tp * 2;
  const topY = top + 40;
  drawFrostedPanel(ctx, pad, topY, innerW, topH, 46, bgImg, w, h);
  const pill = { w: getScoreText() ? Math.round(130 * fs) : 0 };
  drawMovableGroup(ctx, 'title', 'Title Widget', { x: pad, y: topY, w: innerW, h: topH }, () => {
    drawThumb(ctx, bgImg, pad + tp, topY + tp, thumbW, thumbH, 24);
    const tx = pad + tp + thumbW + 24;
    const tw = innerW - tp * 2 - thumbW - 24 - (pill.w ? pill.w + 20 : 0);
    const tLayout = computeAdaptiveTitleLayout(ctx, String(state.title || '').toUpperCase(), tw, Math.round(44 * fs), '"Syne", sans-serif', '800', 2);
    const blockH = small + 10 + tLayout.lines.length * tLayout.lineHeight + small + 10;
    let ty = topY + tp + Math.max(0, (thumbH - blockH) / 2);
    ctx.font = `600 ${small}px ${MONO}`;
    ctx.fillStyle = SOFT;
    ctx.textAlign = 'left';
    ctx.fillText(fitSingleLine(ctx, ['POSTERBOXD', state.year, state.medium].filter(Boolean).join(' • ').toUpperCase(), tw), tx, ty + small);
    ty += small + 10;
    ty = drawTitle(ctx, tLayout, tx, ty);
    ctx.font = `500 ${small}px ${MONO}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.fillText(fitSingleLine(ctx, state.episodeTitle || state.genre || '', tw), tx, ty + small + 6);
    drawScorePill(ctx, pad + innerW - tp, topY + topH / 2 - Math.round(24 * fs), fs, accent, 'right');
  });

  // Bottom two widgets
  const bp = Math.round(24 * fs);
  const avatarR = Math.round(24 * fs);
  const botH = bp * 2 + small + 16 + avatarR * 2 + 16 + small;
  const botY = contentBottom - botH;
  const gap = 20;
  const halfW = (innerW - gap) / 2;
  const cast = getCastNames(2);
  const crew = getCrewList(1)[0];
  drawFrostedPanel(ctx, pad, botY, halfW, botH, 40, bgImg, w, h);
  drawFrostedPanel(ctx, pad + halfW + gap, botY, halfW, botH, 40, bgImg, w, h);

  // Cast widget
  let bx = pad + bp;
  const bw = halfW - bp * 2;
  ctx.font = `600 ${small}px ${MONO}`;
  ctx.fillStyle = SOFT;
  ctx.textAlign = 'left';
  ctx.fillText('STARRING CAST', bx, botY + bp + small);
  if (getScoreText()) {
    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.fillText(`${getScoreText()}/5`, bx + bw, botY + bp + small);
  }
  const rowCy = botY + bp + small + 16 + avatarR;
  cast.forEach((name, index) => drawMonogram(ctx, bx + avatarR + index * (avatarR * 1.5), rowCy, avatarR, name));
  const namesX = bx + (cast.length ? avatarR * 2 + (cast.length - 1) * avatarR * 1.5 + 14 : 0);
  ctx.font = `600 ${Math.round(20 * fs)}px ${SANS}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(fitSingleLine(ctx, cast.join(', ') || '—', bx + bw - namesX), namesX, rowCy + 1);
  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 ${small}px ${MONO}`;
  ctx.fillStyle = SOFT;
  ctx.fillText(fitSingleLine(ctx, [getLoggedDate(), state.watchedAt ? state.watchedAt.toUpperCase() : ''].filter(Boolean).join(' · '), bw), bx, botY + botH - bp);

  // Direction widget
  bx = pad + halfW + gap + bp;
  ctx.font = `600 ${small}px ${MONO}`;
  ctx.fillStyle = SOFT;
  ctx.fillText('DIRECTION & SPECS', bx, botY + bp + small);
  if (crew) {
    drawMonogram(ctx, bx + avatarR, rowCy, avatarR, crew.name);
    ctx.font = `700 ${Math.round(22 * fs)}px ${SANS}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(fitSingleLine(ctx, crew.name, bw - avatarR * 2 - 14), bx + avatarR * 2 + 14, rowCy + 1);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.font = `500 ${small}px ${MONO}`;
  ctx.fillStyle = SOFT;
  ctx.fillText(fitSingleLine(ctx, [state.runtime, state.genre].filter(Boolean).join(' • '), bw), bx, botY + botH - bp);

  // Centre review widget
  const areaTop = topY + topH + 26;
  const areaBottom = botY - 26;
  const cp = Math.round(34 * fs);
  const headRow = Math.round(32 * fs);
  const qrSize = state.showQrCode ? 100 : 0;
  const qRoom = areaBottom - areaTop - cp * 2 - headRow - 22 - (qrSize ? qrSize + 18 : 0);
  const quote = layoutQuote(ctx, getQuoteText(), innerW - cp * 2, qRoom, { basePx: Math.round(52 * fs), minPx: Math.round(24 * fs), font: QUOTE, maxLines: 9 });
  const cardH = cp * 2 + headRow + (quote.lines.length ? 22 + quote.height : 0) + (qrSize ? qrSize + 18 : 0);
  const cardY = Math.round(areaTop + Math.max(0, (areaBottom - areaTop - cardH) / 2));
  drawFrostedPanel(ctx, pad, cardY, innerW, cardH, 48, bgImg, w, h);
  drawMovableGroup(ctx, 'review', 'Review Widget', { x: pad, y: cardY, w: innerW, h: cardH }, () => {
    drawHandleStarsRow(ctx, pad + cp, cardY + cp, innerW - cp * 2, fs, accent);
    let end = cardY + cp + headRow;
    if (quote.lines.length) end = drawQuoteLines(ctx, quote, pad + cp, end + 22, { font: QUOTE });
    if (qrSize) drawPosterQrCode(ctx, pad + cp, end + 18, qrSize, false);
  });

  drawFooterBrand(ctx, w / 2, frame.footerY, false);
}

// ---------------------------------------------------------------------------
// Split Spread — magazine issue: poster beside (or above) a glass review panel.
// ---------------------------------------------------------------------------
export function renderSplitSpreadPoster(ctx, w, h) {
  const frame = getStudioFrame(w, h);
  const { fs, top, isSquare, isStory, contentBottom } = frame;
  const pad = 56;
  const innerW = w - pad * 2;
  const accent = getAccent();
  const posterImg = state.posterImg || state.backdropImg;
  const bgImg = state.backdropImg || state.posterImg;
  const small = Math.round(19 * fs);

  drawArtBackdrop(ctx, w, h, bgImg, { blur: Math.max(14, state.backdropBlur), dim: 0.35 });
  const shade = ctx.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
  shade.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);

  // Masthead
  const mastY = top + 58;
  ctx.font = `600 ${small}px ${MONO}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.textAlign = 'right';
  const mastRight = [state.medium, state.year, state.runtime].filter(Boolean).join(' • ').toUpperCase();
  ctx.fillText(mastRight, w - pad, mastY);
  ctx.textAlign = 'left';
  ctx.fillText(fitSingleLine(ctx, `POSTERBOXD ISSUE${state.tmdbId ? ` // #${state.tmdbId}` : ''}`, innerW - ctx.measureText(mastRight).width - 30), pad, mastY);

  // Bottom strip
  const stripH = Math.round(64 * fs);
  const stripY = contentBottom - stripH;
  ctx.save();
  drawRoundedRectPath(ctx, pad, stripY, innerW, stripH, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  const cast = getCastNames(3);
  const avR = Math.round(20 * fs);
  cast.forEach((name, index) => drawMonogram(ctx, pad + 22 + avR + index * avR * 1.5, stripY + stripH / 2, avR, name));
  ctx.font = `500 ${small}px ${MONO}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.66)';
  const dateText = getLoggedDate();
  ctx.fillText(dateText, w - pad - 22, stripY + stripH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  const castX = pad + 22 + (cast.length ? avR * 2 + (cast.length - 1) * avR * 1.5 + 16 : 0);
  ctx.fillText(fitSingleLine(ctx, cast.slice(0, 2).join(', ') || 'PosterBoxd Selection', w - pad - 22 - ctx.measureText(dateText).width - 24 - castX), castX, stripY + stripH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  const areaTop = mastY + 30;
  const areaBottom = stripY - 28;
  const areaH = areaBottom - areaTop;
  const pillH = Math.round(48 * fs);

  if (isStory) {
    // Stacked: info card, then review panel.
    const cp = Math.round(28 * fs);
    const thumbH = Math.round(330 * Math.min(1.15, Math.max(0.7, state.posterScale)));
    const thumbW = Math.round(thumbH * 2 / 3);
    const infoH = thumbH + cp * 2;
    const rp = Math.round(36 * fs);
    const headRow = Math.round(32 * fs);
    const qrSize = state.showQrCode ? 104 : 0;
    const qRoom = areaH - infoH - 26 - rp * 2 - headRow - 24 - (qrSize ? qrSize + 18 : 0);
    const quote = layoutQuote(ctx, getQuoteText(), innerW - rp * 2, qRoom, { basePx: Math.round(54 * fs), minPx: Math.round(26 * fs), font: QUOTE, maxLines: 10 });
    const reviewH = rp * 2 + headRow + (quote.lines.length ? 24 + quote.height : 0) + (qrSize ? qrSize + 18 : 0);
    const totalH = infoH + 26 + reviewH;
    const infoY = Math.round(areaTop + Math.max(0, (areaH - totalH) / 2));

    ctx.save();
    drawRoundedRectPath(ctx, pad, infoY, innerW, infoH, 40);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    drawMovableGroup(ctx, 'artwork', 'Poster', { x: pad + cp, y: infoY + cp, w: thumbW, h: thumbH }, () => {
      drawThumb(ctx, posterImg, pad + cp, infoY + cp, thumbW, thumbH, 26);
    });
    const tx = pad + cp + thumbW + 30;
    const tw = innerW - cp * 2 - thumbW - 30;
    const tLayout = computeAdaptiveTitleLayout(ctx, String(state.title || '').toUpperCase(), tw, Math.round(56 * fs), '"Syne", sans-serif', '800', 3);
    const blockH = (state.genre ? small + 30 : 0) + tLayout.lines.length * tLayout.lineHeight + small + 16 + (getScoreText() ? pillH + 20 : 0);
    const blockY = infoY + cp + Math.max(0, (thumbH - blockH) / 2);
    drawMovableGroup(ctx, 'title', 'Title Block', { x: tx, y: blockY, w: tw, h: blockH }, () => {
      let ty = blockY;
      if (state.genre) {
        ctx.font = `600 ${small}px ${MONO}`;
        const chip = fitSingleLine(ctx, state.genre.toUpperCase(), tw - 28);
        const chipW = ctx.measureText(chip).width + 28;
        drawRoundedRectPath(ctx, tx, ty, chipW, small + 16, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(chip, tx + 14, ty + (small + 16) / 2 + 1);
        ctx.textBaseline = 'alphabetic';
        ty += small + 30;
      }
      ty = drawTitle(ctx, tLayout, tx, ty);
      ctx.font = `500 ${small}px ${MONO}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.76)';
      ctx.fillText(fitSingleLine(ctx, (state.episodeTitle || (state.director ? `DIR. ${state.director}` : '')).toUpperCase(), tw), tx, ty + small + 6);
      drawScorePill(ctx, tx, ty + small + 16 + 20, fs, accent, 'left');
    });

    const reviewY = infoY + infoH + 26;
    drawFrostedPanel(ctx, pad, reviewY, innerW, reviewH, 44, bgImg, w, h);
    drawMovableGroup(ctx, 'review', 'Review Panel', { x: pad, y: reviewY, w: innerW, h: reviewH }, () => {
      drawHandleStarsRow(ctx, pad + rp, reviewY + rp, innerW - rp * 2, fs, accent);
      let end = reviewY + rp + headRow;
      if (quote.lines.length) end = drawQuoteLines(ctx, quote, pad + rp, end + 24, { font: QUOTE });
      if (qrSize) drawPosterQrCode(ctx, pad + rp, end + 18, qrSize, false);
    });
  } else {
    // Side by side: poster left, glass panel right.
    const gap = 28;
    const maxPosterH = areaH;
    let posterW = Math.round(innerW * 0.42 * Math.min(1.12, Math.max(0.75, state.posterScale)));
    let posterH = Math.round(posterW * 1.5);
    if (posterH > maxPosterH) { posterH = Math.round(maxPosterH); posterW = Math.round(posterH / 1.5); }
    const panelX = pad + posterW + gap;
    const panelW = w - pad - panelX;
    const pp = Math.round(30 * fs);
    const pw = panelW - pp * 2;
    const tLayout = computeAdaptiveTitleLayout(ctx, String(state.title || '').toUpperCase(), pw, Math.round(46 * fs), '"Syne", sans-serif', '800', 3);
    const titleH = tLayout.lines.length * tLayout.lineHeight;
    const starRow = Math.round(32 * fs);
    const qrSize = state.showQrCode && !isSquare ? 96 : 0;
    const fixedH = pp + pillH + 18 + titleH + 16 + 20 + starRow + pp + (qrSize ? qrSize + 16 : 0);
    const quote = layoutQuote(ctx, getQuoteText(), pw, areaH - fixedH, { basePx: Math.round(40 * fs), minPx: Math.round(21 * fs), font: QUOTE, maxLines: 12 });
    const panelH = Math.max(Math.min(posterH, areaH), fixedH + quote.height);
    const blockH = Math.max(posterH, panelH);
    const blockY = Math.round(areaTop + Math.max(0, (areaH - blockH) / 2));
    const posterY = Math.round(blockY + (blockH - posterH) / 2);
    const panelY = Math.round(blockY + (blockH - panelH) / 2);

    drawMovableGroup(ctx, 'artwork', 'Poster', { x: pad, y: posterY, w: posterW, h: posterH }, () => {
      drawThumb(ctx, posterImg, pad, posterY, posterW, posterH, 30);
    });
    drawFrostedPanel(ctx, panelX, panelY, panelW, panelH, 40, bgImg, w, h);
    drawMovableGroup(ctx, 'review', 'Review Panel', { x: panelX, y: panelY, w: panelW, h: panelH }, () => {
      const px = panelX + pp;
      let ty = panelY + pp;
      ctx.font = `600 ${small}px ${MONO}`;
      ctx.fillStyle = SOFT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(fitSingleLine(ctx, (state.episodeTitle || state.genre || String(state.year || '')).toUpperCase(), pw - 150), px, ty + pillH / 2 + 1);
      ctx.textBaseline = 'alphabetic';
      drawScorePill(ctx, px + pw, ty, fs, accent, 'right');
      ty += pillH + 18;
      ty = drawTitle(ctx, tLayout, px, ty) + 16;
      if (quote.lines.length) ty = drawQuoteLines(ctx, quote, px, ty, { font: QUOTE });
      if (qrSize) drawPosterQrCode(ctx, px, ty + 16, qrSize, false);
      const rowY = panelY + panelH - pp - starRow;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(px, rowY - 12, pw, 2);
      drawHandleStarsRow(ctx, px, rowY, pw, fs, accent);
    });
  }

  drawFooterBrand(ctx, w / 2, frame.footerY, false);
}
