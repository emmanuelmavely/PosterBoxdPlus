import { state } from '../../state.js';
import {
  drawDetailedReviewLine,
  drawFooterBrand,
  drawImageCover,
  drawRoundedRectPath,
  drawVectorHeart,
  getDetailedReviewLines
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';
import {
  desaturateRect,
  drawDashedRule,
  drawSeededBarcode,
  fitSingleLine,
  fitTextBlock,
  getHandle,
  getLoggedDate,
  getScoreText,
  getStudioFrame
} from './studio-shared.js';

const PAPER = '#F2EFE9';
const INK = '#111115';
const MUTED = 'rgba(17, 17, 21, 0.62)';
const RULE = 'rgba(17, 17, 21, 0.34)';
const MONO = '"JetBrains Mono", monospace';

// Thermal till receipt: monochrome still, itemised credits, verdict box, barcode.
export function renderReceiptPoster(ctx, w, h) {
  const frame = getStudioFrame(w, h);
  const { fs, top, isSquare, isCompact } = frame;
  const pad = 72;
  const innerW = w - pad * 2;
  const cx = w / 2;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  // Header
  let y = top + (isSquare ? 54 : 70);
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `700 ${Math.round(30 * fs)}px ${MONO}`;
  ctx.fillText('P O S T E R B O X D   R E C E I P T', cx, y);
  y += Math.round(34 * fs);
  ctx.font = `500 ${Math.round(21 * fs)}px ${MONO}`;
  ctx.fillStyle = MUTED;
  const orderLine = [state.tmdbId ? `ORDER #${state.tmdbId}` : 'ORDER #0001', getLoggedDate(), state.medium].filter(Boolean).join('  •  ');
  ctx.fillText(fitSingleLine(ctx, orderLine, innerW), cx, y);
  y += 22;
  drawDashedRule(ctx, pad, w - pad, y, RULE, 3);
  y += isSquare ? 20 : 30;

  // Monochrome 16:9 still
  const stillH = Math.round(Math.min(innerW * 9 / 16, h * (isSquare ? 0.26 : (isCompact ? 0.30 : 0.29))) * Math.min(1.1, Math.max(0.7, state.posterScale)));
  const stillImg = state.backdropImg || state.posterImg;
  const stillY = y;
  drawMovableGroup(ctx, 'artwork', 'Receipt Still', { x: pad, y: stillY, w: innerW, h: stillH }, () => {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(pad, stillY, innerW, stillH);
    if (stillImg) {
      ctx.beginPath();
      ctx.rect(pad, stillY, innerW, stillH);
      ctx.clip();
      drawImageCover(ctx, stillImg, pad, stillY, innerW, stillH);
      desaturateRect(ctx, pad, stillY, innerW, stillH);
    }
    ctx.restore();
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, stillY, innerW, stillH);
  });
  y += stillH + (isSquare ? 34 : 46);

  // Itemised rows
  const itemPx = Math.round(30 * fs);
  const rowPx = Math.round(22 * fs);
  ctx.textAlign = 'right';
  ctx.font = `700 ${itemPx}px ${MONO}`;
  ctx.fillStyle = INK;
  const priceText = state.mediaType === 'tv' ? 'SERIES' : 'ADMIT 1';
  ctx.fillText(priceText, w - pad, y);
  const priceW = ctx.measureText(priceText).width;
  ctx.textAlign = 'left';
  const itemLine = `1x ${String(state.title || 'UNTITLED').toUpperCase()}${state.year ? ` (${state.year})` : ''}`;
  ctx.fillText(fitSingleLine(ctx, itemLine, innerW - priceW - 30), pad, y);

  const rows = [
    state.episodeTitle ? ['EPISODE:', state.episodeTitle] : null,
    state.director ? [state.mediaType === 'tv' ? 'CREATOR:' : 'DIRECTOR:', state.director] : null,
    (state.runtime || state.genre) ? ['RUNTIME / GENRE:', [state.runtime, state.genre].filter(Boolean).join(' • ')] : null,
    state.watchedAt ? ['VENUE:', state.watchedAt] : null,
    (!isSquare && state.cast) ? ['CAST:', state.cast] : null
  ].filter(Boolean).slice(0, isSquare ? 2 : 5);

  ctx.font = `500 ${rowPx}px ${MONO}`;
  rows.forEach(([label, value]) => {
    y += rowPx + 14;
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'left';
    ctx.fillText(label, pad, y);
    const labelW = ctx.measureText(label).width;
    ctx.fillStyle = INK;
    ctx.textAlign = 'right';
    ctx.fillText(fitSingleLine(ctx, String(value).toUpperCase(), innerW - labelW - 30), w - pad, y);
  });
  y += 26;
  drawDashedRule(ctx, pad, w - pad, y, RULE, 2);
  const quoteAreaTop = y + 10;

  // Bottom stack, anchored upwards from the footer brand.
  const barcodeH = Math.round((isSquare ? 44 : 78) * fs);
  const barcodeY = frame.contentBottom - barcodeH;
  const verdictH = Math.round((isSquare ? 92 : 118) * fs);
  const verdictY = barcodeY - 26 - verdictH;
  const score = getScoreText();

  drawMovableGroup(ctx, 'rating', 'Verdict Box', { x: pad, y: verdictY, w: innerW, h: verdictH }, () => {
    drawRoundedRectPath(ctx, pad, verdictY, innerW, verdictH, 10);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(242, 239, 233, 0.72)';
    ctx.font = `500 ${Math.round(19 * fs)}px ${MONO}`;
    ctx.fillText('YOUR CRITIC VERDICT', pad + 28, verdictY + verdictH * 0.40);
    ctx.fillStyle = PAPER;
    ctx.font = `700 ${Math.round(30 * fs)}px ${MONO}`;
    ctx.fillText(fitSingleLine(ctx, getHandle(), innerW * 0.5), pad + 28, verdictY + verdictH * 0.40 + Math.round(38 * fs));

    const bigPx = Math.round(42 * fs);
    const heartSpace = state.isLiked ? bigPx + 16 : 0;
    ctx.textAlign = 'right';
    ctx.font = `700 ${bigPx}px ${MONO}`;
    const scoreLine = score ? `${score} / 5.0 ★` : (state.isLiked ? 'LIKED' : 'UNRATED');
    ctx.fillText(scoreLine, w - pad - 28 - heartSpace, verdictY + verdictH / 2 + bigPx * 0.34);
    if (state.isLiked) drawVectorHeart(ctx, w - pad - 28 - bigPx / 2, verdictY + verdictH / 2 + 2, bigPx * 0.95, '#FF8000');
  });

  drawSeededBarcode(ctx, pad, barcodeY, innerW, barcodeH, INK);

  // Critic dispatch, centred in the space that is left.
  const quoteAreaBottom = verdictY - 22;
  const areaH = quoteAreaBottom - quoteAreaTop;
  const labelPx = Math.round(20 * fs);
  const qrSize = state.showQrCode && areaH > 230 ? 104 : 0;
  const textW = innerW - (qrSize ? qrSize + 30 : 0);
  if (areaH > labelPx + 50) {
    const quote = state.review ? `“${state.review}”` : '';
    const basePx = Math.round((quote.length > 120 ? 34 : 42) * fs);
    const roomForQuote = areaH - labelPx - 34;
    const maxLines = Math.max(1, Math.min(7, Math.floor(roomForQuote / (basePx * 1.28))));
    const fit = quote
      ? fitTextBlock(ctx, quote, textW, maxLines, basePx, Math.round(24 * fs), (px) => `700 ${px}px ${MONO}`)
      : { px: 0, lines: [], lineHeight: 0 };
    const detPx = Math.round(21 * fs);
    const usedByQuote = labelPx + 18 + fit.lines.length * fit.lineHeight;
    const detRoom = areaH - usedByQuote - 30;
    ctx.font = `500 ${detPx}px ${MONO}`;
    const dLines = detRoom > detPx + 8
      ? getDetailedReviewLines(ctx, state.detailedReview, textW, Math.floor(detRoom / (detPx + 8)))
      : [];
    const blockH = usedByQuote + (dLines.length ? dLines.length * (detPx + 8) + 16 : 0);
    const blockY = Math.round(quoteAreaTop + Math.max(12, (areaH - blockH) / 2));

    if (fit.lines.length || dLines.length) {
      drawMovableGroup(ctx, 'review', 'Critic Dispatch', { x: pad, y: blockY, w: innerW, h: blockH }, () => {
        let ty = blockY + labelPx;
        ctx.textAlign = 'left';
        ctx.fillStyle = MUTED;
        ctx.font = `600 ${labelPx}px ${MONO}`;
        ctx.fillText(fitSingleLine(ctx, `CRITIC DISPATCH (${getHandle()}):`, textW), pad, ty);
        ty += 18;
        ctx.fillStyle = INK;
        ctx.font = `700 ${fit.px}px ${MONO}`;
        fit.lines.forEach((line) => {
          ty += fit.lineHeight;
          ctx.fillText(line, pad, ty - Math.round(fit.px * 0.18));
        });
        if (dLines.length) {
          ty += 16;
          ctx.font = `500 ${detPx}px ${MONO}`;
          ctx.fillStyle = 'rgba(17, 17, 21, 0.78)';
          dLines.forEach((line) => {
            ty += detPx + 8;
            drawDetailedReviewLine(ctx, line, pad, ty, { align: 'left' });
          });
        }
      });
    }
    if (qrSize) {
      const qrY = Math.round(quoteAreaTop + (areaH - qrSize) / 2);
      drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: w - pad - qrSize, y: qrY, w: qrSize, h: qrSize }, () => {
        drawPosterQrCode(ctx, w - pad - qrSize, qrY, qrSize, true);
      });
    }
  }
  drawDashedRule(ctx, pad, w - pad, verdictY - 12, RULE, 2);

  drawFooterBrand(ctx, cx, frame.footerY, true);
}
