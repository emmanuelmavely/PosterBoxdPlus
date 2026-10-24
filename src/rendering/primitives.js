import { state } from '../state.js';
import { renderRuntime } from './runtime.js';

export function drawRoundedRectPath(context, x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

export function drawImageCover(context, image, x, y, width, height, offsetX = (state.posterOffsetX || 0), offsetY = (state.posterOffsetY || 0)) {
  if (!image || !image.width || !image.height) return;
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  if (imageRatio > boxRatio) {
    sourceWidth = image.height * boxRatio;
    const maxShiftX = image.width - sourceWidth;
    // offsetX is -100 to +100 (%)
    sourceX = Math.max(0, Math.min(maxShiftX, (maxShiftX / 2) + (offsetX / 100) * (maxShiftX / 2)));
  } else {
    sourceHeight = image.width / boxRatio;
    const maxShiftY = image.height - sourceHeight;
    // offsetY is -100 to +100 (%)
    sourceY = Math.max(0, Math.min(maxShiftY, (maxShiftY / 2) + (offsetY / 100) * (maxShiftY / 2)));
  }
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

export function traceStarPath(context, centerX, centerY, outerRadius, innerRadius) {
  context.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

export function drawVectorHeart(context, centerX, centerY, size, color = '#FF8000') {
  context.save();
  context.translate(centerX, centerY - size * 0.38);
  const scale = size / 32;
  context.scale(scale, scale);
  context.beginPath();
  context.moveTo(0, 8);
  context.bezierCurveTo(0, 5, -5, 0, -11, 0);
  context.bezierCurveTo(-19, 0, -19, 10, -19, 10);
  context.bezierCurveTo(-19, 18, -11, 24, 0, 31);
  context.bezierCurveTo(11, 24, 19, 18, 19, 10);
  context.bezierCurveTo(19, 10, 19, 0, 11, 0);
  context.bezierCurveTo(5, 0, 0, 5, 0, 8);
  context.closePath();
  context.fillStyle = color;
  context.fill();
  context.restore();
}

export function drawRatingAndHeartRow(context, {
  x, y, rating, isLiked, starSize = 24, gap = 12, align = 'center',
  starColor = '#00E054', emptyColor = 'rgba(255,255,255,0.2)', heartColor = '#FF8000'
}) {
  const hasRating = rating > 0;
  if (!hasRating && !isLiked) return 0;
  const numberOfStars = hasRating ? 5 : 0;
  const starsWidth = hasRating ? (numberOfStars * starSize * 2 + (numberOfStars - 1) * gap) : 0;
  const heartSpace = isLiked ? (hasRating ? gap * 1.8 + starSize * 1.9 : starSize * 1.9) : 0;
  const totalWidth = starsWidth + heartSpace;

  let startX = x;
  if (align === 'center') startX = x - totalWidth / 2;
  else if (align === 'right') startX = x - totalWidth;
  const centerY = y + starSize;

  if (hasRating) {
    for (let i = 0; i < 5; i++) {
      const centerX = startX + starSize + i * (starSize * 2 + gap);
      const starValue = rating - i;
      traceStarPath(context, centerX, centerY, starSize, starSize * 0.44);
      context.fillStyle = emptyColor;
      context.fill();
      if (starValue >= 1) {
        traceStarPath(context, centerX, centerY, starSize, starSize * 0.44);
        context.fillStyle = starColor;
        context.fill();
      } else if (starValue >= 0.5) {
        context.save();
        context.beginPath();
        context.rect(centerX - starSize - 2, centerY - starSize - 2, starSize + 2, starSize * 2 + 4);
        context.clip();
        traceStarPath(context, centerX, centerY, starSize, starSize * 0.44);
        context.fillStyle = starColor;
        context.fill();
        context.restore();
      }
    }
  }
  if (isLiked) {
    const heartCenterX = startX + starsWidth + (hasRating ? gap * 1.8 + starSize * 0.95 : starSize * 0.95);
    drawVectorHeart(context, heartCenterX, centerY, starSize * 1.65, heartColor);
  }
  return starSize * 2;
}

export function getHexLuminance(hexColor) {
  const hex = String(hexColor || '#00E054').replace('#', '').trim();
  if (hex.length !== 6) return 0.5;
  const red = parseInt(hex.slice(0, 2), 16) / 255;
  const green = parseInt(hex.slice(2, 4), 16) / 255;
  const blue = parseInt(hex.slice(4, 6), 16) / 255;
  const toLinear = value => (value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
}

export function getReadableTextColor(backgroundHex) {
  return getHexLuminance(backgroundHex) > 0.36 ? '#0B0C0E' : '#FFFFFF';
}

export function ensureVisibleAccentOnDark(hexColor, fallback = '#00E054') {
  return getHexLuminance(hexColor) < 0.14 ? fallback : hexColor;
}

export function getDetailedReviewLines(context, text, maxWidth, maxLines = 3) {
  if (!state.showDetailedReview || !text || text === state.review) return [];
  const cleanText = String(text).trim();
  if (!cleanText) return [];
  const words = cleanText.split(/\s+/);
  const lines = [];
  let current = '';
  const suffix = ' ..... full review in Letterboxd profile';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const test = current ? `${current} ${word}` : word;
    if (context.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (lines.length === maxLines - 1) {
        let truncated = current || word;
        while (truncated.length > 0 && context.measureText(truncated + suffix).width > maxWidth) {
          truncated = truncated.replace(/\s+\S*$/, '');
          if (!truncated.includes(' ')) truncated = truncated.slice(0, -1);
        }
        lines.push((truncated.trim() || '') + suffix);
        return lines;
      }
      if (current) {
        lines.push(current);
        current = word;
      } else {
        lines.push(word);
        current = '';
      }
    }
  }
  if (current && lines.length < maxLines) {
    if (cleanText.length > 210 && context.measureText(current + suffix).width <= maxWidth) {
      lines.push(current + suffix);
    } else {
      lines.push(current);
    }
  }
  return lines;
}

export function getWrappedLines(context, text, maxWidth, maxLines = 3) {
  if (!text) return [];
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let current = '';
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const test = current ? `${current} ${word}` : word;
    if (context.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (lines.length === maxLines - 1) {
        let truncated = test;
        while (truncated.length > 3 && context.measureText(truncated + '…').width > maxWidth) {
          truncated = truncated.slice(0, -1);
        }
        lines.push(truncated.trim() + '…');
        return lines;
      }
      if (current) {
        lines.push(current);
        current = word;
      } else {
        lines.push(word);
        current = '';
      }
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

export function computeAdaptiveTitleLayout(context, text, maxWidth, baseFontPx, fontFamily = '"Syne", sans-serif', fontWeight = '800', maxLines = 2) {
  const cleanText = String(text || 'Untitled').trim();
  const length = cleanText.length;
  let scaleFactor = 1.0;
  if (length > 36) scaleFactor = 0.72;
  else if (length > 26) scaleFactor = 0.82;
  else if (length > 18) scaleFactor = 0.90;

  let fontPx = Math.round(baseFontPx * scaleFactor);
  context.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  let lines = getWrappedLines(context, cleanText, maxWidth, maxLines);
  while (fontPx > 24 && lines.some(line => context.measureText(line).width > maxWidth)) {
    fontPx -= 2;
    context.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
    lines = getWrappedLines(context, cleanText, maxWidth, maxLines);
  }
  return { fontPx, lines, lineHeight: Math.round(fontPx * 1.12) };
}

export function drawMediumBadge(context, centerX, y, medium, isLightMode = false, scale = 1.0) {
  if (!medium) return 0;
  context.save();
  let foreground = isLightMode ? '#18181B' : '#FFFFFF';
  let borderColor = isLightMode ? 'rgba(24,24,27,0.45)' : 'rgba(255,255,255,0.45)';
  let background = isLightMode ? 'rgba(24,24,27,0.06)' : 'rgba(255,255,255,0.08)';

  let badgeText = medium.toUpperCase();
  let subText = '';
  if (medium === 'THEATER') { badgeText = 'THEATRICAL'; subText = 'CINEMA PRESENTATION'; }
  else if (medium === 'IMAX') { badgeText = 'I M A X'; subText = 'LARGE FORMAT'; }
  else if (medium === 'DOLBY') { badgeText = 'DOLBY'; subText = 'C I N E M A'; }
  else if (medium === '70MM') { badgeText = '70MM'; subText = 'CELLULOID FILM'; }
  else if (medium === '4DX') { badgeText = '4 D X'; subText = 'MOTION EXPERIENCE'; }
  else if (medium === '3D') { badgeText = 'REALD 3D'; subText = 'STEREOSCOPIC'; }
  else if (medium === 'OTT') { badgeText = 'O T T'; subText = 'DIGITAL STREAMING'; }
  else if (medium === 'NETFLIX') {
    badgeText = 'NETFLIX';
    subText = 'ORIGINAL / STREAMING';
    borderColor = '#E50914';
    background = isLightMode ? 'rgba(229,9,20,0.10)' : 'rgba(229,9,20,0.22)';
  } else if (medium === 'JIOHOTSTAR') {
    badgeText = 'JIOHOTSTAR';
    subText = 'STREAMING PREMIERE';
    borderColor = '#38BDF8';
    background = isLightMode ? 'rgba(56,189,248,0.10)' : 'rgba(56,189,248,0.20)';
  } else if (medium === 'PRIME') {
    badgeText = 'PRIME VIDEO';
    subText = 'AMAZON STREAMING';
    borderColor = '#00A8E1';
    background = isLightMode ? 'rgba(0,168,225,0.10)' : 'rgba(0,168,225,0.20)';
  }

  const height = Math.round(52 * scale);
  context.font = `800 ${Math.round(21 * scale)}px "Syne", sans-serif`;
  const mainWidth = context.measureText(badgeText).width;
  const width = Math.max(Math.round(156 * scale), mainWidth + Math.round(52 * scale));
  const x = centerX - width / 2;
  drawRoundedRectPath(context, x, y, width, height, Math.round(10 * scale));
  context.fillStyle = background;
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = borderColor;
  context.stroke();

  context.fillStyle = foreground;
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  if (subText) {
    context.font = `800 ${Math.round(20 * scale)}px "Syne", sans-serif`;
    context.fillText(badgeText, centerX, y + Math.round(25 * scale));
    context.font = `700 ${Math.round(10 * scale)}px "JetBrains Mono", monospace`;
    context.fillStyle = isLightMode ? '#57534E' : '#D1D5DB';
    context.fillText(subText, centerX, y + Math.round(42 * scale));
  } else {
    context.fillText(badgeText, centerX, y + Math.round(33 * scale));
  }
  context.restore();
  return height;
}

export function drawFooterBrand(context, centerX, bottomY, isLightMode = false) {
  const scale = state.footerScale || 1.0;
  const primaryText = isLightMode ? '#18181B' : '#F4EFE6';
  const mutedText = isLightMode ? '#57534E' : '#A1A1AA';

  const cfg = state.footerItems || {
    username: true,
    posterboxd: true,
    letterboxd: true,
    venue: true
  };

  const rawUser = (state.username || '').trim().replace(/^@/, '');
  const handle = (cfg.username && rawUser) ? `@${rawUser.toUpperCase()}` : '';
  const venue = (cfg.venue && (state.watchedAt || '').trim()) ? state.watchedAt.trim().toUpperCase() : '';
  const showPosterboxd = Boolean(cfg.posterboxd);
  const showLetterboxd = Boolean(cfg.letterboxd && state.isFromLetterboxd);

  if (!handle && !showPosterboxd && !showLetterboxd && !venue) {
    return;
  }

  context.save();
  context.textBaseline = 'middle';
  const fontSize = Math.round(19 * scale);
  const iconSize = Math.round(24 * scale);
  const rowY = bottomY - Math.round(22 * scale);
  context.font = `700 ${fontSize}px "Syne", sans-serif`;

  const brandText = showPosterboxd ? 'POSTERBOXD' : '';
  const iconGap = Math.round(8 * scale);

  const handleWidth = handle ? context.measureText(handle).width : 0;
  const separatorText = (handle && (showPosterboxd || showLetterboxd)) ? '   ·   ' : '';
  const separatorWidth = separatorText ? context.measureText(separatorText).width : 0;

  const brandTextWidth = showPosterboxd ? context.measureText(brandText).width : 0;
  const brandWidth = showPosterboxd ? (iconSize + iconGap + brandTextWidth) : 0;

  const collaborationSeparator = (showPosterboxd && showLetterboxd) ? '  ×  ' : '';
  const collaborationSeparatorWidth = collaborationSeparator ? context.measureText(collaborationSeparator).width : 0;

  const dotRadius = Math.round(5.5 * scale);
  const dotsWidth = showLetterboxd ? (dotRadius * 6 + Math.round(6 * scale)) : 0;
  const letterboxdText = showLetterboxd ? 'LETTERBOXD' : '';
  const letterboxdTextWidth = showLetterboxd ? (context.measureText(letterboxdText).width + iconGap) : 0;
  const letterboxdTotalWidth = showLetterboxd ? (collaborationSeparatorWidth + dotsWidth + letterboxdTextWidth) : 0;

  const totalWidth = handleWidth + separatorWidth + brandWidth + letterboxdTotalWidth;
  let currentX = centerX - totalWidth / 2;

  if (venue) {
    context.save();
    context.font = `600 ${Math.round(14 * scale)}px "Syne", sans-serif`;
    context.fillStyle = mutedText;
    context.textAlign = 'center';
    context.fillText(`WATCHED AT ${venue}`, centerX, rowY - Math.round(26 * scale));
    context.restore();
  }

  context.textAlign = 'left';
  if (handle) {
    context.fillStyle = primaryText;
    context.fillText(handle, currentX, rowY);
    currentX += handleWidth;
    if (separatorText) {
      context.fillStyle = mutedText;
      context.fillText(separatorText, currentX, rowY);
      currentX += separatorWidth;
    }
  }

  if (showPosterboxd) {
    if (renderRuntime.customBrandSvgImg) {
      context.drawImage(renderRuntime.customBrandSvgImg, currentX, rowY - iconSize / 2 - 1, iconSize, iconSize);
    }
    currentX += iconSize + iconGap;
    context.fillStyle = primaryText;
    context.fillText(brandText, currentX, rowY);
    currentX += brandTextWidth;
  }

  if (showLetterboxd) {
    if (collaborationSeparator) {
      context.fillStyle = mutedText;
      context.fillText(collaborationSeparator, currentX, rowY);
      currentX += collaborationSeparatorWidth;
    }
    ['#FF8000', '#00E054', '#40BCF4'].forEach((color, index) => {
      context.beginPath();
      context.arc(currentX + dotRadius + index * (dotRadius * 2 + 2), rowY, dotRadius, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
    });
    currentX += dotsWidth + iconGap;
    context.fillStyle = primaryText;
    context.fillText(letterboxdText, currentX, rowY);
  }
  context.restore();
}

export function drawPaletteBar(context, centerX, y, width, height, showHex = false, isLightMode = false) {
  const startX = centerX - width / 2;
  const segmentWidth = width / 5;
  context.save();
  drawRoundedRectPath(context, startX, y, width, height, height / 2);
  context.clip();
  state.palette.forEach((hex, index) => {
    context.fillStyle = hex;
    context.fillRect(startX + index * segmentWidth, y, Math.ceil(segmentWidth), height);
  });
  context.restore();
  context.save();
  drawRoundedRectPath(context, startX, y, width, height, height / 2);
  context.strokeStyle = isLightMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)';
  context.lineWidth = 1.5;
  context.stroke();
  context.restore();
  return height;
}

export function drawProcessedBackdrop(context, width, height, image, customBlur = null, customBrightness = null) {
  const blur = customBlur !== null ? customBlur : state.backdropBlur;
  const brightness = customBrightness !== null ? customBrightness : state.backdropBrightness;
  context.save();
  context.fillStyle = '#090A0D';
  context.fillRect(0, 0, width, height);
  if (image) {
    const bleed = blur * 2.5;
    context.filter = `blur(${blur}px) brightness(${brightness}%)`;
    drawImageCover(context, image, -bleed, -bleed, width + bleed * 2, height + bleed * 2, 0, 0);
    context.filter = 'none';
  }
  if (state.tintBackdropWithPalette && state.palette[0]) {
    const tintGradient = context.createLinearGradient(0, 0, 0, height);
    tintGradient.addColorStop(0, `${state.palette[1] || '#0B0C0E'}55`);
    tintGradient.addColorStop(0.55, `${state.palette[0]}33`);
    tintGradient.addColorStop(1, '#07080AEE');
    context.fillStyle = tintGradient;
    context.fillRect(0, 0, width, height);
  }
  if (state.gradientOverlay) {
    const vignette = context.createLinearGradient(0, 0, 0, height);
    vignette.addColorStop(0, 'rgba(7, 8, 10, 0.25)');
    vignette.addColorStop(0.45, 'rgba(7, 8, 10, 0.55)');
    vignette.addColorStop(0.8, 'rgba(7, 8, 10, 0.88)');
    vignette.addColorStop(1, 'rgba(7, 8, 10, 0.97)');
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
  }
  context.restore();
}
