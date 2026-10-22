import { state } from '../../state.js';
import { buildRelevantMovieReview } from '../../utils.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawRatingAndHeartRow,
  drawRoundedRectPath,
  getDetailedReviewLines,
  getReadableTextColor,
  getWrappedLines
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';

export function renderFloatingTicketPoster(ctx, w, h) {
  const bgImg = state.posterImg || state.backdropImg;
  const ticketArtImg = state.backdropImg || state.posterImg;

  ctx.save();
  ctx.fillStyle = '#07080B';
  ctx.fillRect(0, 0, w, h);
  if (bgImg) {
    ctx.filter = `brightness(${Math.min(95, state.backdropBrightness + 20)}%) contrast(106%)`;
    drawImageCover(ctx, bgImg, 0, 0, w, h * 0.78);
    ctx.filter = 'none';
  }
  const topVig = ctx.createLinearGradient(0, 0, 0, h * 0.28);
  topVig.addColorStop(0, 'rgba(5, 6, 9, 0.78)');
  topVig.addColorStop(1, 'rgba(5, 6, 9, 0)');
  ctx.fillStyle = topVig;
  ctx.fillRect(0, 0, w, h * 0.28);

  const botVig = ctx.createLinearGradient(0, h * 0.36, 0, h);
  botVig.addColorStop(0, 'rgba(5, 6, 9, 0)');
  botVig.addColorStop(0.45, 'rgba(5, 6, 9, 0.82)');
  botVig.addColorStop(0.75, 'rgba(5, 6, 9, 0.96)');
  botVig.addColorStop(1, '#050609');
  ctx.fillStyle = botVig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  const fs = Math.min(1.18, state.fontScale) * (h < 1500 ? 0.88 : 1.0);
  const cx = w / 2;

  drawMovableGroup(ctx, 'title', 'Top Movie Header', { x: 80, y: 54, w: w - 160, h: 210 }, () => {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `600 ${Math.round(18 * fs)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const dirHeader = state.director
      ? `A ${state.director.toUpperCase()} ${state.mediaType === 'tv' ? 'SERIES' : 'FILM'}`
      : `FEATURE PRESENTATION · ${state.year}`;
    ctx.fillText(dirHeader, cx, 84);

    if (state.useLogoImage && state.logoImg) {
      const maxLW = Math.round(620 * Math.min(1.15, state.posterScale));
      const maxLH = Math.round(135 * Math.min(1.15, state.posterScale));
      const ratio = Math.min(maxLW / state.logoImg.width, maxLH / state.logoImg.height);
      const lw = Math.round(state.logoImg.width * ratio);
      const lh = Math.round(state.logoImg.height * ratio);
      ctx.drawImage(state.logoImg, cx - lw / 2, 108, lw, lh);
    } else {
      const tLayout = computeAdaptiveTitleLayout(ctx, state.title.toUpperCase(), w - 140, Math.round(66 * fs), '"Instrument Serif", serif', '400', 2);
      ctx.font = `400 ${tLayout.fontPx}px "Instrument Serif", serif`;
      ctx.fillStyle = '#FFFFFF';
      tLayout.lines.forEach((line, idx) => {
        ctx.fillText(line, cx, 154 + idx * (tLayout.fontPx - 4));
      });
    }
    ctx.restore();
  });

  const ticketW = Math.round((w - 116) * Math.min(1.06, state.posterScale));
  const ticketH = Math.round(h < 1500 ? 360 : 410);
  const ticketY = Math.round(h * 0.43);

  drawMovableGroup(ctx, 'artwork', 'Floating Vintage Ticket', { x: cx - ticketW / 2, y: ticketY, w: ticketW, h: ticketH }, () => {
    ctx.save();
    ctx.translate(cx, ticketY + ticketH / 2);
    ctx.rotate(-5.5 * Math.PI / 180);

    const tx = -ticketW / 2;
    const ty = -ticketH / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.88)';
    ctx.shadowBlur = 55;
    ctx.shadowOffsetY = 28;
    drawRoundedRectPath(ctx, tx, ty, ticketW, ticketH, 16);
    ctx.fillStyle = '#E8DFCA';
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(40, 32, 24, 0.25)';
    ctx.lineWidth = 2;
    drawRoundedRectPath(ctx, tx + 6, ty + 6, ticketW - 12, ticketH - 12, 12);
    ctx.stroke();

    const stubLeftW = Math.round(ticketW * 0.13);
    const stubColor = state.palette[0] || '#6E260E';
    const stubTextCol = getReadableTextColor(stubColor);
    ctx.save();
    drawRoundedRectPath(ctx, tx + 14, ty + 14, stubLeftW - 14, ticketH - 28, 8);
    ctx.fillStyle = stubColor;
    ctx.fill();

    ctx.translate(tx + stubLeftW / 2 + 4, 0);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '700 22px "Instrument Serif", serif';
    ctx.fillStyle = stubTextCol;
    ctx.textAlign = 'center';
    ctx.fillText('A D M I T   O N E', 0, 6);
    ctx.restore();

    const mainX = tx + stubLeftW + 22;
    const mainW = Math.round(ticketW * 0.50);
    ctx.textAlign = 'center';
    const mainCx = mainX + mainW / 2;

    const ticketTLayout = computeAdaptiveTitleLayout(ctx, state.title.toUpperCase(), mainW - 10, Math.round(34 * fs), '"Instrument Serif", serif', '700', 1);
    ctx.font = `700 ${ticketTLayout.fontPx}px "Instrument Serif", serif`;
    ctx.fillStyle = '#1C1917';
    ctx.fillText(ticketTLayout.lines[0] || '', mainCx, ty + 60);

    const insetW = mainW - 12;
    const insetH = ticketH - 135;
    const insetX = mainX + 6;
    const insetY = ty + 78;
    if (ticketArtImg) {
      ctx.save();
      drawRoundedRectPath(ctx, insetX, insetY, insetW, insetH, 8);
      ctx.clip();
      drawImageCover(ctx, ticketArtImg, insetX, insetY, insetW, insetH);
      ctx.restore();
    }

    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#57534E';
    const creditCaption = state.watchedAt
      ? `SCREENED AT ${state.watchedAt.toUpperCase()}`
      : (state.director ? `A ${state.director.toUpperCase()} FILM` : state.year);
    ctx.fillText(getWrappedLines(ctx, creditCaption, mainW, 1)[0] || '', mainCx, ty + ticketH - 22);

    const divX = mainX + mainW + 16;
    ctx.save();
    ctx.strokeStyle = 'rgba(28, 25, 23, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(divX, ty + 18);
    ctx.lineTo(divX, ty + ticketH - 18);
    ctx.stroke();
    ctx.restore();

    const metaX = divX + 20;
    const metaW = Math.round(ticketW * 0.19);
    ctx.textAlign = 'left';
    ctx.font = '700 28px "Instrument Serif", serif';
    ctx.fillStyle = '#1C1917';
    ctx.fillText((state.year || '2026').substring(0, 4), metaX, ty + 66);

    ctx.fillStyle = 'rgba(28,25,23,0.25)';
    ctx.fillRect(metaX, ty + 82, metaW - 16, 1.5);

    ctx.font = '700 15px "JetBrains Mono", monospace';
    ctx.fillStyle = '#292524';
    const genreParts = (state.genre || 'Cinema | Feature').split('|').map(s => s.trim().toUpperCase()).slice(0, 3);
    genreParts.forEach((g, idx) => {
      ctx.fillText(getWrappedLines(ctx, g, metaW - 10, 1)[0] || '', metaX, ty + 118 + idx * 28);
    });

    ctx.fillStyle = 'rgba(28,25,23,0.25)';
    ctx.fillRect(metaX, ty + ticketH - 96, metaW - 16, 1.5);

    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.fillStyle = '#1C1917';
    ctx.fillText(state.medium || state.runtime || '2h 15m', metaX, ty + ticketH - 58);

    const barX = tx + ticketW - 74;
    const barTop = ty + 28;
    const barBottom = ty + ticketH - 28;
    let curBarY = barTop;
    const seed = `${state.title}-${state.year}-${state.director}`;
    let bIdx = 0;
    ctx.fillStyle = '#1C1917';
    while (curBarY < barBottom - 6) {
      const code = seed.charCodeAt(bIdx % seed.length);
      const bh = (code % 3 === 0) ? 5 : (code % 2 === 0 ? 3 : 2);
      const bgap = ((code >> 1) % 3) + 2;
      ctx.fillRect(barX, curBarY, 44, bh);
      curBarY += bh + bgap;
      bIdx++;
    }

    [-0.32, 0, 0.32].forEach(offset => {
      const ny = offset * ticketH;
      ctx.fillStyle = '#07080B';
      ctx.beginPath();
      ctx.arc(tx, ny, 14, 0, Math.PI * 2);
      ctx.arc(tx + ticketW, ny, 14, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  });

  let botY = ticketY + ticketH + (h < 1500 ? 22 : 36);
  if (state.rating > 0 || state.isLiked) {
    const starR = Math.round(23 * fs);
    drawMovableGroup(ctx, 'rating', 'Gold Rating & Score', { x: cx - 260, y: botY, w: 520, h: starR * 2 + 16 }, () => {
      drawRatingAndHeartRow(ctx, {
        x: cx - 85,
        y: botY + 6,
        rating: state.rating,
        isLiked: state.isLiked,
        starSize: starR,
        gap: 10,
        align: 'center',
        starColor: '#FBBF24',
        emptyColor: 'rgba(251, 191, 36, 0.25)',
        heartColor: '#F97316'
      });

      ctx.font = `400 ${Math.round(62 * fs)}px "Instrument Serif", serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      const scoreStr = `${Number.isInteger(state.rating) ? state.rating : state.rating.toFixed(1)}/5`;
      ctx.fillText(scoreStr, cx + 115, botY + starR * 1.85);
    });
    botY += starR * 2 + (h < 1500 ? 18 : 26);
  }

  const activeQuote = state.review || buildRelevantMovieReview(state.title, state.director, state.cast, state.genre, state.mediaType);
  const quoteMaxW = w - 150;
  if (activeQuote || (state.showDetailedReview && state.detailedReview)) {
    const revPx = Math.round(35 * fs);
    ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
    const qLines = activeQuote ? getWrappedLines(ctx, `“${activeQuote}”`, quoteMaxW, 2) : [];
    const detPx = Math.round(21 * fs);
    ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
    const dLines = getDetailedReviewLines(ctx, state.detailedReview, quoteMaxW, 2);
    const rH = qLines.length * (revPx + 8) + dLines.length * (detPx + 6) + 16;

    drawMovableGroup(ctx, 'review', 'Review & Notes', { x: (w - quoteMaxW) / 2, y: botY, w: quoteMaxW, h: rH }, () => {
      let ry = botY;
      ctx.font = `italic ${revPx}px "Instrument Serif", serif`;
      ctx.fillStyle = '#F9FAFB';
      ctx.textAlign = 'center';
      qLines.forEach((line) => {
        ry += revPx + 6;
        ctx.fillText(line, cx, ry);
      });
      if (dLines.length) {
        ry += 14;
        ctx.font = `400 ${detPx}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#D1D5DB';
        dLines.forEach((dl) => {
          ry += detPx + 5;
          ctx.fillText(dl, cx, ry);
        });
      }
    });
    botY += rH + 18;
  }

  if (state.showQrCode) {
    const qrSize = 116;
    const qrX = Math.round(cx - qrSize / 2);
    const qrY = Math.min(botY + 6, h - 245);
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: qrX, y: qrY, w: qrSize, h: qrSize }, () => {
      drawPosterQrCode(ctx, qrX, qrY, qrSize, false);
    });
  }

  const stripY = h - 102;
  ctx.save();
  ctx.font = `600 ${Math.round(19 * fs)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#9CA3AF';
  ctx.textAlign = 'center';
  const metaStrip = [
    state.year ? state.year.toUpperCase() : '',
    state.genre ? state.genre.toUpperCase() : '',
    (state.runtime || state.medium) ? [state.runtime, state.medium].filter(Boolean).join(' · ').toUpperCase() : ''
  ].filter(Boolean).join('     •     ');
  ctx.fillText(getWrappedLines(ctx, metaStrip, w - 100, 1)[0] || '', cx, stripY);
  ctx.restore();

  drawFooterBrand(ctx, cx, h - 22, false);
}
