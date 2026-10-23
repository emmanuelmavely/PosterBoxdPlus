import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawProcessedBackdrop,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  getDetailedReviewLines,
  getWrappedLines
} from '../primitives.js';
import { drawMovableGroup } from '../transforms.js';

// Helper: Render Broadway / Cinema Marquee Lit-Up Bulb Text (with automatic fallback to clean font if too long or toggled off)
function drawBulbLitMarqueeTitle(ctx, lines, cx, startY, fontPx, lineGap = 6) {
  lines.forEach((line, idx) => {
    const ly = startY + idx * (fontPx + lineGap);
    ctx.save();
    ctx.font = `800 ${fontPx}px "Syne", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Warm outer neon/incandescent halo
    ctx.shadowColor = 'rgba(251, 191, 36, 0.95)';
    ctx.shadowBlur = 28;
    ctx.fillStyle = '#F59E0B';
    ctx.fillText(line, cx, ly);

    // 2. Dark brass socket casing stroke
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(4, Math.round(fontPx * 0.10));
    ctx.strokeStyle = '#78350F';
    ctx.strokeText(line, cx, ly);

    // 3. Warm golden body fill
    ctx.fillStyle = '#FDE047';
    ctx.fillText(line, cx, ly);

    // 4. Dotted incandescent filament bulb highlights along the letter strokes
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(2.5, Math.round(fontPx * 0.055));
    ctx.lineCap = 'round';
    ctx.setLineDash([1, Math.max(7, Math.round(fontPx * 0.16))]);
    ctx.shadowColor = '#FEF08A';
    ctx.shadowBlur = 10;
    ctx.strokeText(line, cx, ly);
    ctx.restore();

    ctx.restore();
  });
}

export function renderMarqueePoster(ctx, w, h) {
  const bgImg = state.backdropImg || state.posterImg;
  drawProcessedBackdrop(ctx, w, h, bgImg, Math.max(24, state.backdropBlur), Math.min(35, state.backdropBrightness));

  const pad = 64;
  const innerW = w - pad * 2;
  const marqueeBaseFs = state.fontScale * 1.3 * (h < 1500 ? 0.88 : 1.0);
  const fs = Math.min(1.55, marqueeBaseFs);

  const mqY = 60;
  const mqH = 290;
  const boxArtImg = state.backdropImg || state.posterImg;

  ctx.save();
  drawRoundedRectPath(ctx, pad, mqY, innerW, mqH, 18);
  ctx.fillStyle = '#181411';
  ctx.shadowColor = 'rgba(245, 158, 11, 0.55)';
  ctx.shadowBlur = 48;
  ctx.fill();
  ctx.clip();

  if (boxArtImg) {
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.filter = 'contrast(115%) brightness(65%)';
    drawImageCover(ctx, boxArtImg, pad, mqY, innerW, mqH, 0, 0);
    ctx.restore();
  }
  const mqGrad = ctx.createLinearGradient(0, mqY, 0, mqY + mqH);
  mqGrad.addColorStop(0, 'rgba(18, 14, 10, 0.86)');
  mqGrad.addColorStop(0.5, 'rgba(24, 18, 12, 0.72)');
  mqGrad.addColorStop(1, 'rgba(15, 12, 8, 0.92)');
  ctx.fillStyle = mqGrad;
  ctx.fillRect(pad, mqY, innerW, mqH);
  ctx.restore();

  ctx.save();
  drawRoundedRectPath(ctx, pad, mqY, innerW, mqH, 18);
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#D97706';
  ctx.stroke();
  ctx.restore();

  const numBulbs = 22;
  for (let i = 0; i < numBulbs; i++) {
    const bx = pad + 24 + (i * (innerW - 48)) / (numBulbs - 1);
    ctx.fillStyle = i % 2 === 0 ? '#FDE047' : '#F97316';
    ctx.beginPath();
    ctx.arc(bx, mqY, 4.5, 0, Math.PI * 2);
    ctx.arc(bx, mqY + mqH, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMovableGroup(ctx, 'title', 'Marquee Sign & Bulb Title', { x: pad + 20, y: mqY + 16, w: innerW - 40, h: mqH - 32 }, () => {
    ctx.font = `700 ${Math.round(18 * fs)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#FBBF24';
    ctx.textAlign = 'center';
    const topBanner = state.watchedAt ? `NOW SHOWING AT ${state.watchedAt.toUpperCase()}` : `NOW SHOWING · ${state.medium || 'FEATURE PRESENTATION'}`;
    ctx.fillText(getWrappedLines(ctx, topBanner, innerW - 60, 1)[0] || '', w / 2, mqY + 46);

    const cleanTitleUpper = String(state.title || 'UNTITLED').toUpperCase();
    const tLayout = computeAdaptiveTitleLayout(ctx, cleanTitleUpper, innerW - 70, Math.round(50 * fs), '"Syne", sans-serif', '800', 2);
    const canFitBulbEffect = state.marqueeBulbMode && cleanTitleUpper.length <= 28;

    if (canFitBulbEffect) {
      const startBulbY = tLayout.lines.length === 1 ? (mqY + 148) : (mqY + 118);
      drawBulbLitMarqueeTitle(ctx, tLayout.lines, w / 2, startBulbY, tLayout.fontPx, 8);
    } else if (state.useLogoImage && state.logoImg && !state.marqueeBulbMode) {
      const maxLW = innerW - 140;
      const maxLH = 140;
      const ratio = Math.min(maxLW / state.logoImg.width, maxLH / state.logoImg.height);
      const lw = Math.round(state.logoImg.width * ratio);
      const lh = Math.round(state.logoImg.height * ratio);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 18;
      ctx.drawImage(state.logoImg, Math.round(w / 2 - lw / 2), Math.round(mqY + 62 + (140 - lh) / 2), lw, lh);
      ctx.restore();
    } else {
      ctx.font = `800 ${tLayout.fontPx}px "Syne", sans-serif`;
      ctx.fillStyle = '#FFFBEB';
      ctx.textAlign = 'center';
      if (tLayout.lines.length === 1) {
        ctx.fillText(tLayout.lines[0], w / 2, mqY + 154);
      } else {
        tLayout.lines.forEach((l, idx) => {
          ctx.fillText(l, w / 2, mqY + 114 + idx * (tLayout.fontPx + 4));
        });
      }
    }

    ctx.font = `700 ${Math.round(18 * fs)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#E5E7EB';
    ctx.textAlign = 'center';
    const bottomLine = [`DIR. ${(state.director || '').toUpperCase()}`, state.year, state.runtime, `${(state.rating || 0).toFixed(1)} ★`].filter(Boolean).join('   •   ');
    ctx.fillText(getWrappedLines(ctx, bottomLine, innerW - 60, 1)[0] || '', w / 2, mqY + mqH - 26);
  });

  const artY = mqY + mqH + 38;
  const artH = Math.round((h < 1500 ? h * 0.40 : h * 0.44) * Math.min(1.08, state.posterScale));
  const artW = Math.round(artH * (2 / 3));
  const artX = Math.round((w - artW) / 2);
  const artImg = state.posterImg || state.backdropImg;

  drawMovableGroup(ctx, 'artwork', 'Poster Case', { x: artX, y: artY, w: artW, h: artH }, () => {
    if (artImg) {
      ctx.save();
      ctx.shadowColor = 'rgba(245, 158, 11, 0.28)';
      ctx.shadowBlur = 50;
      drawRoundedRectPath(ctx, artX, artY, artW, artH, 16);
      ctx.clip();
      drawImageCover(ctx, artImg, artX, artY, artW, artH);
      ctx.restore();

      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      drawRoundedRectPath(ctx, artX, artY, artW, artH, 16);
      ctx.stroke();
    }
  });

  let curY = artY + artH + 36;
  drawRatingAndHeartRow(ctx, { x: w / 2, y: curY, rating: state.rating, isLiked: state.isLiked, starSize: Math.round(25 * state.fontScale), gap: 12, align: 'center', starColor: '#FBBF24' });
  curY += Math.round(62 * state.fontScale);

  if (state.review || (state.showDetailedReview && state.detailedReview)) {
    const revPx = Math.round(36 * state.fontScale);
    ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
    ctx.fillStyle = '#FEF3C7';
    ctx.textAlign = 'center';
    const lines = state.review ? getWrappedLines(ctx, `“${state.review}”`, innerW - 30, 3) : [];
    lines.forEach((l) => {
      curY += revPx + 6;
      ctx.fillText(l, w / 2, curY);
    });
    const dLines = getDetailedReviewLines(ctx, state.detailedReview, innerW - 50, 2);
    if (dLines.length > 0 && curY < h - 135) {
      curY += 14;
      const detPx = Math.round(22 * state.fontScale);
      ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#D1D5DB';
      dLines.forEach((dl) => {
        if (curY + detPx < h - 105) {
          curY += detPx + 6;
          ctx.fillText(dl, w / 2, curY);
        }
      });
    }
  }

  drawFooterBrand(ctx, w / 2, h - 26, false);
}
