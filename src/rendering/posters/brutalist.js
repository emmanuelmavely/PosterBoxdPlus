import { state } from '../../state.js';
import {
  computeAdaptiveTitleLayout,
  drawFooterBrand,
  drawImageCover,
  drawRoundedRectPath,
  drawVectorHeart,
  getReadableTextColor,
  getVividPaletteColor
} from '../primitives.js';
import { drawPosterQrCode } from '../qr-code.js';
import { drawMovableGroup } from '../transforms.js';
import {
  desaturateRect,
  fitSingleLine,
  fitTextBlock,
  getHandle,
  getScoreText,
  getStudioFrame
} from './studio-shared.js';

// Black-and-white key art with a slashed accent "censor tape" carrying the verdict.
export function renderBrutalistPoster(ctx, w, h) {
  const frame = getStudioFrame(w, h);
  const { fs, top, contentBottom } = frame;
  const pad = 64;
  const accent = getVividPaletteColor('#E2A84B');
  const onAccent = getReadableTextColor(accent);
  const artImg = state.posterImg || state.backdropImg;

  ctx.save();
  ctx.fillStyle = '#09090C';
  ctx.fillRect(0, 0, w, h);
  if (artImg) {
    drawImageCover(ctx, artImg, 0, 0, w, h);
    desaturateRect(ctx, 0, 0, w, h);
    ctx.fillStyle = `rgba(0, 0, 0, ${(0.55 * (1 - Math.min(100, state.backdropBrightness) / 100) + 0.12).toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
  }
  const shade = ctx.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0.80)');
  shade.addColorStop(0.42, 'rgba(0, 0, 0, 0.22)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Title block (left) and score pill (right).
  const score = getScoreText();
  const pillW = score ? Math.round(170 * fs) : 0;
  const pillH = Math.round(70 * fs);
  const titleMaxW = w - pad * 2 - (pillW ? pillW + 28 : 0);
  const titleY = top + 64;
  const tLayout = computeAdaptiveTitleLayout(ctx, String(state.title || '').toUpperCase(), titleMaxW, Math.round(82 * fs), '"Syne", sans-serif', '800', 3);
  const subPx = Math.round(23 * fs);
  const titleBlockH = tLayout.lines.length * tLayout.lineHeight + subPx * 2 + 44;

  drawMovableGroup(ctx, 'title', 'Title Block', { x: pad, y: titleY, w: titleMaxW, h: titleBlockH }, () => {
    let ty = titleY;
    ctx.font = `800 ${tLayout.fontPx}px "Syne", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    tLayout.lines.forEach((line) => {
      ty += tLayout.lineHeight;
      ctx.fillText(line, pad, ty - Math.round(tLayout.fontPx * 0.14));
    });
    ctx.font = `600 ${subPx}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    const byline = [
      state.director ? `${state.mediaType === 'tv' ? 'CREATED BY' : 'A FILM BY'} ${state.director.toUpperCase()}` : '',
      state.year ? `(${state.year})` : ''
    ].filter(Boolean).join(' ');
    if (byline) {
      ty += subPx + 12;
      ctx.fillText(fitSingleLine(ctx, byline, titleMaxW), pad, ty);
    }
    const tagLine = [state.episodeTitle, state.medium].filter(Boolean).join('  //  ').toUpperCase();
    if (tagLine) {
      ty += subPx + 12;
      ctx.fillStyle = accent;
      ctx.fillText(fitSingleLine(ctx, tagLine, titleMaxW), pad, ty);
    }
  });

  if (score) {
    const pillX = w - pad - pillW;
    drawMovableGroup(ctx, 'rating', 'Score Pill', { x: pillX, y: titleY + 8, w: pillW, h: pillH }, () => {
      drawRoundedRectPath(ctx, pillX, titleY + 8, pillW, pillH, 16);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.font = `800 ${Math.round(38 * fs)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = onAccent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${score} ★`, pillX + pillW / 2, titleY + 8 + pillH / 2 + 2);
      ctx.textBaseline = 'alphabetic';
    });
  }

  // Bottom meta rule.
  const metaPx = Math.round(21 * fs);
  const metaY = contentBottom - 8;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, metaY - metaPx - 22);
  ctx.lineTo(w - pad, metaY - metaPx - 22);
  ctx.stroke();
  ctx.font = `600 ${metaPx}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.74)';
  const rightMeta = [state.runtime, state.watchedAt].filter(Boolean).join(' // ').toUpperCase();
  ctx.textAlign = 'right';
  const rightText = fitSingleLine(ctx, rightMeta, (w - pad * 2) * 0.5);
  ctx.fillText(rightText, w - pad, metaY);
  ctx.textAlign = 'left';
  ctx.fillText(fitSingleLine(ctx, String(state.genre || '').toUpperCase(), (w - pad * 2) - ctx.measureText(rightText).width - 40), pad, metaY);
  ctx.restore();

  // Slashed tape with the one-line review.
  const tapeTopLimit = titleY + titleBlockH + 40;
  const tapeBottomLimit = metaY - metaPx - 60;
  const tapeInnerW = w - pad * 2 - 20;
  const quote = state.review ? `“${state.review}”` : '';
  const verdictPx = Math.round(22 * fs);
  const maxQuoteLines = frame.isSquare ? 3 : 5;
  const fit = quote
    ? fitTextBlock(ctx, quote, tapeInnerW, maxQuoteLines, Math.round((quote.length > 110 ? 46 : 58) * fs), Math.round(30 * fs), (px) => `800 ${px}px "Plus Jakarta Sans", sans-serif`)
    : { px: 0, lines: [], lineHeight: 0 };
  const tapeH = fit.lines.length * fit.lineHeight + verdictPx + (fit.lines.length ? 78 : 56);
  const tapeY = Math.round(Math.max(tapeTopLimit, Math.min(tapeBottomLimit - tapeH, (tapeTopLimit + tapeBottomLimit - tapeH) / 2 + (frame.isSquare ? 0 : h * 0.04))));

  drawMovableGroup(ctx, 'review', 'Verdict Tape', { x: 0, y: tapeY, w, h: tapeH }, () => {
    ctx.save();
    ctx.translate(w / 2, tapeY + tapeH / 2);
    ctx.rotate(-2 * Math.PI / 180);
    ctx.translate(-w / 2, -(tapeY + tapeH / 2));
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = accent;
    ctx.fillRect(-60, tapeY, w + 120, tapeH);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#000000';
    ctx.fillRect(-60, tapeY, w + 120, 5);
    ctx.fillRect(-60, tapeY + tapeH - 5, w + 120, 5);

    let ty = tapeY + 30;
    ctx.fillStyle = onAccent;
    ctx.textAlign = 'left';
    ctx.font = `800 ${fit.px}px "Plus Jakarta Sans", sans-serif`;
    fit.lines.forEach((line) => {
      ty += fit.lineHeight;
      ctx.fillText(line, pad + 10, ty - Math.round(fit.px * 0.2));
    });
    ty += verdictPx + (fit.lines.length ? 18 : 8);
    ctx.font = `700 ${verdictPx}px "JetBrains Mono", monospace`;
    ctx.globalAlpha = 0.88;
    ctx.fillText(fitSingleLine(ctx, `VERDICT: ${getHandle()}`, tapeInnerW * 0.55), pad + 10, ty);
    if (score) {
      const scoreLine = `★ ${score} / 5.0`;
      const heartSpace = state.isLiked ? verdictPx + 14 : 0;
      ctx.textAlign = 'right';
      ctx.fillText(scoreLine, w - pad - 10 - heartSpace, ty);
      if (state.isLiked) drawVectorHeart(ctx, w - pad - 10 - verdictPx / 2, ty - verdictPx * 0.32, verdictPx, onAccent);
    } else if (state.isLiked) {
      drawVectorHeart(ctx, w - pad - 10 - verdictPx / 2, ty - verdictPx * 0.32, verdictPx, onAccent);
    }
    ctx.restore();
  });

  if (state.showQrCode) {
    const qrSize = 108;
    const qrY = Math.min(tapeY + tapeH + 36, metaY - metaPx - 40 - qrSize);
    if (qrY > tapeY + tapeH) {
      drawMovableGroup(ctx, 'qrcode', 'Review QR Code', { x: w - pad - qrSize, y: qrY, w: qrSize, h: qrSize }, () => {
        drawPosterQrCode(ctx, w - pad - qrSize, qrY, qrSize, false);
      });
    }
  }

  drawFooterBrand(ctx, w / 2, frame.footerY, false);
}
