import { state } from '../state.js';

export function getLetterboxdReviewUrl() {
  if (state.letterboxdUrl && /^https?:\/\/(www\.)?letterboxd\.com\//i.test(state.letterboxdUrl)) {
    return state.letterboxdUrl;
  }
  const slug = (state.title || 'film')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const cleanYear = (state.year || '').match(/\d{4}/)?.[0] || '';
  const filmSlug = cleanYear ? `${slug}-${cleanYear}` : slug;
  const cleanUser = (state.username || '').trim().replace(/^@/, '').toLowerCase();
  return cleanUser
    ? `https://letterboxd.com/${cleanUser}/film/${filmSlug}/`
    : `https://letterboxd.com/film/${filmSlug}/`;
}

export function cleanLetterboxdRawTitle(rawTitle, fallbackYear = '') {
  let title = String(rawTitle || '').replace(/\u00A0/g, ' ').trim();
  title = title.replace(/^A\s+[★☆½\s]*review\s+of\s+/i, '').trim();
  title = title.replace(/^Review\s+of\s+/i, '').trim();
  title = title.replace(/^[★☆½\s]+/g, '').trim();
  let extractedYear = fallbackYear || '';
  const yearMatch = title.match(/^(.*?)\s*\((\d{4})\)\s*$/);
  if (yearMatch) {
    title = yearMatch[1].trim();
    if (!extractedYear) extractedYear = yearMatch[2];
  }
  return { title, year: extractedYear };
}

export function cleanLetterboxdParagraphs(paragraphsArray) {
  const cleaned = [];
  for (const rawParagraph of (paragraphsArray || [])) {
    if (!rawParagraph) continue;
    if (/Letterboxd is an independent service|upgrade to a Pro account|support of our members/i.test(rawParagraph)) continue;
    const temporaryDiv = document.createElement('div');
    temporaryDiv.innerHTML = String(rawParagraph).replace(/<br\s*\/?\s*>/gi, '\n');
    const lines = (temporaryDiv.textContent || '')
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean);
    cleaned.push(...lines);
  }
  return cleaned;
}

export async function fetchLetterboxdReview(reviewUrl, corsAnywhereBase = 'https://cors-anywhere.herokuapp.com/') {
  const proxyAttempts = [
    {
      url: corsAnywhereBase + reviewUrl,
      options: { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
    },
    {
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(reviewUrl)}`,
      options: {}
    },
    {
      url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(reviewUrl)}`,
      options: {}
    }
  ];

  let htmlText = '';
  for (const attempt of proxyAttempts) {
    try {
      const response = await fetch(attempt.url, attempt.options);
      if (response.ok) {
        const text = await response.text();
        if (text && text.includes('<html')) {
          htmlText = text;
          break;
        }
      }
    } catch (error) {
      // Try the next public proxy.
    }
  }

  if (!htmlText) {
    console.error('Failed to fetch Letterboxd HTML through proxies');
    return null;
  }

  try {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(htmlText, 'text/html');
    const rawTitle =
      documentNode.querySelector('.headline-1.film-title-wrapper a')?.textContent.trim() ||
      documentNode.querySelector('.film-title-wrapper a')?.textContent.trim() ||
      documentNode.querySelector('.inline-production-masthead .name a')?.textContent.trim() ||
      documentNode.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      '';
    const rawYear =
      documentNode.querySelector('.release-year')?.textContent.trim() ||
      documentNode.querySelector('.releasedate a')?.textContent.trim() ||
      '';
    const { title: movieTitle, year: releaseYear } = cleanLetterboxdRawTitle(rawTitle, rawYear);

    let reviewer =
      documentNode.querySelector('.person-summary .name span')?.textContent.trim() ||
      documentNode.querySelector('.name')?.textContent.trim() ||
      documentNode.querySelector('.user-name')?.textContent.trim() ||
      '';
    if (!reviewer && reviewUrl) {
      try {
        const pathParts = new URL(reviewUrl).pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2 && pathParts[1] === 'film') reviewer = pathParts[0];
      } catch (error) {
        // Keep the reviewer empty when the URL is malformed.
      }
    }

    let rating = 0;
    const ratingElement = documentNode.querySelector('.rating');
    const ratedMatch = ratingElement?.className?.match(/rated-(\d+)/);
    if (ratedMatch && ratedMatch[1]) {
      rating = Number(ratedMatch[1]) / 2;
    } else {
      const starText = ratingElement?.textContent || documentNode.querySelector('meta[name="twitter:data2"]')?.getAttribute('content') || '';
      const fullStars = (starText.match(/★/g) || []).length;
      const halfStar = /½/.test(starText) ? 0.5 : 0;
      if (fullStars > 0 || halfStar > 0) rating = fullStars + halfStar;
    }

    const isLiked = Boolean(
      documentNode.querySelector('.icon-liked') ||
      documentNode.querySelector('.content-reactions-strip .inline-liked') ||
      documentNode.querySelector('svg[aria-label="Liked"]')
    );
    let watchedDate = '';
    const viewDateLinks = documentNode.querySelectorAll('.view-date.date-links a');
    if (viewDateLinks.length >= 3) {
      watchedDate = `${viewDateLinks[0].textContent.trim()} ${viewDateLinks[1].textContent.trim()} ${viewDateLinks[2].textContent.trim()}`;
    }

    const rawParagraphs = Array.from(documentNode.querySelectorAll('.review-body p, .js-review-body p')).map(p => p.innerHTML);
    const reviewLines = cleanLetterboxdParagraphs(rawParagraphs);
    const posterImg =
      documentNode.querySelector('.film-poster img')?.getAttribute('src') ||
      documentNode.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      '';

    return {
      url: reviewUrl,
      movieTitle,
      releaseYear,
      reviewer,
      rating,
      isLiked,
      watchedDate,
      reviewLines,
      reviewBody: reviewLines.join('\n\n'),
      posterImg
    };
  } catch (error) {
    console.error('Failed to parse Letterboxd HTML:', error);
    return null;
  }
}
