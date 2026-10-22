import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawMediumBadge,
  drawPaletteBar,
  drawProcessedBackdrop,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  getDetailedReviewLines,
  getWrappedLines
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';

export function renderClassicPoster(ctx, w, h) {
  const bgImg = state.backdropImg || state.posterImg;
  drawProcessedBackdrop(ctx, w, h, bgImg);

  const isCompact = h < 1500;
  const clampedArtScale = Math.min(1.18, Math.max(0.65, state.posterScale));
  const posterH = Math.round((isCompact ? h * 0.38 : h * 0.43) * clampedArtScale);
  const posterW = Math.round(posterH * (2 / 3));
  const posterX = Math.round((w - posterW) / 2);
  const posterY = Math.round(isCompact ? h * 0.05 : h * 0.065);

  drawMovableGroup(ctx, 'artwork', 'Poster Artwork', { x: posterX, y: posterY, w: posterW, h: posterH }, () => {
    if (state.posterImg) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
      ctx.shadowBlur = 52;
      ctx.shadowOffsetY = 24;
      drawRoundedRectPath(ctx, posterX, posterY, posterW, posterH, state.posterRadius);
      ctx.fillStyle = '#111';
      ctx.fill();
      ctx.clip();
      drawImageCover(ctx, state.posterImg, posterX, posterY, posterW, posterH);
      ctx.restore();

      ctx.save();
      drawRoundedRectPath(ctx, posterX, posterY, posterW, posterH, state.posterRadius);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  });

  const fs = Math.min(1.22, state.fontScale) * (isCompact ? 0.88 : 1.0);
  const gap = Math.round(28 * state.sectionSpacing * (isCompact ? 0.82 : 1.0));
  let curY = posterY + posterH + Math.round(42 * state.sectionSpacing);
  const cx = w / 2;
  const pad = 72;
  const maxW = w - pad * 2;

  const tLayout = computeAdaptiveTitleLayout(ctx, state.title, maxW, Math.round(56 * fs), '"Syne", sans-serif', '800', 2);
  const titleGroupH = tLayout.lines.length * tLayout.lineHeight + Math.round(50 * fs);

  drawMovableGroup(ctx, 'title', 'Title & Director', { x: pad, y: curY, w: maxW, h: titleGroupH }, () => {
    let ty = curY;
    ctx.font = `800 ${tLayout.fontPx}px "Syne", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    tLayout.lines.forEach(line => {
      ty += tLayout.fontPx;
      ctx.fillText(line, cx, ty);
      ty += 6;
    });
    const subLine = [state.year, state.director ? `Directed by ${state.director}` : '', state.runtime].filter(Boolean).join('  ·  ');
    if (subLine) {
      ty += Math.round(26 * fs);
      ctx.font = `600 ${Math.round(24 * fs)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#D1D5DB';
      ctx.fillText(getWrappedLines(ctx, subLine, maxW, 1)[0] || '', cx, ty);
    }
  });
  curY += titleGroupH + Math.round(gap * 0.65);

  if (state.rating > 0 || state.isLiked) {
    const starR = Math.round(25 * fs);
    drawMovableGroup(ctx, 'rating', 'Star Rating', { x: cx - 200, y: curY, w: 400, h: starR * 2 }, () => {
      drawRatingAndHeartRow(ctx, { x: cx, y: curY, rating: state.rating, isLiked: state.isLiked, starSize: starR, gap: Math.round(12 * fs), align: 'center', starColor: '#00E054' });
    });
    curY += starR * 2 + Math.round(gap * 0.85);
  }

  if (state.medium) {
    drawMovableGroup(ctx, 'medium', 'Format Badge', { x: cx - 105, y: curY, w: 210, h: 56 }, () => {
      drawMediumBadge(ctx, cx, curY, state.medium, false, fs * 0.96);
    });
    curY += Math.round(56 * fs) + Math.round(gap * 0.85);
  }

  if (state.review || (state.showDetailedReview && state.detailedReview)) {
    const revPx = Math.round(36 * fs);
    ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
    const rLines = state.review ? getWrappedLines(ctx, `“${state.review}”`, maxW - 20, 3) : [];
    const detPx = Math.round(23 * fs);
    ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
    const dLines = getDetailedReviewLines(ctx, state.detailedReview, maxW - 30, 3);
    const totalRevH = rLines.length * (revPx + 8) + (dLines.length ? dLines.length * (detPx + 7) + 22 : 0);

    drawMovableGroup(ctx, 'review', 'Review & Notes', { x: pad, y: curY, w: maxW, h: totalRevH }, () => {
      let ry = curY;
      if (rLines.length) {
        ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
        ctx.fillStyle = '#F9FAFB';
        ctx.textAlign = 'center';
        rLines.forEach((l) => {
          ry += revPx + 6;
          ctx.fillText(l, cx, ry);
        });
        ry += 18;
      }
      if (dLines.length) {
        ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#D1D5DB';
        ctx.textAlign = 'center';
        dLines.forEach((dl) => {
          ry += detPx + 6;
          ctx.fillText(dl, cx, ry);
        });
      }
    });
    curY += totalRevH + Math.round(gap * 0.85);
  }

  if (state.cast && curY < h - 220) {
    const castPx = Math.round(22 * fs);
    drawMovableGroup(ctx, 'cast', 'Starring Cast', { x: pad, y: curY, w: maxW, h: castPx + 14 }, () => {
      ctx.font = `500 ${castPx}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#9CA3AF';
      ctx.textAlign = 'center';
      ctx.fillText(getWrappedLines(ctx, `Starring ${state.cast}`, maxW, 1)[0] || '', cx, curY + castPx);
    });
    curY += castPx + Math.round(gap * 0.85);
  }

  if (curY < h - 140) {
    drawPaletteBar(ctx, cx, curY, 360, 16, false, false);
  }

  if (state.showQrCode) {
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: w - 168, y: h - 178, w: 108, h: 108 }, () => {
      drawPosterQrCode(ctx, w - 168, h - 178, 108, false);
    });
  }
  drawFooterBrand(ctx, w / 2, h - 28, false);
}
