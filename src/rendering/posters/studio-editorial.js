import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawRoundedRectPath,
  getHexLuminance,
  getVividPaletteColor
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';
import {
  drawArtBackdrop,
  drawDashedRule,
  drawQuoteLines,
  drawScorePill,
  drawSeededBarcode,
  drawStars,
  fitSingleLine,
  getCastNames,
  getHandle,
  getLoggedDate,
  getQuoteText,
  getStudioFrame,
  layoutQuote
} from './studio-shared.js';

const MONO = '"JetBrains Mono", monospace';
const SERIF = (px) => `italic ${px}px "Instrument Serif", serif`;
const INK = '#F4F1EA';
const MUTED = 'rgba(244, 241, 234, 0.58)';
const RULE = 'rgba(255, 255, 255, 0.16)';

function hRule(ctx, x1, x2, y, color = RULE) {
  ctx.fillStyle = color;
  ctx.fillRect(x1, y, x2 - x1, 2);
}

function drawTitleLines(ctx, layout, x, y, color, align = 'left', family = '"Syne", sans-serif') {
  ctx.font = `800 ${layout.fontPx}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  let ty = y;
  layout.lines.forEach((line) => {
    ty += layout.lineHeight;
    ctx.fillText(line, x, ty - Math.round(layout.fontPx * 0.13));
  });
  return ty;
}

function creditLabel() {
  return state.mediaType === 'tv' ? 'CREATOR' : 'DIRECTOR';
}

// ---------------------------------------------------------------------------
// Swiss Grid — still on top, strict two-column grid of type underneath.
// ---------------------------------------------------------------------------
export function renderSwissGridPoster(ctx, w, h) {
  const frame = getStudioFrame(w, h);
  const { fs, top, isSquare, contentBottom } = frame;
  const pad = 60;
  const innerW = w - pad * 2;
  const accent = getVividPaletteColor('#E2A84B');
  const quoteText = getQuoteText();

  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, w, h);

  const small = Math.round(19 * fs);
  let y = top + 56;
  ctx.font = `600 ${small}px ${MONO}`;
  ctx.fillStyle = INK;
  ctx.textAlign = 'right';
  const rightTop = [state.medium, state.year].filter(Boolean).join(' • ').toUpperCase();
  ctx.fillText(rightTop, w - pad, y);
  ctx.textAlign = 'left';
  const edition = `POSTERBOXD // ARCHIVAL EDITION${state.tmdbId ? ` #${state.tmdbId}` : ''}`;
  ctx.fillText(fitSingleLine(ctx, edition, innerW - ctx.measureText(rightTop).width - 30), pad, y);
  y += 20;
  hRule(ctx, pad, w - pad, y);
  y += 24;

  const contentH = contentBottom - y;
  const stillH = Math.round(contentH * (isSquare ? 0.36 : (quoteText.length > 120 ? 0.38 : 0.44)) * Math.min(1.12, Math.max(0.7, state.posterScale)));
  const stillImg = state.backdropImg || state.posterImg;
  const stillY = y;
  drawMovableGroup(ctx, 'artwork', 'Scene Still', { x: pad, y: stillY, w: innerW, h: stillH }, () => {
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(pad, stillY, innerW, stillH);
    ctx.beginPath();
    ctx.rect(pad, stillY, innerW, stillH);
    ctx.clip();
    if (stillImg) {
      ctx.filter = `brightness(${Math.min(110, state.backdropBrightness + 45)}%)`;
      drawImageCover(ctx, stillImg, pad, stillY, innerW, stillH);
      ctx.filter = 'none';
    }
    ctx.restore();
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, stillY, innerW, stillH);
  });
  y += stillH + 26;
  hRule(ctx, pad, w - pad, y);
  y += 30;

  // Grid
  const gridTop = y;
  const leftW = Math.round(innerW * 0.64);
  const rightX = pad + leftW + 30;
  const rightW = w - pad - rightX;
  ctx.fillStyle = RULE;
  ctx.fillRect(pad + leftW + 14, gridTop, 2, contentBottom - gridTop);

  // Left column
  const tLayout = computeAdaptiveTitleLayout(ctx, String(state.title || '').toUpperCase(), leftW - 16, Math.round(56 * fs), '"Syne", sans-serif', '800', 2);
  const titleH = tLayout.lines.length * tLayout.lineHeight + (state.episodeTitle ? small + 14 : 0);
  drawMovableGroup(ctx, 'title', 'Title', { x: pad, y: gridTop, w: leftW - 16, h: titleH }, () => {
    const ty = drawTitleLines(ctx, tLayout, pad, gridTop, INK);
    if (state.episodeTitle) {
      ctx.font = `500 ${small}px ${MONO}`;
      ctx.fillStyle = MUTED;
      ctx.fillText(fitSingleLine(ctx, state.episodeTitle.toUpperCase(), leftW - 16), pad, ty + small + 4);
    }
  });

  const starR = Math.round(16 * fs);
  const footRowY = contentBottom - starR * 2 - 4;
  hRule(ctx, pad, pad + leftW - 2, footRowY - 18);
  ctx.font = `600 ${small}px ${MONO}`;
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(fitSingleLine(ctx, getHandle(), leftW * 0.5), pad, footRowY + starR + 1);
  ctx.textBaseline = 'alphabetic';
  drawMovableGroup(ctx, 'rating', 'Star Rating', { x: pad + leftW * 0.5, y: footRowY, w: leftW * 0.5 - 16, h: starR * 2 }, () => {
    drawStars(ctx, pad + leftW - 16, footRowY, starR, accent, 'right');
  });

  const qTop = gridTop + titleH + 16;
  const qRoom = footRowY - 36 - qTop;
  const quote = layoutQuote(ctx, quoteText, leftW - 20, qRoom, { basePx: Math.round(46 * fs), minPx: Math.round(24 * fs), font: SERIF });
  if (quote.lines.length) {
    const qy = Math.round(qTop + (qRoom - quote.height) / 2);
    drawMovableGroup(ctx, 'review', 'Review Quote', { x: pad, y: qy, w: leftW - 20, h: quote.height }, () => {
      drawQuoteLines(ctx, quote, pad, qy, { font: SERIF, color: INK });
    });
  }

  // Right column
  let ry = gridTop;
  const valPx = Math.round(21 * fs);
  const labelPx = Math.round(16 * fs);
  const blocks = [
    state.director ? [creditLabel(), state.director, 1] : null,
    state.cast ? ['STARRING', getCastNames(3).join(', '), isSquare ? 2 : 3] : null,
    (state.runtime || state.genre) ? ['SPECS', [state.runtime, state.genre].filter(Boolean).join(' • '), 2] : null,
    (!isSquare && state.watchedAt) ? ['VENUE', state.watchedAt, 1] : null,
    !isSquare ? ['LOGGED', getLoggedDate(), 1] : null
  ].filter(Boolean);
  const pillRowY = contentBottom - Math.round(48 * fs) - 2;
  const qrSize = state.showQrCode ? Math.min(110, rightW) : 0;
  const blocksLimit = pillRowY - 30 - (qrSize ? qrSize + 16 : 0);
  ctx.textAlign = 'left';
  blocks.forEach(([label, value, maxLines]) => {
    if (ry + labelPx + valPx + 12 > blocksLimit) return;
    ry += labelPx;
    ctx.font = `500 ${labelPx}px ${MONO}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(label, rightX, ry);
    ctx.font = `600 ${valPx}px ${MONO}`;
    ctx.fillStyle = INK;
    const words = String(value).split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach((word) => {
      const test = cur ? `${cur} ${word}` : word;
      if (ctx.measureText(test).width <= rightW || !cur) cur = test;
      else { lines.push(cur); cur = word; }
    });
    if (cur) lines.push(cur);
    lines.slice(0, maxLines).forEach((line) => {
      if (ry + valPx + 8 > blocksLimit) return;
      ry += valPx + 8;
      ctx.fillText(fitSingleLine(ctx, line, rightW), rightX, ry);
    });
    ry += 22;
  });
  if (qrSize) {
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: rightX, y: pillRowY - 26 - qrSize, w: qrSize, h: qrSize }, () => {
      drawPosterQrCode(ctx, rightX, pillRowY - 26 - qrSize, qrSize, false);
    });
  }
  hRule(ctx, rightX, w - pad, pillRowY - 16);
  ctx.font = `500 ${labelPx}px ${MONO}`;
  ctx.fillStyle = MUTED;
  ctx.textBaseline = 'middle';
  ctx.fillText('CRITIC', rightX, pillRowY + Math.round(24 * fs));
  ctx.textBaseline = 'alphabetic';
  drawScorePill(ctx, w - pad, pillRowY, fs, accent, 'right');

  drawFooterBrand(ctx, w / 2, frame.footerY, false);
}

// ---------------------------------------------------------------------------
// Billboard — full-bleed key art, pull quote on top, title block at the foot.
// ---------------------------------------------------------------------------
export function renderBillboardPoster(ctx, w, h) {
  const frame = getStudioFrame(w, h);
  const { fs, top, isSquare, contentBottom } = frame;
  const pad = 70;
  const innerW = w - pad * 2;
  const cx = w / 2;
  const accent = getVividPaletteColor('#E2A84B');

  drawArtBackdrop(ctx, w, h, state.posterImg || state.backdropImg, { blur: Math.min(state.backdropBlur, 4), dim: 0.05 });
  const shade = ctx.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0.84)');
  shade.addColorStop(0.45, 'rgba(0, 0, 0, 0.30)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.94)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);

  // Foot block (measured first so the quote knows its limit).
  const small = Math.round(21 * fs);
  const useLogo = state.useLogoImage && state.logoImg;
  const tLayout = computeAdaptiveTitleLayout(ctx, String(state.title || '').toUpperCase(), innerW, Math.round(84 * fs), '"Syne", sans-serif', '800', 2);
  const titleH = useLogo ? Math.round(150 * fs) : tLayout.lines.length * tLayout.lineHeight;
  const creditsLine = [
    state.director ? `${state.mediaType === 'tv' ? 'CREATED BY' : 'DIRECTED BY'} ${state.director.toUpperCase()}` : '',
    state.year, state.runtime ? state.runtime.toUpperCase() : ''
  ].filter(Boolean).join(' • ');
  const footH = 30 + titleH + small + 22 + (state.genre ? small + 12 : 0);
  const footY = contentBottom - footH;
  hRule(ctx, pad, w - pad, footY, 'rgba(255, 255, 255, 0.24)');
  drawMovableGroup(ctx, 'title', 'Title Block', { x: pad, y: footY + 30, w: innerW, h: footH - 30 }, () => {
    let ty = footY + 30;
    if (useLogo) {
      const ratio = Math.min(innerW * 0.8 / state.logoImg.width, titleH / state.logoImg.height);
      const lw = Math.round(state.logoImg.width * ratio);
      const lh = Math.round(state.logoImg.height * ratio);
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 24;
      ctx.drawImage(state.logoImg, Math.round(cx - lw / 2), Math.round(ty + (titleH - lh) / 2), lw, lh);
      ctx.restore();
      ty += titleH;
    } else {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 22;
      ty = drawTitleLines(ctx, tLayout, cx, ty, '#FFFFFF', 'center');
      ctx.restore();
    }
    ty += small + 16;
    ctx.font = `600 ${small}px ${MONO}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.textAlign = 'center';
    ctx.fillText(fitSingleLine(ctx, creditsLine, innerW), cx, ty);
    if (state.genre) {
      ty += small + 12;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(fitSingleLine(ctx, state.genre.toUpperCase(), innerW), cx, ty);
    }
  });

  // Top: stars, quote, handle.
  let y = top + 64;
  const starR = Math.round(22 * fs);
  if (state.rating > 0 || state.isLiked) {
    const sy = y;
    drawMovableGroup(ctx, 'rating', 'Star Rating', { x: cx - 220, y: sy, w: 440, h: starR * 2 }, () => {
      drawStars(ctx, cx, sy, starR, accent, 'center');
    });
    y += starR * 2 + 26;
  }
  if (state.medium) {
    ctx.font = `700 ${small}px ${MONO}`;
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText(state.medium.toUpperCase(), cx, y + small);
    y += small + 24;
  }
  const qRoom = Math.min(footY - 40 - y - small - 30, h * (isSquare ? 0.34 : 0.4));
  const quote = layoutQuote(ctx, getQuoteText(), innerW * 0.94, qRoom, { basePx: Math.round(66 * fs), minPx: Math.round(30 * fs), font: SERIF, maxLines: 8 });
  const qy = y;
  const blockH = quote.height + small + 30;
  drawMovableGroup(ctx, 'review', 'Pull Quote', { x: pad, y: qy, w: innerW, h: blockH }, () => {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 18;
    const end = quote.lines.length ? drawQuoteLines(ctx, quote, cx, qy, { font: SERIF, color: '#FFFFFF', align: 'center' }) : qy;
    ctx.font = `600 ${small}px ${MONO}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.textAlign = 'center';
    ctx.fillText(`— ${getHandle()}`, cx, end + small + 14);
    ctx.restore();
  });

  if (state.showQrCode) {
    const qrSize = 104;
    const qrY = footY - qrSize - 28;
    if (qrY > qy + blockH + 10) {
      drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: w - pad - qrSize, y: qrY, w: qrSize, h: qrSize }, () => {
        drawPosterQrCode(ctx, w - pad - qrSize, qrY, qrSize, false);
      });
    }
  }
  drawFooterBrand(ctx, cx, frame.footerY, false);
}

// ---------------------------------------------------------------------------
// Archive Stub — rounded still, perforation, title, quote and a barcode.
// ---------------------------------------------------------------------------
export function renderArchiveStubPoster(ctx, w, h) {
  const frame = getStudioFrame(w, h);
  const { fs, top, isSquare, contentBottom } = frame;
  const pad = 60;
  const innerW = w - pad * 2;
  const accent = getVividPaletteColor('#E2A84B');

  ctx.fillStyle = '#121218';
  ctx.fillRect(0, 0, w, h);

  const small = Math.round(20 * fs);
  const contentTop = top + 44;
  const contentH = contentBottom - contentTop;
  const stillH = Math.round(contentH * (isSquare ? 0.38 : 0.44) * Math.min(1.1, Math.max(0.7, state.posterScale)));
  const stillImg = state.backdropImg || state.posterImg;
  drawMovableGroup(ctx, 'artwork', 'Stub Still', { x: pad, y: contentTop, w: innerW, h: stillH }, () => {
    ctx.save();
    drawRoundedRectPath(ctx, pad, contentTop, innerW, stillH, 26);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.clip();
    if (stillImg) {
      ctx.filter = `brightness(${Math.min(110, state.backdropBrightness + 45)}%)`;
      drawImageCover(ctx, stillImg, pad, contentTop, innerW, stillH);
      ctx.filter = 'none';
    }
    ctx.restore();
    ctx.save();
    drawRoundedRectPath(ctx, pad, contentTop, innerW, stillH, 26);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.font = `700 ${small}px ${MONO}`;
    const tag = fitSingleLine(ctx, ['ADMIT ONE', state.year, state.medium].filter(Boolean).join(' • ').toUpperCase(), innerW - 80);
    const tagW = ctx.measureText(tag).width + 28;
    drawRoundedRectPath(ctx, pad + 22, contentTop + 22, tagW, small + 20, 8);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, pad + 36, contentTop + 22 + (small + 20) / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    drawScorePill(ctx, pad + innerW - 22, contentTop + stillH - Math.round(48 * fs) - 22, fs, accent, 'right');
  });

  let y = contentTop + stillH + 26;
  drawDashedRule(ctx, pad, w - pad, y, 'rgba(255, 255, 255, 0.3)', 3);
  [pad - 60, w - pad + 60].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x < w / 2 ? 0 : w, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
  });
  y += 30;

  const tLayout = computeAdaptiveTitleLayout(ctx, String(state.title || '').toUpperCase(), innerW, Math.round(58 * fs), '"Syne", sans-serif', '800', 2);
  const titleH = tLayout.lines.length * tLayout.lineHeight + small + 14;
  const titleY = y;
  drawMovableGroup(ctx, 'title', 'Title & Director', { x: pad, y: titleY, w: innerW, h: titleH }, () => {
    const ty = drawTitleLines(ctx, tLayout, pad, titleY, INK);
    ctx.font = `500 ${small}px ${MONO}`;
    ctx.fillStyle = MUTED;
    const line = [state.episodeTitle, state.director ? `DIR. ${state.director}` : '', state.runtime].filter(Boolean).join(' • ').toUpperCase();
    ctx.fillText(fitSingleLine(ctx, line, innerW), pad, ty + small + 6);
  });
  y += titleH + 18;

  const barcodeH = Math.round((isSquare ? 44 : 72) * fs);
  const barcodeY = contentBottom - barcodeH;
  hRule(ctx, pad, w - pad, barcodeY - 20, 'rgba(255, 255, 255, 0.2)');
  drawSeededBarcode(ctx, pad, barcodeY, innerW, barcodeH, INK);

  const starR = Math.round(16 * fs);
  const rowH = starR * 2;
  const qRoom = barcodeY - 40 - y - rowH - 22;
  const qrSize = state.showQrCode && qRoom > 150 ? 104 : 0;
  const qW = innerW - (qrSize ? qrSize + 30 : 0);
  const quote = layoutQuote(ctx, getQuoteText(), qW, qRoom, { basePx: Math.round(50 * fs), minPx: Math.round(24 * fs), font: SERIF });
  const blockH = quote.height + rowH + 22;
  const blockY = Math.round(y + Math.max(0, (qRoom + rowH + 22 - blockH) / 2));
  drawMovableGroup(ctx, 'review', 'Review & Rating', { x: pad, y: blockY, w: innerW, h: blockH }, () => {
    const end = quote.lines.length ? drawQuoteLines(ctx, quote, pad, blockY, { font: SERIF, color: INK }) : blockY;
    const rowY = end + 22;
    ctx.font = `500 ${small}px ${MONO}`;
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const byline = `— ${getHandle()}${state.watchedAt ? ` @ ${state.watchedAt.toUpperCase()}` : ''}`;
    ctx.fillText(fitSingleLine(ctx, byline, qW * 0.6), pad, rowY + starR + 1);
    ctx.textBaseline = 'alphabetic';
    drawStars(ctx, pad + qW, rowY, starR, accent, 'right');
  });
  if (qrSize) {
    const qrY = Math.round(y + (qRoom + rowH + 22 - qrSize) / 2);
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: w - pad - qrSize, y: qrY, w: qrSize, h: qrSize }, () => {
      drawPosterQrCode(ctx, w - pad - qrSize, qrY, qrSize, false);
    });
  }

  drawFooterBrand(ctx, w / 2, frame.footerY, false);
}

// ---------------------------------------------------------------------------
// Archive Pass — cream instant-photo card on a dark field, barcode beneath.
// ---------------------------------------------------------------------------
export function renderArchivePassPoster(ctx, w, h) {
  const frame = getStudioFrame(w, h);
  const { fs, top, isSquare, isStory, contentBottom } = frame;
  const pad = 60;
  const innerW = w - pad * 2;
  const accent = getVividPaletteColor('#E2A84B');
  const cardInk = '#111115';
  const cardMuted = 'rgba(17, 17, 21, 0.64)';
  const starColor = getHexLuminance(accent) > 0.55 ? cardInk : accent;

  ctx.fillStyle = '#0B0B10';
  ctx.fillRect(0, 0, w, h);
  const bgImg = state.backdropImg || state.posterImg;
  if (bgImg) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.filter = 'blur(40px)';
    drawImageCover(ctx, bgImg, -100, -100, w + 200, h + 200, 0, 0);
    ctx.restore();
  }

  const small = Math.round(19 * fs);
  let y = top + 54;
  ctx.font = `600 ${small}px ${MONO}`;
  ctx.fillStyle = 'rgba(244, 241, 234, 0.75)';
  ctx.textAlign = 'left';
  ctx.fillText('POSTERBOXD // VIP ARCHIVE PASS', pad, y);
  if (state.medium) {
    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.fillText(state.medium.toUpperCase(), w - pad, y);
  }
  const areaTop = y + 26;

  const barcodeH = Math.round((isSquare ? 40 : 66) * fs);
  const barcodeY = contentBottom - barcodeH;
  drawSeededBarcode(ctx, pad, barcodeY, innerW, barcodeH, INK);
  const areaBottom = barcodeY - 28;

  // Card
  const cPad = Math.round(30 * fs);
  const cInner = innerW - cPad * 2;
  const stillH = Math.round((isSquare ? 250 : (isStory ? 560 : 420)) * Math.min(1.12, Math.max(0.7, state.posterScale)));
  const tLayout = computeAdaptiveTitleLayout(ctx, String(state.title || '').toUpperCase(), cInner - 110, Math.round(52 * fs), '"Syne", sans-serif', '800', 2);
  const titleH = tLayout.lines.length * tLayout.lineHeight;
  const starR = Math.round(16 * fs);
  const fixedH = cPad + stillH + 26 + titleH + small + 16 + 18 + 22 + starR * 2 + cPad + 8;
  const qRoom = areaBottom - areaTop - fixedH;
  const quote = layoutQuote(ctx, getQuoteText(), cInner, qRoom, { basePx: Math.round(46 * fs), minPx: Math.round(24 * fs), font: SERIF, maxLines: 9 });
  const cardH = fixedH + quote.height;
  const cardY = Math.round(areaTop + Math.max(0, (areaBottom - areaTop - cardH) / 2));

  ctx.save();
  drawRoundedRectPath(ctx, pad, cardY, innerW, cardH, 22);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 26;
  ctx.fillStyle = '#F7F4EE';
  ctx.fill();
  ctx.restore();

  const stillX = pad + cPad;
  const stillY = cardY + cPad;
  drawMovableGroup(ctx, 'artwork', 'Pass Photo', { x: stillX, y: stillY, w: cInner, h: stillH }, () => {
    ctx.save();
    drawRoundedRectPath(ctx, stillX, stillY, cInner, stillH, 14);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.clip();
    if (bgImg) {
      ctx.filter = `brightness(${Math.min(110, state.backdropBrightness + 45)}%)`;
      drawImageCover(ctx, bgImg, stillX, stillY, cInner, stillH);
      ctx.filter = 'none';
    }
    ctx.restore();
    drawScorePill(ctx, stillX + cInner - 18, stillY + stillH - Math.round(48 * fs) - 18, fs, accent, 'right');
  });

  let ty = stillY + stillH + 26;
  const titleTop = ty;
  drawMovableGroup(ctx, 'title', 'Title & Director', { x: stillX, y: titleTop, w: cInner, h: titleH + small + 16 }, () => {
    const end = drawTitleLines(ctx, tLayout, stillX, titleTop, cardInk);
    ctx.font = `500 ${small}px ${MONO}`;
    ctx.fillStyle = cardMuted;
    ctx.textAlign = 'right';
    ctx.fillText(String(state.year || ''), stillX + cInner, titleTop + tLayout.lineHeight - Math.round(tLayout.fontPx * 0.13));
    ctx.textAlign = 'left';
    const line = [state.episodeTitle, state.director ? `${state.mediaType === 'tv' ? 'CREATED BY' : 'DIRECTED BY'} ${state.director}` : '', state.runtime].filter(Boolean).join(' • ').toUpperCase();
    ctx.fillText(fitSingleLine(ctx, line, cInner), stillX, end + small + 6);
  });
  ty += titleH + small + 16 + 18;

  const reviewTop = ty;
  drawMovableGroup(ctx, 'review', 'Review & Rating', { x: stillX, y: reviewTop, w: cInner, h: quote.height + 22 + starR * 2 }, () => {
    const end = quote.lines.length ? drawQuoteLines(ctx, quote, stillX, reviewTop, { font: SERIF, color: cardInk }) : reviewTop;
    hRule(ctx, stillX, stillX + cInner, end + 10, 'rgba(17, 17, 21, 0.16)');
    const rowY = end + 22;
    ctx.font = `500 ${small}px ${MONO}`;
    ctx.fillStyle = cardMuted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(fitSingleLine(ctx, [getHandle(), getLoggedDate()].filter(Boolean).join(' • '), cInner * 0.58), stillX, rowY + starR + 1);
    ctx.textBaseline = 'alphabetic';
    drawStars(ctx, stillX + cInner, rowY, starR, starColor, 'right', true);
  });

  if (state.showQrCode) {
    const qrSize = 96;
    drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: stillX + 16, y: stillY + stillH - qrSize - 16, w: qrSize, h: qrSize }, () => {
      ctx.save();
      drawRoundedRectPath(ctx, stillX + 16, stillY + stillH - qrSize - 16, qrSize, qrSize, 14);
      ctx.fillStyle = 'rgba(247, 244, 238, 0.92)';
      ctx.fill();
      ctx.restore();
      drawPosterQrCode(ctx, stillX + 16, stillY + stillH - qrSize - 16, qrSize, true);
    });
  }

  drawFooterBrand(ctx, w / 2, frame.footerY, false);
}
