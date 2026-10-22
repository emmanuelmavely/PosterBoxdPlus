import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawPaletteBar,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  ensureVisibleAccentOnDark,
  getDetailedReviewLines,
  getWrappedLines
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';

export function renderCriterionPoster(ctx, w, h) {
  ctx.fillStyle = '#0E1014';
  ctx.fillRect(0, 0, w, h);

  const accentColor = ensureVisibleAccentOnDark(state.palette[0], '#00E054');
  const pad = 72;
  const innerW = w - pad * 2;
  const fs = Math.min(1.2, state.fontScale) * (h < 1500 ? 0.88 : 1.0);

  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, w, 18);

  let topY = 74;
  ctx.font = '700 21px "JetBrains Mono", monospace';
  ctx.fillStyle = '#E5E7EB';
  ctx.textAlign = 'left';
  ctx.fillText('THE POSTERBOXD ARCHIVE EDITION', pad, topY);
  ctx.textAlign = 'right';
  ctx.fillStyle = accentColor;
  ctx.fillText(`SPINE ${state.spine || '#0101'}`, w - pad, topY);

  topY += 20;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(pad, topY, innerW, 2);

  topY += 38;
  const tLayout = computeAdaptiveTitleLayout(ctx, state.title, innerW, Math.round(56 * fs), '"Syne", sans-serif', '800', 2);
  const headerH = tLayout.lines.length * tLayout.lineHeight + 42;

  drawMovableGroup(ctx, 'title', 'Criterion Title', { x: pad, y: topY, w: innerW, h: headerH }, () => {
    ctx.font = `600 ${Math.round(21 * fs)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = ensureVisibleAccentOnDark(state.palette[2], '#40BCF4');
    ctx.textAlign = 'left';
    ctx.fillText(`A ${state.mediaType === 'tv' ? 'SERIES' : 'FILM'} BY ${(state.director || 'UNKNOWN').toUpperCase()}`, pad, topY + 20);

    ctx.font = `800 ${tLayout.fontPx}px "Syne", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    tLayout.lines.forEach((line, idx) => {
      ctx.fillText(line, pad, topY + 30 + (idx + 1) * tLayout.fontPx + idx * 4);
    });
  });

  topY += headerH + 22;
  const artH = Math.round((h < 1500 ? h * 0.38 : h * 0.42) * Math.min(1.08, state.posterScale));
  const artImg = state.backdropImg || state.posterImg;

  drawMovableGroup(ctx, 'artwork', 'Criterion Artwork', { x: pad, y: topY, w: innerW, h: artH }, () => {
    if (artImg) {
      ctx.save();
      drawRoundedRectPath(ctx, pad, topY, innerW, artH, 12);
      ctx.clip();
      drawImageCover(ctx, artImg, pad, topY, innerW, artH);
      ctx.restore();
    }
  });

  const botY = topY + artH + 50;
  const colLeftW = Math.round(innerW * 0.36);
  const colRightX = pad + colLeftW + 44;
  const colRightW = innerW - colLeftW - 44;

  drawMovableGroup(ctx, 'credits', 'Specs Column', { x: pad, y: botY - 10, w: colLeftW, h: 290 }, () => {
    let leftCursor = botY;
    const specPx = Math.round(21 * fs);
    ctx.font = `600 ${specPx}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'left';
    [['YEAR', state.year], ['FORMAT', state.medium || state.runtime], ['RUNTIME', state.runtime], ['DOP', state.dop], ['SCORE', state.music]]
      .filter(s => s[1])
      .forEach(([k, v]) => {
        ctx.fillStyle = '#9CA3AF';
        ctx.fillText(k, pad, leftCursor);
        ctx.fillStyle = '#F3F4F6';
        ctx.fillText(getWrappedLines(ctx, v, colLeftW - 110, 1)[0] || '', pad + 106, leftCursor);
        leftCursor += Math.round(36 * fs);
      });
    leftCursor += 14;
    drawPaletteBar(ctx, pad + (colLeftW - 16) / 2, leftCursor, colLeftW - 16, 14, false, false);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(colRightX - 22, botY - 18, 1.5, Math.min(290, h - botY - 210));

  drawMovableGroup(ctx, 'review', 'Criterion Essay & Review', { x: colRightX, y: botY - 10, w: colRightW, h: 310 }, () => {
    let rightCursor = botY;
    const starR = Math.round(23 * fs);
    drawRatingAndHeartRow(ctx, { x: colRightX, y: rightCursor - 18, rating: state.rating, isLiked: state.isLiked, starSize: starR, gap: 12, align: 'left', starColor: '#00E054' });
    rightCursor += starR * 2 + 18;

    if (state.review) {
      const revPx = Math.round(34 * fs);
      ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      const lines = getWrappedLines(ctx, `“${state.review}”`, colRightW, 2);
      lines.forEach(l => {
        rightCursor += revPx + 2;
        ctx.fillText(l, colRightX, rightCursor);
        rightCursor += 4;
      });
    }

    const dLines = getDetailedReviewLines(ctx, state.detailedReview, colRightW, 3);
    if (dLines.length > 0) {
      rightCursor += 16;
      const detPx = Math.round(21 * fs);
      ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#D1D5DB';
      ctx.textAlign = 'left';
      dLines.forEach(dl => {
        rightCursor += detPx + 5;
        ctx.fillText(dl, colRightX, rightCursor);
      });
    }

    if (state.cast) {
      rightCursor += 18;
      const castPx = Math.round(20 * fs);
      ctx.font = `600 ${castPx}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#9CA3AF';
      const cLines = getWrappedLines(ctx, `Starring: ${state.cast}`, colRightW, 1);
      cLines.forEach(cl => {
        rightCursor += castPx + 4;
        ctx.fillText(cl, colRightX, rightCursor);
      });
    }
  });

  if (state.showQrCode) {
    const qrSize = 118;
    const qrX = Math.round(w / 2 - qrSize / 2);
    const qrY = h - 220;
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: qrX, y: qrY, w: qrSize, h: qrSize }, () => {
      drawPosterQrCode(ctx, qrX, qrY, qrSize, false);
    });
  }

  drawFooterBrand(ctx, w / 2, h - 28, false);
}
