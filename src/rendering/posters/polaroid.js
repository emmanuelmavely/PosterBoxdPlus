import { state } from '../../state.js';
import { formatSafeDate } from '../../utils.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawPaletteBar,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  getDetailedReviewLines,
  getWrappedLines
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';

export function renderPolaroidPoster(ctx, w, h) {
  ctx.fillStyle = '#F4F1EA';
  ctx.fillRect(0, 0, w, h);

  const pad = 68;
  const isCompact = h < 1500;
  const artW = w - pad * 2;
  const artH = Math.round((isCompact ? h * 0.46 : h * 0.50) * Math.min(1.08, state.posterScale));
  const artImg = state.posterImg || state.backdropImg;

  drawMovableGroup(ctx, 'artwork', 'Polaroid Artwork', { x: pad, y: pad, w: artW, h: artH }, () => {
    if (artImg) {
      ctx.save();
      drawRoundedRectPath(ctx, pad, pad, artW, artH, Math.min(24, state.posterRadius));
      ctx.clip();
      drawImageCover(ctx, artImg, pad, pad, artW, artH);
      ctx.restore();
    }
  });

  let curY = pad + artH + 22;
  drawPaletteBar(ctx, pad + artW / 2, curY, artW, 16, false, true);
  curY += 32;

  const fs = Math.min(1.18, state.fontScale) * (isCompact ? 0.9 : 1.0);
  const tLayout = computeAdaptiveTitleLayout(ctx, state.title.toUpperCase(), artW * 0.62, Math.round(48 * fs), '"Syne", sans-serif', '800', 2);
  const titleBlockH = tLayout.lines.length * tLayout.lineHeight + 42;

  drawMovableGroup(ctx, 'title', 'Polaroid Title', { x: pad, y: curY, w: artW, h: titleBlockH }, () => {
    ctx.font = `800 ${tLayout.fontPx}px "Syne", sans-serif`;
    ctx.fillStyle = '#18181B';
    ctx.textAlign = 'left';
    tLayout.lines.forEach((line, idx) => {
      ctx.fillText(line, pad, curY + (idx + 1) * tLayout.fontPx + idx * 4);
    });

    drawRatingAndHeartRow(ctx, {
      x: w - pad,
      y: curY + 10,
      rating: state.rating,
      isLiked: state.isLiked,
      starSize: Math.round(21 * fs),
      gap: 9,
      align: 'right',
      starColor: '#15803D',
      emptyColor: 'rgba(24,24,27,0.16)',
      heartColor: '#EA580C'
    });

    const subY = curY + tLayout.lines.length * tLayout.lineHeight + 28;
    ctx.font = `600 ${Math.round(22 * fs)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#57534E';
    ctx.textAlign = 'left';
    const sub = [state.episodeTitle ? state.episodeTitle.toUpperCase() : state.year, state.director ? `DIR. ${state.director.toUpperCase()}` : '', state.medium, state.runtime].filter(Boolean).join('  /  ');
    ctx.fillText(getWrappedLines(ctx, sub, artW, 1)[0] || '', pad, subY);
  });

  curY += titleBlockH + 20;
  ctx.fillStyle = 'rgba(24, 24, 27, 0.12)';
  ctx.fillRect(pad, curY, artW, 2);
  curY += 22;

  if (state.review || (state.showDetailedReview && state.detailedReview)) {
    const revPx = Math.round(35 * fs);
    ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
    const lines = state.review ? getWrappedLines(ctx, `“${state.review}”`, artW, 2) : [];
    const detPx = Math.round(22 * fs);
    ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
    const dLines = getDetailedReviewLines(ctx, state.detailedReview, artW, 2);
    const rH = lines.length * (revPx + 8) + dLines.length * (detPx + 6) + 18;

    drawMovableGroup(ctx, 'review', 'Polaroid Quote & Review', { x: pad, y: curY, w: artW, h: rH }, () => {
      let ry = curY;
      ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
      ctx.fillStyle = '#18181B';
      ctx.textAlign = 'left';
      lines.forEach((l) => {
        ry += revPx + 6;
        ctx.fillText(l, pad, ry);
      });
      if (dLines.length) {
        ry += 16;
        ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#44403C';
        dLines.forEach((dl) => {
          ry += detPx + 6;
          ctx.fillText(dl, pad, ry);
        });
      }
    });
    curY += rH + 16;
  }

  const archiveY = h - 135;
  // Left-aligned, slightly larger QR code positioned cleanly above the footer metadata thin line
  if (state.showQrCode) {
    const qrSize = 118;
    const qrY = archiveY - 36 - qrSize - 16;
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: pad, y: qrY, w: qrSize, h: qrSize }, () => {
      drawPosterQrCode(ctx, pad, qrY, qrSize, true);
    });
  }

  // Bottom Archive Cast & Date Strip below the thin line
  drawMovableGroup(ctx, 'credits', 'Polaroid Credits Strip', { x: pad, y: archiveY - 38, w: artW, h: 64 }, () => {
    ctx.fillStyle = 'rgba(24, 24, 27, 0.14)';
    ctx.fillRect(pad, archiveY - 36, artW, 1.5);
    ctx.font = `600 ${Math.round(20 * fs)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#44403C';
    ctx.textAlign = 'left';
    const castLine = state.cast ? `Featuring ${state.cast}` : (state.genre || '');
    ctx.fillText(getWrappedLines(ctx, castLine, artW, 1)[0] || '', pad, archiveY - 4);
    ctx.font = `600 ${Math.round(18 * fs)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#78716C';
    const metaLine = [state.genre ? state.genre.toUpperCase() : '', state.watchedDate ? `LOGGED ${formatSafeDate(state.watchedDate).toUpperCase()}` : ''].filter(Boolean).join('   ·   ');
    ctx.fillText(getWrappedLines(ctx, metaLine, artW, 1)[0] || '', pad, archiveY + 24);
  });

  drawFooterBrand(ctx, w / 2, h - 28, true);
}
