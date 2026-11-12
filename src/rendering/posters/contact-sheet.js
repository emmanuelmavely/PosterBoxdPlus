import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  getReadableTextColor,
  getVividPaletteColor
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';
import {
  fitSingleLine,
  fitTextBlock,
  getHandle,
  getLoggedDate,
  getScoreText,
  getStudioFrame
} from './studio-shared.js';

const MONO = '"JetBrains Mono", monospace';
const AMBER = '#FBBF24';

// 35mm contact sheet: three frames from the scene still beside proof-sheet notes.
export function renderContactSheetPoster(ctx, w, h) {
  const frame = getStudioFrame(w, h);
  const { fs, top, isSquare, contentBottom } = frame;
  const accent = getVividPaletteColor('#E2A84B');
  const splitX = Math.round(w * 0.56);
  const stillImg = state.backdropImg || state.posterImg;

  ctx.fillStyle = '#0C0C10';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, splitX, h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(splitX, 0, 2, h);

  // ---- Left: film strip ----
  const lPad = 36;
  const stripW = splitX - lPad * 2;
  const labelPx = Math.round(19 * fs);
  let y = top + 52;
  ctx.font = `600 ${labelPx}px ${MONO}`;
  ctx.fillStyle = AMBER;
  ctx.textAlign = 'right';
  const idText = state.tmdbId ? `#${state.tmdbId}` : '#0001';
  ctx.fillText(idText, splitX - lPad, y);
  ctx.textAlign = 'left';
  ctx.fillText(fitSingleLine(ctx, 'EASTMAN 5222 // CONTACT', stripW - ctx.measureText(idText).width - 20), lPad, y);

  const framesTop = y + 22;
  const framesBottom = contentBottom - labelPx - 26;
  const gap = isSquare ? 16 : 24;
  const frameH = Math.floor((framesBottom - framesTop - gap * 2) / 3);
  const crops = [[0, 0], [-100, -70], [100, 70]];

  drawMovableGroup(ctx, 'artwork', 'Film Strip', { x: lPad, y: framesTop, w: stripW, h: frameH * 3 + gap * 2 }, () => {
    crops.forEach(([offsetX, offsetY], index) => {
      const fy = framesTop + index * (frameH + gap);
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.fillRect(lPad, fy, stripW, frameH);
      if (stillImg) {
        ctx.beginPath();
        ctx.rect(lPad, fy, stripW, frameH);
        ctx.clip();
        ctx.filter = `brightness(${Math.min(110, state.backdropBrightness + 40)}%)`;
        // Frames 2 and 3 zoom in slightly so the three crops read as different shots.
        const zoom = index === 0 ? 0 : 0.16;
        drawImageCover(ctx, stillImg, lPad - stripW * zoom, fy - frameH * zoom, stripW * (1 + zoom * 2), frameH * (1 + zoom * 2), offsetX, offsetY);
        ctx.filter = 'none';
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(lPad, fy, stripW, frameH);

      const tag = `0${index + 1}A`;
      ctx.font = `700 ${Math.round(18 * fs)}px ${MONO}`;
      const tagW = ctx.measureText(tag).width + 20;
      const tagH = Math.round(30 * fs);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(lPad + stripW - tagW - 10, fy + frameH - tagH - 10, tagW, tagH);
      ctx.fillStyle = AMBER;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tag, lPad + stripW - tagW / 2 - 10, fy + frameH - tagH / 2 - 9);
      ctx.textBaseline = 'alphabetic';
    });
  });

  ctx.font = `500 ${labelPx}px ${MONO}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'left';
  const runtimeText = String(state.runtime || state.year || '').toUpperCase();
  ctx.fillText(runtimeText, lPad, contentBottom - 6);
  ctx.textAlign = 'right';
  ctx.fillText(fitSingleLine(ctx, String(state.genre || '').toUpperCase(), stripW - ctx.measureText(runtimeText).width - 24), splitX - lPad, contentBottom - 6);

  // ---- Right: proof-sheet notes ----
  const rPad = 34;
  const rx = splitX + rPad;
  const rw = w - rx - rPad;
  const muted = 'rgba(244, 241, 234, 0.6)';
  const ink = '#F4F1EA';
  let ry = top + 52;

  ctx.font = `600 ${labelPx}px ${MONO}`;
  ctx.fillStyle = muted;
  ctx.textAlign = 'left';
  ctx.fillText('PROOF SHEET', rx, ry);
  if (state.medium) {
    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.fillText(fitSingleLine(ctx, state.medium.toUpperCase(), rw * 0.5), rx + rw, ry);
  }
  ry += 18;

  const tLayout = computeAdaptiveTitleLayout(ctx, String(state.title || '').toUpperCase(), rw, Math.round(50 * fs), '"Syne", sans-serif', '800', 3);
  const smallPx = Math.round(18 * fs);
  const namePx = Math.round(25 * fs);
  const titleGroupH = tLayout.lines.length * tLayout.lineHeight + smallPx + namePx + 48;
  const titleTop = ry;
  drawMovableGroup(ctx, 'title', 'Title & Director', { x: rx, y: titleTop, w: rw, h: titleGroupH }, () => {
    let ty = titleTop;
    ctx.font = `800 ${tLayout.fontPx}px "Syne", sans-serif`;
    ctx.fillStyle = ink;
    ctx.textAlign = 'left';
    tLayout.lines.forEach((line) => {
      ty += tLayout.lineHeight;
      ctx.fillText(line, rx, ty - Math.round(tLayout.fontPx * 0.12));
    });
    ty += smallPx + 18;
    ctx.font = `500 ${smallPx}px ${MONO}`;
    ctx.fillStyle = muted;
    ctx.fillText(fitSingleLine(ctx, `${state.mediaType === 'tv' ? 'CREATOR' : 'DIRECTOR'}${state.year ? ` (${state.year})` : ''}`, rw), rx, ty);
    ty += namePx + 8;
    ctx.font = `700 ${namePx}px ${MONO}`;
    ctx.fillStyle = ink;
    ctx.fillText(fitSingleLine(ctx, state.episodeTitle || state.director || '—', rw), rx, ty);
  });
  ry = titleTop + titleGroupH + 22;

  // Rating well
  const score = getScoreText();
  const hasRating = Boolean(score) || state.isLiked;
  if (hasRating) {
    const wellH = Math.round((isSquare ? 108 : 132) * fs);
    const wellY = ry;
    drawMovableGroup(ctx, 'rating', 'Critic Rating', { x: rx, y: wellY, w: rw, h: wellH }, () => {
      drawRoundedRectPath(ctx, rx, wellY, rw, wellH, 16);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = `600 ${smallPx}px ${MONO}`;
      ctx.fillStyle = muted;
      ctx.textAlign = 'left';
      ctx.fillText('CRITIC RATING', rx + 18, wellY + 20 + smallPx);
      if (score) {
        const pillW = Math.round(104 * fs);
        const pillH = Math.round(44 * fs);
        drawRoundedRectPath(ctx, rx + rw - pillW - 16, wellY + 14, pillW, pillH, 10);
        ctx.fillStyle = accent;
        ctx.fill();
        ctx.font = `800 ${Math.round(24 * fs)}px ${MONO}`;
        ctx.fillStyle = getReadableTextColor(accent);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${score} ★`, rx + rw - pillW / 2 - 16, wellY + 14 + pillH / 2 + 1);
        ctx.textBaseline = 'alphabetic';
      }
      const starR = Math.round(17 * fs);
      drawRatingAndHeartRow(ctx, { x: rx + 18, y: wellY + wellH - starR * 2 - 18, rating: state.rating, isLiked: state.isLiked, starSize: starR, gap: 8, align: 'left', starColor: accent });
    });
    ry = wellY + wellH + 22;
  }

  // Bottom block: cast + date, anchored to the bottom.
  const castNames = String(state.cast || '').split(',').map((name) => name.trim()).filter(Boolean).slice(0, isSquare ? 2 : 3);
  const castPx = Math.round(22 * fs);
  const dateY = contentBottom - 6;
  const castBlockH = castNames.length ? smallPx + 12 + castNames.length * (castPx + 10) : 0;
  const castTop = dateY - smallPx - 30 - castBlockH;

  ctx.textAlign = 'left';
  if (castNames.length) {
    let cy = castTop + smallPx;
    ctx.font = `500 ${smallPx}px ${MONO}`;
    ctx.fillStyle = muted;
    ctx.fillText('STARRING CAST:', rx, cy);
    cy += 12;
    ctx.font = `600 ${castPx}px ${MONO}`;
    ctx.fillStyle = ink;
    castNames.forEach((name) => {
      cy += castPx + 10;
      ctx.fillText(fitSingleLine(ctx, name, rw), rx, cy);
    });
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(rx, dateY - smallPx - 14, rw, 2);
  ctx.font = `500 ${smallPx}px ${MONO}`;
  ctx.fillStyle = muted;
  ctx.fillText(fitSingleLine(ctx, [getLoggedDate(), state.watchedAt ? state.watchedAt.toUpperCase() : ''].filter(Boolean).join(' · '), rw), rx, dateY);

  // Selected take: centred in whatever is left between rating and cast.
  const takeTop = ry;
  const takeBottom = castTop - 22;
  const areaH = takeBottom - takeTop;
  const qrSize = state.showQrCode && areaH > 330 ? 100 : 0;
  const quote = state.review ? `“${state.review}”` : '';
  if (quote && areaH > smallPx * 2 + 70) {
    const basePx = Math.round((quote.length > 120 ? 34 : 40) * fs);
    const room = areaH - smallPx * 2 - 56 - (qrSize ? qrSize + 20 : 0);
    const maxLines = Math.max(1, Math.min(12, Math.floor(room / (basePx * 1.28))));
    const fit = fitTextBlock(ctx, quote, rw, maxLines, basePx, Math.round(22 * fs), (px) => `italic ${px}px "Instrument Serif", serif`);
    const blockH = smallPx + 14 + fit.lines.length * fit.lineHeight + smallPx + 24 + (qrSize ? qrSize + 20 : 0);
    const blockY = Math.round(takeTop + Math.max(0, (areaH - blockH) / 2));

    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(rx, blockY - 14, rw, 2);
    drawMovableGroup(ctx, 'review', 'Selected Take', { x: rx, y: blockY, w: rw, h: blockH }, () => {
      let ty = blockY + smallPx;
      ctx.textAlign = 'left';
      ctx.font = `600 ${smallPx}px ${MONO}`;
      ctx.fillStyle = accent;
      ctx.fillText('SELECTED TAKE:', rx, ty);
      ty += 14;
      ctx.font = `italic ${fit.px}px "Instrument Serif", serif`;
      ctx.fillStyle = ink;
      fit.lines.forEach((line) => {
        ty += fit.lineHeight;
        ctx.fillText(line, rx, ty - Math.round(fit.px * 0.2));
      });
      ty += smallPx + 16;
      ctx.font = `500 ${smallPx}px ${MONO}`;
      ctx.fillStyle = muted;
      ctx.fillText(fitSingleLine(ctx, `— ${getHandle()}`, rw), rx, ty);
      if (qrSize) drawPosterQrCode(ctx, rx, ty + 20, qrSize, false);
    });
  }

  drawFooterBrand(ctx, w / 2, frame.footerY, false);
}
