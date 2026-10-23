import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawPaletteBar,
  drawProcessedBackdrop,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  getDetailedReviewLines,
  getWrappedLines
} from '../primitives.js';
import { drawMovableGroup } from '../transforms.js';

export function renderIosGlassPoster(ctx, w, h) {
  const bgImg = state.backdropImg || state.posterImg;
  drawProcessedBackdrop(ctx, w, h, bgImg, Math.max(22, state.backdropBlur), Math.min(80, state.backdropBrightness + 10));

  const cardMargin = 68;
  const cardW = w - cardMargin * 2;
  const cardH = h - cardMargin * 2 - 84;
  const cx = w / 2;

  ctx.save();
  drawRoundedRectPath(ctx, cardMargin, cardMargin, cardW, cardH, 48);
  const glassGrad = ctx.createLinearGradient(cardMargin, cardMargin, cardW + cardMargin, cardH + cardMargin);
  glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.20)');
  glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.09)');
  glassGrad.addColorStop(1, 'rgba(20, 22, 30, 0.52)');
  ctx.fillStyle = glassGrad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.stroke();
  ctx.restore();

  const pillY = cardMargin + 38;
  ctx.save();
  drawRoundedRectPath(ctx, cx - 190, pillY, 380, 44, 22);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.fill();
  ctx.font = '700 17px "JetBrains Mono", monospace';
  ctx.fillStyle = '#E5E7EB';
  ctx.textAlign = 'center';
  ctx.fillText(state.watchedAt ? `WATCHED AT ${state.watchedAt.toUpperCase()}` : `NOW LOGGED  ·  ${state.medium || state.year}`, cx, pillY + 28);
  ctx.restore();

  const isCompact = h < 1500;
  const artH = Math.round((isCompact ? cardH * 0.41 : cardH * 0.45) * Math.min(1.12, state.posterScale));
  const artW = Math.round(artH * (2 / 3));
  const artX = Math.round(cx - artW / 2);
  const artY = pillY + 66;

  drawMovableGroup(ctx, 'artwork', 'Glass Poster', { x: artX, y: artY, w: artW, h: artH }, () => {
    if (state.posterImg) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = 44;
      ctx.shadowOffsetY = 20;
      drawRoundedRectPath(ctx, artX, artY, artW, artH, 28);
      ctx.clip();
      drawImageCover(ctx, state.posterImg, artX, artY, artW, artH);
      ctx.restore();
    }
  });

  let curY = artY + artH + 42;
  const fs = Math.min(1.18, state.fontScale) * (isCompact ? 0.88 : 1.0);
  const tLayout = computeAdaptiveTitleLayout(ctx, state.title, cardW - 90, Math.round(52 * fs), '"Plus Jakarta Sans", sans-serif', '800', 2);
  const titleGroupH = tLayout.lines.length * tLayout.lineHeight + 42;

  drawMovableGroup(ctx, 'title', 'Glass Title', { x: cardMargin + 45, y: curY, w: cardW - 90, h: titleGroupH }, () => {
    ctx.font = `800 ${tLayout.fontPx}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    tLayout.lines.forEach((line, idx) => {
      ctx.fillText(line, cx, curY + (idx + 1) * tLayout.fontPx + idx * 4);
    });

    ctx.font = `600 ${Math.round(24 * fs)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    const meta = [state.episodeTitle || state.director, state.year, state.runtime || state.medium].filter(Boolean).join('  •  ');
    ctx.fillText(getWrappedLines(ctx, meta, cardW - 90, 1)[0] || '', cx, curY + tLayout.lines.length * tLayout.lineHeight + 30);
  });
  curY += titleGroupH + 24;

  if (state.rating > 0 || state.isLiked) {
    const starR = Math.round(25 * fs);
    drawRatingAndHeartRow(ctx, { x: cx, y: curY, rating: state.rating, isLiked: state.isLiked, starSize: starR, gap: 12, align: 'center', starColor: '#FACC15' });
    curY += starR * 2 + 26;
  }

  if (state.review || (state.showDetailedReview && state.detailedReview)) {
    const revPx = Math.round(33 * fs);
    ctx.font = `600 ${revPx}px "Plus Jakarta Sans", sans-serif`;
    const lines = state.review ? getWrappedLines(ctx, `“${state.review}”`, cardW - 100, 3) : [];
    const detPx = Math.round(22 * fs);
    ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
    const dLines = getDetailedReviewLines(ctx, state.detailedReview, cardW - 110, 2);
    const rH = lines.length * (revPx + 8) + dLines.length * (detPx + 6) + 20;

    drawMovableGroup(ctx, 'review', 'Glass Review', { x: cardMargin + 50, y: curY, w: cardW - 100, h: rH }, () => {
      let ry = curY;
      ctx.font = `600 ${revPx}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      lines.forEach((l) => {
        ry += revPx + 6;
        ctx.fillText(l, cx, ry);
      });
      if (dLines.length) {
        ry += 16;
        ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.80)';
        dLines.forEach((dl) => {
          ry += detPx + 5;
          ctx.fillText(dl, cx, ry);
        });
      }
    });
  }

  // Bottom Glass Metadata & Palette Dock
  const dockY = cardMargin + cardH - 74;
  drawPaletteBar(ctx, cx, dockY, 320, 12, false, false);
  if (state.cast || state.genre) {
    ctx.font = `500 ${Math.round(20 * fs)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.textAlign = 'center';
    const bottomSpec = [state.genre, state.cast].filter(Boolean).join('  ·  ');
    ctx.fillText(getWrappedLines(ctx, bottomSpec, cardW - 120, 1)[0] || '', cx, dockY + 38);
  }

  drawFooterBrand(ctx, cx, h - 26, false);
}
