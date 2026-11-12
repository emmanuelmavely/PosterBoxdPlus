import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawDetailedReviewLine,
  drawFooterBrand,
  drawImageCover,
  drawProcessedBackdrop,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  ensureVisibleAccentOnDark,
  getDetailedReviewLines,
  getReadableTextColor,
  getVividPaletteColor
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';
import {
  fitSingleLine,
  fitTextBlock,
  formatTimecode,
  getHandle,
  getLoggedDate,
  getScoreText,
  getStudioFrame,
  parseRuntimeMinutes
} from './studio-shared.js';

const SANS = '"Plus Jakarta Sans", sans-serif';
const MONO = '"JetBrains Mono", monospace';
const PROGRESS = 0.64;

function drawGlassPill(ctx, x, y, width, height) {
  drawRoundedRectPath(ctx, x, y, width, height, height / 2);
  ctx.fillStyle = 'rgba(15, 15, 22, 0.62)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// "Now playing" media-player card in frosted glass over the key art.
export function renderGlassPlayerPoster(ctx, w, h) {
  const frame = getStudioFrame(w, h);
  const { fs, top, isSquare, contentBottom } = frame;
  const pad = 56;
  const accent = ensureVisibleAccentOnDark(getVividPaletteColor('#E2A84B'), '#E2A84B');
  const bgImg = state.posterImg || state.backdropImg;

  drawProcessedBackdrop(ctx, w, h, bgImg, Math.min(state.backdropBlur, 8), Math.min(100, state.backdropBrightness + 25));
  ctx.save();
  const glow = ctx.createRadialGradient(w * 0.92, h * 0.9, 0, w * 0.92, h * 0.9, w * 0.62);
  glow.addColorStop(0, `${accent}88`);
  glow.addColorStop(1, `${accent}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Top status pills
  const pillPx = Math.round(20 * fs);
  const pillH = Math.round(48 * fs);
  const pillY = top + 44;
  ctx.font = `600 ${pillPx}px ${MONO}`;
  const idLabel = state.tmdbId ? `POSTERBOXD // #${state.tmdbId}` : 'POSTERBOXD // NOW PLAYING';
  const idW = ctx.measureText(idLabel).width + 66;
  drawGlassPill(ctx, pad, pillY, idW, pillH);
  ctx.beginPath();
  ctx.arc(pad + 26, pillY + pillH / 2, 7, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(idLabel, pad + 44, pillY + pillH / 2 + 1);
  if (state.medium) {
    const mediumLabel = fitSingleLine(ctx, state.medium.toUpperCase(), w - pad * 2 - idW - 80);
    const mW = ctx.measureText(mediumLabel).width + 44;
    drawGlassPill(ctx, w - pad - mW, pillY, mW, pillH);
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText(mediumLabel, w - pad - mW / 2, pillY + pillH / 2 + 1);
  }
  ctx.textBaseline = 'alphabetic';

  // ---- Measure the card ----
  const cardX = pad;
  const cardW = w - pad * 2;
  const inPad = Math.round(40 * fs);
  const innerW = cardW - inPad * 2;
  const thumbH = Math.round((isSquare ? 190 : (frame.isStory ? 320 : 250)) * Math.min(1.15, Math.max(0.7, state.posterScale)));
  const thumbW = Math.round(thumbH * 2 / 3);
  const headTextX = cardX + inPad + thumbW + 30;
  const headTextW = innerW - thumbW - 30;
  const tLayout = computeAdaptiveTitleLayout(ctx, state.title, headTextW, Math.round(52 * fs), SANS, '800', 2);

  const areaTop = pillY + pillH + 30;
  const areaBottom = contentBottom - 10;
  const quote = state.review ? `“${state.review}”` : '';
  const wellPad = Math.round(28 * fs);
  const wellInnerW = innerW - wellPad * 2;
  const starR = Math.round(19 * fs);
  const footRowH = starR * 2 + 34;
  const scrubH = Math.round(70 * fs);
  const fixedH = inPad + thumbH + 30 + wellPad + footRowH + wellPad + 30 + scrubH + inPad;
  const maxCardH = areaBottom - areaTop;
  const basePx = Math.round((quote.length > 120 ? 36 : 44) * fs);
  const quoteRoom = maxCardH - fixedH;
  const maxLines = Math.max(1, Math.min(8, Math.floor(quoteRoom / (basePx * 1.28))));
  const fit = quote
    ? fitTextBlock(ctx, quote, wellInnerW, maxLines, basePx, Math.round(24 * fs), (px) => `600 ${px}px ${SANS}`)
    : { px: 0, lines: [], lineHeight: 0 };
  const quoteH = fit.lines.length * fit.lineHeight;
  const detPx = Math.round(22 * fs);
  const detRoom = quoteRoom - quoteH - 20;
  ctx.font = `400 ${detPx}px ${SANS}`;
  const dLines = detRoom > detPx + 8 ? getDetailedReviewLines(ctx, state.detailedReview, wellInnerW, Math.floor(detRoom / (detPx + 8))) : [];
  const detH = dLines.length ? dLines.length * (detPx + 8) + 14 : 0;
  const wellH = wellPad + quoteH + detH + footRowH + wellPad;
  const cardH = inPad + thumbH + 30 + wellH + 30 + scrubH + inPad;
  const cardY = Math.round(areaTop + Math.max(0, (maxCardH - cardH) / 2));

  // ---- Glass card ----
  ctx.save();
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, 56);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 28;
  ctx.fillStyle = 'rgba(14, 14, 22, 0.5)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, 56);
  ctx.clip();
  if (bgImg) {
    ctx.filter = 'blur(28px) saturate(170%)';
    drawImageCover(ctx, bgImg, -40, -40, w + 80, h + 80, 0, 0);
    ctx.filter = 'none';
  }
  const glass = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  glass.addColorStop(0, 'rgba(34, 34, 46, 0.62)');
  glass.addColorStop(1, 'rgba(14, 14, 22, 0.78)');
  ctx.fillStyle = glass;
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.restore();
  ctx.save();
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, 56);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // Header: thumbnail + title
  const thumbX = cardX + inPad;
  const thumbY = cardY + inPad;
  drawMovableGroup(ctx, 'artwork', 'Player Artwork', { x: thumbX, y: thumbY, w: thumbW, h: thumbH }, () => {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 14;
    drawRoundedRectPath(ctx, thumbX, thumbY, thumbW, thumbH, 30);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.clip();
    if (bgImg) drawImageCover(ctx, bgImg, thumbX, thumbY, thumbW, thumbH);
    ctx.restore();
    ctx.save();
    drawRoundedRectPath(ctx, thumbX, thumbY, thumbW, thumbH, 30);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });

  const yearPx = Math.round(20 * fs);
  const yearPillH = Math.round(38 * fs);
  const dirPx = Math.round(25 * fs);
  const useLogo = state.useLogoImage && state.logoImg;
  const titleH = useLogo ? Math.round(86 * fs) : tLayout.lines.length * tLayout.lineHeight;
  const headBlockH = yearPillH + 16 + titleH + (state.director ? dirPx + 16 : 0);
  const headY = Math.round(thumbY + Math.max(0, (thumbH - headBlockH) / 2));

  drawMovableGroup(ctx, 'title', 'Player Title', { x: headTextX, y: headY, w: headTextW, h: headBlockH }, () => {
    let ty = headY;
    let pillEnd = headTextX;
    if (state.year) {
      ctx.font = `700 ${yearPx}px ${MONO}`;
      const yW = ctx.measureText(String(state.year)).width + 32;
      drawRoundedRectPath(ctx, headTextX, ty, yW, yearPillH, yearPillH / 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.fillStyle = getReadableTextColor(accent);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(state.year), headTextX + yW / 2, ty + yearPillH / 2 + 1);
      ctx.textBaseline = 'alphabetic';
      pillEnd = headTextX + yW + 16;
    }
    ctx.font = `500 ${yearPx}px ${MONO}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'left';
    const genreRoom = headTextX + headTextW - pillEnd;
    if (state.genre && genreRoom > 80) ctx.fillText(fitSingleLine(ctx, state.genre, genreRoom), pillEnd, ty + yearPillH / 2 + yearPx * 0.35);
    ty += yearPillH + 16;

    if (useLogo) {
      const ratio = Math.min(headTextW / state.logoImg.width, titleH / state.logoImg.height);
      const lw = Math.round(state.logoImg.width * ratio);
      const lh = Math.round(state.logoImg.height * ratio);
      ctx.drawImage(state.logoImg, headTextX, Math.round(ty + (titleH - lh) / 2), lw, lh);
      ty += titleH;
    } else {
      ctx.font = `800 ${tLayout.fontPx}px ${SANS}`;
      ctx.fillStyle = '#FFFFFF';
      tLayout.lines.forEach((line) => {
        ty += tLayout.lineHeight;
        ctx.fillText(line, headTextX, ty - Math.round(tLayout.fontPx * 0.14));
      });
    }
    if (state.director) {
      ty += dirPx + 12;
      ctx.font = `500 ${dirPx}px ${SANS}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
      const credit = state.episodeTitle || `${state.mediaType === 'tv' ? 'Created by' : 'Directed by'} ${state.director}`;
      ctx.fillText(fitSingleLine(ctx, credit, headTextW), headTextX, ty);
    }
  });

  // Review well
  const wellX = cardX + inPad;
  const wellY = thumbY + thumbH + 30;
  drawMovableGroup(ctx, 'review', 'Review Well', { x: wellX, y: wellY, w: innerW, h: wellH }, () => {
    drawRoundedRectPath(ctx, wellX, wellY, innerW, wellH, 34);
    const wellGrad = ctx.createLinearGradient(wellX, wellY, wellX, wellY + wellH);
    wellGrad.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
    wellGrad.addColorStop(1, 'rgba(10, 10, 16, 0.50)');
    ctx.fillStyle = wellGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.19)';
    ctx.lineWidth = 2;
    ctx.stroke();

    let ty = wellY + wellPad;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `600 ${fit.px}px ${SANS}`;
    fit.lines.forEach((line) => {
      ty += fit.lineHeight;
      ctx.fillText(line, wellX + wellPad, ty - Math.round(fit.px * 0.2));
    });
    if (dLines.length) {
      ty += 14;
      ctx.font = `400 ${detPx}px ${SANS}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      dLines.forEach((line) => {
        ty += detPx + 8;
        drawDetailedReviewLine(ctx, line, wellX + wellPad, ty, { align: 'left' });
      });
    }
    const rowTop = wellY + wellH - wellPad - footRowH;
    if (fit.lines.length || dLines.length) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.fillRect(wellX + wellPad, rowTop + 14, wellInnerW, 2);
    }
    const starsY = rowTop + 34;
    const score = getScoreText();
    const drawnW = (state.rating > 0 ? 5 * starR * 2 + 4 * 8 : 0) + (state.isLiked ? starR * 1.9 + (state.rating > 0 ? 14 : 0) : 0);
    drawRatingAndHeartRow(ctx, { x: wellX + wellPad, y: starsY, rating: state.rating, isLiked: state.isLiked, starSize: starR, gap: 8, align: 'left', starColor: accent });
    ctx.textBaseline = 'middle';
    if (score) {
      ctx.font = `700 ${Math.round(26 * fs)}px ${MONO}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(score, wellX + wellPad + drawnW + 18, starsY + starR + 1);
    }
    ctx.font = `500 ${Math.round(22 * fs)}px ${MONO}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'right';
    ctx.fillText(fitSingleLine(ctx, getHandle(), wellInnerW - drawnW - 130), wellX + innerW - wellPad, starsY + starR + 1);
    ctx.textBaseline = 'alphabetic';
  });

  // Scrubber
  const scrubY = wellY + wellH + 30;
  const trackH = 12;
  drawRoundedRectPath(ctx, wellX, scrubY, innerW, trackH, trackH / 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fill();
  const fillW = Math.round(innerW * PROGRESS);
  const fillGrad = ctx.createLinearGradient(wellX, 0, wellX + fillW, 0);
  fillGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  fillGrad.addColorStop(1, accent);
  drawRoundedRectPath(ctx, wellX, scrubY, fillW, trackH, trackH / 2);
  ctx.fillStyle = fillGrad;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(wellX + fillW, scrubY + trackH / 2, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  const tcPx = Math.round(20 * fs);
  const tcY = scrubY + trackH + tcPx + 18;
  const totalMinutes = parseRuntimeMinutes(state.runtime);
  ctx.font = `500 ${tcPx}px ${MONO}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  let sideW = 0;
  if (totalMinutes) {
    ctx.textAlign = 'left';
    ctx.fillText(formatTimecode(totalMinutes * PROGRESS), wellX, tcY);
    ctx.textAlign = 'right';
    const totalText = formatTimecode(totalMinutes);
    ctx.fillText(totalText, wellX + innerW, tcY);
    sideW = ctx.measureText(totalText).width + 24;
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  const centreLine = [getLoggedDate(), state.watchedAt ? state.watchedAt.toUpperCase() : ''].filter(Boolean).join(' · ');
  ctx.fillText(fitSingleLine(ctx, centreLine, innerW - sideW * 2), wellX + innerW / 2, tcY);

  if (state.showQrCode) {
    const qrSize = 104;
    const qrY = cardY + cardH + 24;
    if (qrY + qrSize < contentBottom) {
      drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: w - pad - qrSize, y: qrY, w: qrSize, h: qrSize }, () => {
        drawPosterQrCode(ctx, w - pad - qrSize, qrY, qrSize, false);
      });
    }
  }

  drawFooterBrand(ctx, w / 2, frame.footerY, false);
}
