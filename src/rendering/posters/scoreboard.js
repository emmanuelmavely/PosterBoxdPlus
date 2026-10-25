import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawDetailedReviewLine,
  drawImageCover,
  drawPaletteBar,
  drawProcessedBackdrop,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  ensureVisibleAccentOnDark,
  getDetailedReviewLines,
  getWrappedLines
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';

export function renderScoreboardPoster(ctx, w, h) {
  const bgImg = state.backdropImg || state.posterImg;
  drawProcessedBackdrop(ctx, w, h, bgImg, Math.max(8, state.backdropBlur), Math.min(55, state.backdropBrightness));

  const pad = 76;
  const innerW = w - pad * 2;
  const fs = Math.min(1.2, state.fontScale) * (h < 1500 ? 0.88 : 1.0);

  const thumbW = 220;
  const thumbH = 330;
  const topY = 96;

  drawMovableGroup(ctx, 'artwork', 'Poster Thumbnail', { x: pad, y: topY, w: thumbW, h: thumbH }, () => {
    if (state.posterImg) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = 36;
      drawRoundedRectPath(ctx, pad, topY, thumbW, thumbH, 18);
      ctx.clip();
      drawImageCover(ctx, state.posterImg, pad, topY, thumbW, thumbH);
      ctx.restore();
    }
  });

  const metaX = pad + thumbW + 42;
  const metaW = w - metaX - pad;
  drawMovableGroup(ctx, 'title', 'Header Metadata', { x: metaX, y: topY, w: metaW, h: thumbH }, () => {
    let my = topY + 28;
    ctx.font = `700 ${Math.round(21 * fs)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = ensureVisibleAccentOnDark(state.palette[0] || state.palette[2], '#00E054');
    ctx.textAlign = 'left';
    const topSpecs = [state.episodeTitle || state.year, state.medium, state.runtime].filter(Boolean).join('  ·  ').toUpperCase();
    if (topSpecs) {
      ctx.fillText(getWrappedLines(ctx, topSpecs, metaW, 1)[0] || '', metaX, my);
    }

    const tLayout = computeAdaptiveTitleLayout(ctx, state.title, metaW, Math.round(54 * fs), '"Syne", sans-serif', '800', 2);
    ctx.font = `800 ${tLayout.fontPx}px "Syne", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    tLayout.lines.forEach((l) => {
      my += tLayout.fontPx + 6;
      ctx.fillText(l, metaX, my);
    });

    if (state.director) {
      my += Math.round(34 * fs);
      ctx.font = `600 ${Math.round(25 * fs)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#E5E7EB';
      const creditLabel = state.mediaType === 'tv'
        ? (state.episodeTitle ? 'Episode Director' : 'Created by')
        : 'Directed by';
      ctx.fillText(`${creditLabel} ${state.director}`, metaX, my);
    }

    if (state.genre) {
      my += Math.round(32 * fs);
      ctx.font = `600 ${Math.round(20 * fs)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText(getWrappedLines(ctx, state.genre.toUpperCase(), metaW, 1)[0] || '', metaX, my);
    }

    if (state.cast) {
      my += Math.round(30 * fs);
      ctx.font = `500 ${Math.round(22 * fs)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#D1D5DB';
      const cLines = getWrappedLines(ctx, `Starring: ${state.cast}`, metaW, 2);
      cLines.forEach((cl) => {
        ctx.fillText(cl, metaX, my);
        my += Math.round(28 * fs);
      });
    }
  });

  // Lock Rating Block at EXACT DEAD CENTER of the canvas (w / 2, h / 2)
  const bigScore = (state.rating || 0).toFixed(1);
  const scorePx = Math.round(205 * fs);
  const starR = Math.round(28 * fs);
  const totalScoreBlockH = Math.round(scorePx * 0.85) + 24 + starR * 2;
  const centerBlockTopY = Math.round(h / 2 - totalScoreBlockH / 2);

  drawMovableGroup(ctx, 'rating', 'Giant Scoreboard', { x: pad, y: centerBlockTopY, w: innerW, h: totalScoreBlockH }, () => {
    ctx.save();
    ctx.font = `800 ${scorePx}px "Syne", sans-serif`;
    ctx.fillStyle = '#00E054';
    ctx.textAlign = 'center';
    ctx.fillText(bigScore, w / 2, centerBlockTopY + Math.round(scorePx * 0.78));

    drawRatingAndHeartRow(ctx, {
      x: w / 2,
      y: centerBlockTopY + Math.round(scorePx * 0.85) + 16,
      rating: state.rating,
      isLiked: state.isLiked,
      starSize: starR,
      gap: 14,
      align: 'center',
      starColor: '#00E054'
    });
    ctx.restore();
  });

  const quoteY = centerBlockTopY + totalScoreBlockH + Math.round(58 * fs);
  const quoteText = state.review || '';
  const revPx = Math.round(42 * fs);
  ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
  const qLines = quoteText ? getWrappedLines(ctx, `“${quoteText}”`, innerW, 3) : [];
  const detPx = Math.round(23 * fs);
  ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
  const dLines = getDetailedReviewLines(ctx, state.detailedReview, innerW - 30, 3);
  const hasReviewBlock = qLines.length > 0 || dLines.length > 0;
  const revBlockH = hasReviewBlock ? qLines.length * (revPx + 10) + dLines.length * (detPx + 8) + 24 : 0;

  if (hasReviewBlock) {
    drawMovableGroup(ctx, 'review', 'Headline & Detailed Review', { x: pad, y: quoteY, w: innerW, h: revBlockH }, () => {
      let ry = quoteY;
      ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      qLines.forEach((l) => {
        ry += revPx + 8;
        ctx.fillText(l, w / 2, ry);
      });
      if (dLines.length) {
        ry += 20;
        ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#D1D5DB';
        dLines.forEach((dl) => {
          ry += detPx + 6;
          drawDetailedReviewLine(ctx, dl, w / 2, ry, { align: 'center' });
        });
      }
    });
  }

  const bottomSpecY = h - 140;
  if (quoteY + revBlockH < bottomSpecY - 30) {
    drawPaletteBar(ctx, w / 2, bottomSpecY, 340, 14, false, false);
  }

  if (state.showQrCode) {
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: w - pad - 112, y: h - 196, w: 112, h: 112 }, () => {
      drawPosterQrCode(ctx, w - pad - 112, h - 196, 112, false);
    });
  }

  drawFooterBrand(ctx, w / 2, h - 28, false);
}
