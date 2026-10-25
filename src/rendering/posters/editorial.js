import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawMediumBadge,
  drawProcessedBackdrop,
  drawRatingAndHeartRow,
  getDetailedReviewLines,
  getWrappedLines
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';

export function renderEditorialPoster(ctx, w, h) {
  const bgImg = state.posterImg || state.backdropImg;
  drawProcessedBackdrop(ctx, w, h, bgImg, Math.max(0, state.backdropBlur - 10), Math.min(100, state.backdropBrightness + 15));

  const leftX = 80;
  const maxW = w - leftX * 2;
  const hasQr = Boolean(state.showQrCode);
  const textMaxW = hasQr ? maxW - 130 : maxW;
  const fs = Math.min(1.22, state.fontScale) * (h < 1500 ? 0.88 : 1.0);
  let cursorBottom = h - Math.round(135 * state.footerScale);

  if (state.medium) {
    drawMovableGroup(ctx, 'medium', 'Format Badge', { x: w - leftX - 190, y: 76, w: 190, h: 56 }, () => {
      drawMediumBadge(ctx, w - leftX - 95, 76, state.medium, false, fs);
    });
  }

  if (hasQr) {
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: w - leftX - 112, y: h - 252, w: 112, h: 112 }, () => {
      drawPosterQrCode(ctx, w - leftX - 112, h - 252, 112, false);
    });
  }

  if (state.rating > 0 || state.isLiked) {
    const starR = Math.round(26 * fs);
    cursorBottom -= starR * 2;
    drawMovableGroup(ctx, 'rating', 'Star Rating', { x: leftX, y: cursorBottom, w: 380, h: starR * 2 }, () => {
      drawRatingAndHeartRow(ctx, { x: leftX, y: cursorBottom, rating: state.rating, isLiked: state.isLiked, starSize: starR, gap: 14, align: 'left', starColor: '#00E054' });
    });
    cursorBottom -= Math.round(28 * state.sectionSpacing);
  }

  const dLines = getDetailedReviewLines(ctx, state.detailedReview, textMaxW, 3);
  if (dLines.length > 0) {
    const detPx = Math.round(23 * fs);
    const dH = dLines.length * (detPx + 7);
    cursorBottom -= dH;
    const topDetY = cursorBottom;
    drawMovableGroup(ctx, 'detailedReview', 'Detailed Review', { x: leftX, y: topDetY, w: textMaxW, h: dH }, () => {
      ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#D1D5DB';
      ctx.textAlign = 'left';
      dLines.forEach((l, i) => {
        ctx.fillText(l, leftX, topDetY + (i + 1) * (detPx + 6));
      });
    });
    cursorBottom -= Math.round(24 * state.sectionSpacing);
  }

  if (state.review) {
    const revPx = Math.round(38 * fs);
    ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
    const lines = getWrappedLines(ctx, `“${state.review}”`, textMaxW, 3);
    const rH = lines.length * (revPx + 8);
    cursorBottom -= rH;
    const topRevY = cursorBottom;
    drawMovableGroup(ctx, 'review', 'Review Quote', { x: leftX, y: topRevY, w: textMaxW, h: rH }, () => {
      ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      lines.forEach((l, i) => {
        ctx.fillText(l, leftX, topRevY + (i + 1) * (revPx + 6));
      });
    });
    cursorBottom -= Math.round(28 * state.sectionSpacing);
  }

  const credPx = Math.round(24 * fs);
  const rows = [
    state.episodeTitle ? { role: /^S\d+E\d+/i.test(state.episodeTitle) ? 'Episode' : 'Season', val: state.episodeTitle } : null,
    state.director ? { role: state.mediaType === 'tv' ? (state.episodeTitle ? 'Episode Director' : 'Created by') : 'Director', val: state.director } : null,
    state.dop ? { role: 'Cinematography', val: state.dop } : null,
    state.music ? { role: 'Original Score', val: state.music } : null,
    state.cast ? { role: state.episodeTitle ? 'Starring' : 'Cast', val: state.cast } : null,
    (state.year || state.runtime || state.genre) ? { role: 'Specs', val: [state.year, state.runtime, state.genre].filter(Boolean).join(' · ') } : null
  ].filter(Boolean);
  const rowStep = Math.round(35 * fs);
  const credH = rows.length * rowStep;
  cursorBottom -= credH;
  const topCredY = cursorBottom;

  drawMovableGroup(ctx, 'credits', 'Crew Block', { x: leftX, y: topCredY, w: maxW, h: credH }, () => {
    rows.forEach((r, idx) => {
      const ry = topCredY + (idx + 1) * rowStep;
      const label = `${r.role}: `;
      ctx.font = `400 ${credPx}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#9CA3AF';
      ctx.textAlign = 'left';
      ctx.fillText(label, leftX, ry);
      const lw = ctx.measureText(label).width;
      ctx.font = `700 ${credPx}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(getWrappedLines(ctx, r.val, maxW - lw, 1)[0] || '', leftX + lw, ry);
    });
  });
  cursorBottom -= Math.round(28 * state.sectionSpacing);

  if (state.useLogoImage && state.logoImg) {
    const maxLogoW = Math.round(620 * Math.min(1.2, state.posterScale));
    const maxLogoH = Math.round(165 * Math.min(1.2, state.posterScale));
    const ratio = Math.min(maxLogoW / state.logoImg.width, maxLogoH / state.logoImg.height);
    const lw = Math.round(state.logoImg.width * ratio);
    const lh = Math.round(state.logoImg.height * ratio);
    cursorBottom -= lh;
    const logoY = cursorBottom;
    drawMovableGroup(ctx, 'title', 'Title Logo', { x: leftX, y: logoY, w: lw, h: lh }, () => {
      ctx.drawImage(state.logoImg, leftX, logoY, lw, lh);
    });
  } else {
    const tLayout = computeAdaptiveTitleLayout(ctx, state.title, maxW, Math.round(64 * fs), '"Syne", sans-serif', '800', 2);
    const tH = tLayout.lines.length * tLayout.lineHeight;
    cursorBottom -= tH;
    const topTY = cursorBottom;
    drawMovableGroup(ctx, 'title', 'Title Header', { x: leftX, y: topTY, w: maxW, h: tH }, () => {
      ctx.font = `800 ${tLayout.fontPx}px "Syne", sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      tLayout.lines.forEach((l, i) => {
        ctx.fillText(l, leftX, topTY + (i + 1) * tLayout.fontPx);
      });
    });
  }

  drawFooterBrand(ctx, w / 2, h - 28, false);
}
