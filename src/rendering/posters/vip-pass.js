import { state } from '../../state.js';
import { formatSafeDate } from '../../utils.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawProcessedBackdrop,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  ensureVisibleAccentOnDark,
  getDetailedReviewLines,
  getReadableTextColor,
  getWrappedLines
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';

export function renderVipPassPoster(ctx, w, h) {
  const mainBackdrop = state.backdropImg || state.posterImg;
  drawProcessedBackdrop(ctx, w, h, mainBackdrop, Math.max(12, state.backdropBlur - 4), Math.min(55, state.backdropBrightness));

  const passW = w - 150;
  const passH = h - 210;
  const px = 75, py = 72;
  const cx = w / 2;

  const rawAccent = state.palette[0] || '#00E054';
  const borderAccent = ensureVisibleAccentOnDark(rawAccent, '#00E054');
  const bandTextColor = getReadableTextColor(rawAccent);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 55;
  ctx.shadowOffsetY = 24;
  drawRoundedRectPath(ctx, px, py, passW, passH, 36);
  ctx.fillStyle = '#12151C';
  ctx.fill();
  ctx.clip();

  // Subtle atmospheric Background Still inside the VIP Pass body itself
  if (mainBackdrop) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.filter = 'blur(8px) contrast(115%)';
    drawImageCover(ctx, mainBackdrop, px, py, passW, passH, 0, 0);
    ctx.restore();
  }
  ctx.restore();

  ctx.save();
  drawRoundedRectPath(ctx, px, py, passW, passH, 36);
  ctx.lineWidth = 3;
  ctx.strokeStyle = borderAccent;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  drawRoundedRectPath(ctx, cx - 70, py + 26, 140, 22, 11);
  ctx.fillStyle = '#07080A';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = rawAccent;
  ctx.fillRect(px + 2, py + 72, passW - 4, 56);
  ctx.font = '800 22px "JetBrains Mono", monospace';
  ctx.fillStyle = bandTextColor;
  ctx.textAlign = 'center';
  const credHead = state.medium ? `OFFICIAL SCREENING CREDENTIAL · ${state.medium}` : 'OFFICIAL SCREENING CREDENTIAL';
  ctx.fillText(credHead, cx, py + 108);
  ctx.restore();

  const fs = Math.min(1.18, state.fontScale) * (h < 1500 ? 0.86 : 1.0);
  const innerPad = px + 48;
  const innerW = passW - 96;
  let curY = py + 154;

  const artH = Math.round((h < 1500 ? passH * 0.35 : passH * 0.39) * Math.min(1.08, state.posterScale));
  // Explicitly prioritize Background Still / Backdrop as the hero image in VIP Pass
  const artImg = state.backdropImg || state.posterImg;
  drawMovableGroup(ctx, 'artwork', 'Credential Backdrop Still', { x: innerPad, y: curY, w: innerW, h: artH }, () => {
    if (artImg) {
      ctx.save();
      drawRoundedRectPath(ctx, innerPad, curY, innerW, artH, 18);
      ctx.clip();
      drawImageCover(ctx, artImg, innerPad, curY, innerW, artH);
      ctx.restore();
    }
  });

  curY += artH + 34;
  const yearText = state.year ? ` (${state.year})` : '';
  const tLayout = computeAdaptiveTitleLayout(ctx, state.title.toUpperCase(), innerW - 120, Math.round(48 * fs), '"Syne", sans-serif', '800', 2);
  const titleGroupH = tLayout.lines.length * tLayout.lineHeight + 38;

  drawMovableGroup(ctx, 'title', 'VIP Title & Year', { x: innerPad, y: curY, w: innerW, h: titleGroupH }, () => {
    ctx.textAlign = 'left';
    tLayout.lines.forEach((line, idx) => {
      const lineY = curY + (idx + 1) * tLayout.fontPx + idx * 4;
      ctx.font = `800 ${tLayout.fontPx}px "Syne", sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(line, innerPad, lineY);

      if (idx === tLayout.lines.length - 1 && yearText) {
        const titleW = ctx.measureText(line).width;
        ctx.font = `600 ${Math.round(tLayout.fontPx * 0.58)}px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(229, 231, 235, 0.68)';
        ctx.fillText(yearText, innerPad + titleW + 8, lineY - 2);
      }
    });

    const credit = state.mediaType === 'tv'
      ? (state.episodeTitle ? state.episodeTitle.toUpperCase() : (state.director ? `CREATED BY ${state.director.toUpperCase()}` : ''))
      : (state.director ? `DIR. ${state.director.toUpperCase()}` : '');
    const subCred = [credit, state.runtime, state.genre ? state.genre.toUpperCase() : ''].filter(Boolean).join('  ·  ');
    if (subCred) {
      ctx.font = `600 ${Math.round(20 * fs)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText(getWrappedLines(ctx, subCred, innerW, 1)[0] || '', innerPad, curY + tLayout.lines.length * tLayout.lineHeight + 30);
    }
  });

  curY += titleGroupH + 22;
  drawRatingAndHeartRow(ctx, { x: innerPad, y: curY, rating: state.rating, isLiked: state.isLiked, starSize: Math.round(24 * fs), gap: 12, align: 'left', starColor: '#00E054' });
  curY += Math.round(64 * fs);

  const hasQr = Boolean(state.showQrCode);
  const textMaxW = hasQr ? innerW - 125 : innerW;
  if (state.review || (state.showDetailedReview && state.detailedReview)) {
    const revPx = Math.round(35 * fs);
    ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
    const lines = state.review ? getWrappedLines(ctx, `“${state.review}”`, textMaxW, 3) : [];
    const detPx = Math.round(22 * fs);
    ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
    const dLines = getDetailedReviewLines(ctx, state.detailedReview, textMaxW, 3);
    const rH = lines.length * (revPx + 8) + dLines.length * (detPx + 6) + 20;

    drawMovableGroup(ctx, 'review', 'VIP Review Quote', { x: innerPad, y: curY, w: textMaxW, h: rH }, () => {
      let ry = curY;
      ctx.textAlign = 'left';
      ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
      ctx.fillStyle = '#F3F4F6';
      lines.forEach((l) => {
        ry += revPx + 6;
        ctx.fillText(l, innerPad, ry);
      });
      if (dLines.length) {
        ry += 16;
        ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#D1D5DB';
        dLines.forEach((dl) => {
          if (ry + detPx < py + passH - 96) {
            ry += detPx + 6;
            ctx.fillText(dl, innerPad, ry);
          }
        });
      }
    });
    curY += rH + 22;
  }

  if (state.cast && curY < py + passH - 125) {
    ctx.font = `500 ${Math.round(21 * fs)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#9CA3AF';
    ctx.textAlign = 'left';
    ctx.fillText(getWrappedLines(ctx, `Starring: ${state.cast}`, textMaxW, 1)[0] || '', innerPad, curY + 20);
  }

  if (hasQr) {
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: px + passW - 148, y: py + passH - 205, w: 104, h: 104 }, () => {
      drawPosterQrCode(ctx, px + passW - 148, py + passH - 205, 104, false);
    });
  }

  const metaY = py + passH - 64;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(innerPad, metaY - 28, innerW, 1.5);
  const venueVal = state.watchedAt || state.medium;
  if (venueVal) {
    ctx.fillText(`VENUE: ${venueVal.toUpperCase()}`, innerPad, metaY + 8);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = borderAccent;
  const dateVal = formatSafeDate(state.watchedDate) || state.year;
  if (dateVal) {
    ctx.fillText(`DATE: ${dateVal}`, px + passW - 48, metaY + 8);
  }

  drawFooterBrand(ctx, w / 2, h - 22, false);
}
