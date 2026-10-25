import { state } from '../../state.js';
import { formatSafeDate } from '../../utils.js';
import {
  computeAdaptiveTitleLayout,
  drawDetailedReviewLine,
  drawFooterBrand,
  drawImageCover,
  drawProcessedBackdrop,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  getDetailedReviewLines,
  getWrappedLines
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';

export function renderTicketPoster(ctx, w, h) {
  const bgImg = state.backdropImg || state.posterImg;
  drawProcessedBackdrop(ctx, w, h, bgImg, Math.max(18, state.backdropBlur), Math.min(45, state.backdropBrightness));

  const marginX = 82;
  const marginY = h < 1500 ? 64 : 88;
  const ticketW = w - marginX * 2;
  const ticketH = h - marginY * 2 - 70;
  const tx = marginX, ty = marginY;
  const stubSplitY = ty + Math.round(ticketH * 0.77);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  drawRoundedRectPath(ctx, tx, ty, ticketW, ticketH, 28);
  ctx.fillStyle = '#F2EFE9';
  ctx.fill();
  ctx.restore();

  const drawNotch = (nx, ny, nr) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(nx, ny, nr, 0, Math.PI * 2);
    ctx.fillStyle = '#0D0F14';
    ctx.fill();
    ctx.restore();
  };
  drawNotch(tx, stubSplitY, 26);
  drawNotch(tx + ticketW, stubSplitY, 26);

  ctx.save();
  ctx.strokeStyle = '#A8A29E';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(tx + 36, stubSplitY);
  ctx.lineTo(tx + ticketW - 36, stubSplitY);
  ctx.stroke();
  ctx.restore();

  const innerPad = tx + 52;
  const innerW = ticketW - 104;
  const fs = Math.min(1.18, state.fontScale) * (h < 1500 ? 0.86 : 1.0);

  let curY = ty + 52;
  ctx.font = '700 21px "JetBrains Mono", monospace';
  ctx.fillStyle = '#57534E';
  ctx.textAlign = 'left';
  const topStubHeader = state.watchedAt ? `ADMIT ONE · ${state.watchedAt.toUpperCase()}` : 'ADMIT ONE · CINEMA DIARY STUB';
  ctx.fillText(getWrappedLines(ctx, topStubHeader, innerW * 0.72, 1)[0] || '', innerPad, curY);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#18181B';
  if (state.spine) {
    ctx.fillText(`NO. ${state.spine.replace('#', '')}`, tx + ticketW - 52, curY);
  }

  curY += 22;
  const artH = Math.round((h < 1500 ? ticketH * 0.28 : ticketH * 0.32) * Math.min(1.06, state.posterScale));
  const artImg = state.backdropImg || state.posterImg;
  drawMovableGroup(ctx, 'artwork', 'Ticket Artwork', { x: innerPad, y: curY, w: innerW, h: artH }, () => {
    if (artImg) {
      ctx.save();
      drawRoundedRectPath(ctx, innerPad, curY, innerW, artH, 14);
      ctx.clip();
      drawImageCover(ctx, artImg, innerPad, curY, innerW, artH);
      ctx.restore();
    }
  });

  curY += artH + 24;
  const tLayout = computeAdaptiveTitleLayout(ctx, state.title.toUpperCase(), innerW, Math.round(48 * fs), '"Syne", sans-serif', '800', 3);
  ctx.font = `800 ${tLayout.fontPx}px "Syne", sans-serif`;
  ctx.fillStyle = '#18181B';
  ctx.textAlign = 'left';
  tLayout.lines.forEach((line) => {
    curY += tLayout.fontPx;
    ctx.fillText(line, innerPad, curY);
    curY += 4;
  });

  curY += 22;
  const hasQr = Boolean(state.showQrCode);
  const qrSize = 114;
  const metaStartX = hasQr ? (innerPad + qrSize + 28) : innerPad;
  const metaAvailW = hasQr ? (innerW - qrSize - 28) : innerW;
  const colW = metaAvailW / 2;

  if (hasQr) {
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: innerPad, y: curY - 4, w: qrSize, h: qrSize }, () => {
      drawPosterQrCode(ctx, innerPad, curY - 4, qrSize, true);
    });
  }

  const drawStubCell = (lbl, val, xPos, yPos) => {
    ctx.font = `600 ${Math.round(15 * fs)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#78716C';
    ctx.textAlign = 'left';
    ctx.fillText(lbl, xPos, yPos);
    ctx.font = `700 ${Math.round(22 * fs)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#18181B';
    ctx.fillText(getWrappedLines(ctx, val || '—', colW - 14, 1)[0] || '—', xPos, yPos + 26);
  };
  drawStubCell('WATCHED AT', state.watchedAt || '—', metaStartX, curY + 10);
  if (state.episodeTitle) {
    drawStubCell('EPISODE', state.episodeTitle, metaStartX + colW, curY + 10);
  } else {
    drawStubCell('FORMAT / RUNTIME', [state.medium, state.runtime].filter(Boolean).join(' · ') || '—', metaStartX + colW, curY + 10);
  }
  drawStubCell('DATE LOGGED', formatSafeDate(state.watchedDate) || state.year || '—', metaStartX, curY + 72);
  drawStubCell(state.mediaType === 'tv' ? (state.episodeTitle ? 'EP. DIRECTOR' : 'CREATOR') : 'DIRECTOR', state.director || '—', metaStartX + colW, curY + 72);

  curY += 132;

  if ((state.review || (state.showDetailedReview && state.detailedReview)) && curY < stubSplitY - 28) {
    const revPx = Math.round(33 * fs);
    ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
    const lines = state.review ? getWrappedLines(ctx, `“${state.review}”`, innerW, 2) : [];
    ctx.fillStyle = '#18181B';
    ctx.textAlign = 'left';
    lines.forEach((l) => {
      if (curY + revPx < stubSplitY - 14) {
        curY += revPx + 4;
        ctx.fillText(l, innerPad, curY);
      }
    });
    const dLines = getDetailedReviewLines(ctx, state.detailedReview, innerW, 2);
    if (dLines.length > 0 && curY + 42 < stubSplitY - 14) {
      curY += 20; // Generous breathing room between punchline and extended review
      const detPx = Math.round(21 * fs);
      ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#44403C';
      dLines.forEach((dl) => {
        if (curY + detPx < stubSplitY - 12) {
          curY += detPx + 6;
          drawDetailedReviewLine(ctx, dl, innerPad, curY, { maxWidth: innerW });
        }
      });
    }
  }

  const stubY = stubSplitY + 34;
  drawRatingAndHeartRow(ctx, { x: innerPad + innerW / 2, y: stubY - 6, rating: state.rating, isLiked: state.isLiked, starSize: Math.round(24 * fs), gap: 12, align: 'center', starColor: '#18181B', emptyColor: 'rgba(24,24,27,0.18)', heartColor: '#EA580C' });

  const barTop = stubY + Math.round(54 * fs);
  const barH = 66;
  let bx = innerPad;
  const seedStr = `${state.title}-${state.watchedAt}-${state.medium}-${state.rating}-${state.username}`;
  let idx = 0;
  ctx.fillStyle = '#18181B';
  while (bx < innerPad + innerW - 8) {
    const code = seedStr.charCodeAt(idx % seedStr.length);
    const lineW = (code % 3 === 0) ? 6 : (code % 2 === 0 ? 3 : 2);
    const gapW = ((code >> 2) % 3) + 2;
    if (bx + lineW <= innerPad + innerW) ctx.fillRect(bx, barTop, lineW, barH);
    bx += lineW + gapW;
    idx++;
  }

  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillStyle = '#57534E';
  ctx.textAlign = 'center';
  const serialLine = [state.year, state.genre ? state.genre.toUpperCase() : '', `${(state.rating || 0).toFixed(1)} ★`].filter(Boolean).join('   ·   ');
  ctx.fillText(getWrappedLines(ctx, serialLine, innerW, 1)[0] || '', innerPad + innerW / 2, barTop + barH + 30);

  drawFooterBrand(ctx, w / 2, h - 22, false);
}
