import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawDetailedReviewLine,
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
  const artH = Math.round((isCompact ? cardH * 0.34 : cardH * 0.39) * Math.min(1.12, state.posterScale));
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
  const titleTextW = cardW - 110;
  const tLayout = computeAdaptiveTitleLayout(ctx, state.title, titleTextW, Math.round(52 * fs), '"Plus Jakarta Sans", sans-serif', '800', 2);
  const titleGroupH = tLayout.lines.length * tLayout.lineHeight + 36;

  drawMovableGroup(ctx, 'title', 'Glass Title', { x: cardMargin + 45, y: curY, w: cardW - 90, h: titleGroupH }, () => {
    ctx.font = `800 ${tLayout.fontPx}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    tLayout.lines.forEach((line, idx) => {
      ctx.fillText(line, cx, curY + (idx + 1) * tLayout.fontPx + idx * 4);
    });

    ctx.font = `500 ${Math.round(18 * fs)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    const meta = [state.episodeTitle || state.director, state.year, state.runtime || state.medium].filter(Boolean).join('  ·  ');
    ctx.fillText(getWrappedLines(ctx, meta, titleTextW, 1)[0] || '', cx, curY + tLayout.lines.length * tLayout.lineHeight + 27);
  });
  curY += titleGroupH + 24;

  if (state.rating > 0 || state.isLiked) {
    const starR = Math.round(25 * fs);
    drawRatingAndHeartRow(ctx, { x: cx, y: curY, rating: state.rating, isLiked: state.isLiked, starSize: starR, gap: 12, align: 'center', starColor: '#FACC15' });
    curY += starR * 2 + 26;
  }

  if (state.review || (state.showDetailedReview && state.detailedReview)) {
    const dockY = cardMargin + cardH - 74;
    const reviewBottom = dockY - 52;
    const availableReviewH = reviewBottom - curY;
    if (availableReviewH < 72) return;
    const reviewFontScale = Math.min(1.25, Math.max(0.85, availableReviewH / 520));
    const revPx = Math.round(34 * fs * reviewFontScale);
    ctx.font = `italic 500 ${revPx}px "Instrument Serif", serif`;
    const maxReviewLines = Math.max(1, Math.min(3, Math.floor((availableReviewH * 0.42) / (revPx + 10))));
    const lines = state.review ? getWrappedLines(ctx, `“${state.review}”`, cardW - 100, maxReviewLines) : [];
    const detPx = Math.round(23 * fs * Math.min(1.05, reviewFontScale));
    ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
    const remainingDetailedH = Math.max(0, availableReviewH - lines.length * (revPx + 8) - (lines.length && state.detailedReview ? 14 : 0) - 16);
    const maxDetailedLines = Math.min(14, Math.floor(remainingDetailedH / (detPx + 9)));
    const dLines = getDetailedReviewLines(ctx, state.detailedReview, cardW - 110, maxDetailedLines);
    const rH = lines.length * (revPx + 10) + dLines.length * (detPx + 9) + (lines.length && dLines.length ? 18 : 0) + 16;

    drawMovableGroup(ctx, 'review', 'Glass Review', { x: cardMargin + 50, y: curY, w: cardW - 100, h: rH }, () => {
      let ry = curY;
      ctx.font = `italic 500 ${revPx}px "Instrument Serif", serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      lines.forEach((l) => {
        ry += revPx + 8;
        ctx.fillText(l, cx, ry);
      });
      if (dLines.length) {
        if (lines.length) ry += 12;
        ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.80)';
        dLines.forEach((dl) => {
          ry += detPx + 7;
          drawDetailedReviewLine(ctx, dl, cx, ry, { maxWidth: cardW - 110 });
        });
      }
    });
  }

  // Bottom Glass Metadata & Palette Dock
  const dockY = cardMargin + cardH - 74;
  drawPaletteBar(ctx, cx, dockY, 320, 12, false, false);
  if (state.cast || state.genre) {
    ctx.font = `400 ${Math.round(16 * fs)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.54)';
    ctx.textAlign = 'center';
    const bottomSpec = [state.genre, state.cast].filter(Boolean).join('  ·  ');
    ctx.fillText(getWrappedLines(ctx, bottomSpec, cardW - 120, 1)[0] || '', cx, dockY + 38);
  }

  drawFooterBrand(ctx, cx, h - 26, false);
}
