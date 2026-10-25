import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  getDetailedReviewLines,
  getWrappedLines
} from '../primitives.js';
import { drawMovableGroup } from '../transforms.js';

export function renderRetroPoster(ctx, w, h) {
  ctx.fillStyle = '#18120E';
  ctx.fillRect(0, 0, w, h);

  const pad = 68;
  const innerW = w - pad * 2;
  const fs = Math.min(1.18, state.fontScale) * (h < 1500 ? 0.88 : 1.0);

  const stripeColors = ['#D9381E', '#E86F2C', '#F2A93B', '#F7D070'];
  stripeColors.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(pad, 56 + i * 16, innerW, 12);
  });

  const frameY = 138;
  const frameH = h - frameY - 125;
  ctx.save();
  drawRoundedRectPath(ctx, pad, frameY, innerW, frameH, 20);
  ctx.fillStyle = '#EFE6D5';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#D9381E';
  ctx.stroke();
  ctx.restore();

  let curY = frameY + 46;
  ctx.font = `700 ${Math.round(21 * fs)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#8C2D19';
  ctx.textAlign = 'center';
  ctx.fillText(`A RETROSPECTIVE FEATURE PRESENTATION · ${state.year}`, w / 2, curY);

  curY += 24;
  const artW = innerW - 76;
  const artH = Math.round((h < 1500 ? frameH * 0.44 : frameH * 0.48) * Math.min(1.08, state.posterScale));
  const artX = pad + 38;
  const artImg = state.posterImg || state.backdropImg;

  drawMovableGroup(ctx, 'artwork', 'Retro Artwork', { x: artX, y: curY, w: artW, h: artH }, () => {
    if (artImg) {
      ctx.save();
      drawRoundedRectPath(ctx, artX, curY, artW, artH, 12);
      ctx.clip();
      ctx.filter = 'sepia(22%) contrast(108%)';
      drawImageCover(ctx, artImg, artX, curY, artW, artH);
      ctx.filter = 'none';
      ctx.restore();

      ctx.strokeStyle = '#18120E';
      ctx.lineWidth = 4;
      drawRoundedRectPath(ctx, artX, curY, artW, artH, 12);
      ctx.stroke();
    }
  });

  curY += artH + 38;
  const tLayout = computeAdaptiveTitleLayout(ctx, state.title.toUpperCase(), artW, Math.round(52 * fs), '"Syne", sans-serif', '800', 2);
  const titleGroupH = tLayout.lines.length * tLayout.lineHeight + 42;

  drawMovableGroup(ctx, 'title', 'Retro Title', { x: artX, y: curY, w: artW, h: titleGroupH }, () => {
    ctx.font = `800 ${tLayout.fontPx}px "Syne", sans-serif`;
    ctx.fillStyle = '#18120E';
    ctx.textAlign = 'center';
    tLayout.lines.forEach((line, idx) => {
      ctx.fillText(line, w / 2, curY + (idx + 1) * tLayout.fontPx + idx * 4);
    });

    ctx.font = `700 ${Math.round(22 * fs)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#B45309';
    const credit = state.mediaType === 'tv'
      ? (state.director ? `${state.episodeTitle ? 'EPISODE DIR.' : 'CREATED BY'} ${state.director.toUpperCase()}` : '')
      : (state.director ? `DIRECTED BY ${state.director.toUpperCase()}` : '');
    const sub = [state.episodeTitle || credit, state.medium, state.runtime].filter(Boolean).join(' · ');
    if (sub) {
      ctx.fillText(getWrappedLines(ctx, sub, artW, 1)[0] || '', w / 2, curY + tLayout.lines.length * tLayout.lineHeight + 30);
    }
  });

  curY += titleGroupH + 22;
  drawRatingAndHeartRow(ctx, { x: w / 2, y: curY, rating: state.rating, isLiked: state.isLiked, starSize: Math.round(24 * fs), gap: 12, align: 'center', starColor: '#D9381E', emptyColor: 'rgba(24,18,14,0.2)', heartColor: '#B45309' });
  curY += Math.round(62 * fs);

  if (state.review || (state.showDetailedReview && state.detailedReview)) {
    const revPx = Math.round(35 * fs);
    ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
    ctx.fillStyle = '#1C1917';
    ctx.textAlign = 'center';
    const lines = state.review ? getWrappedLines(ctx, `“${state.review}”`, artW, 3) : [];
    lines.forEach((l) => {
      curY += revPx + 6;
      ctx.fillText(l, w / 2, curY);
    });
    const dLines = getDetailedReviewLines(ctx, state.detailedReview, artW - 20, 2);
    if (dLines.length > 0) {
      curY += 14;
      const detPx = Math.round(21 * fs);
      ctx.font = `500 ${detPx}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#44403C';
      dLines.forEach((dl) => {
        curY += detPx + 6;
        ctx.fillText(dl, w / 2, curY);
      });
    }
  }

  // Retro Billing Block at bottom of cream sleeve
  const billingY = frameY + frameH - 54;
  if (curY < billingY - 24 && (state.cast || state.genre)) {
    ctx.fillStyle = 'rgba(24, 18, 14, 0.16)';
    ctx.fillRect(artX, billingY - 28, artW, 2);
    ctx.font = `700 ${Math.round(19 * fs)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#57534E';
    ctx.textAlign = 'center';
    const billingText = [state.cast ? `STARRING ${state.cast.toUpperCase()}` : '', state.genre ? state.genre.toUpperCase() : ''].filter(Boolean).join('  ·  ');
    ctx.fillText(getWrappedLines(ctx, billingText, artW, 1)[0] || '', w / 2, billingY + 4);
  }

  drawFooterBrand(ctx, w / 2, h - 24, false);
}
