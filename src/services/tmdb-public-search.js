import {
  buildFallbackQueries,
  hasStrongSearchMatch,
  rankSearchResults
} from './search-logic.js';

const TMDB_BASE = 'https://www.themoviedb.org';
const READER_BASE = 'https://r.jina.ai/https://www.themoviedb.org';

const PROXY_CANDIDATES = [
  {
    name: 'CORS Proxy (tyxc)',
    wrap: (targetUrl) => `https://cors.tyxc.org/${targetUrl}`
  },
  {
    name: 'CORS Dev proxy',
    wrap: (targetUrl) => `https://proxy.cors.dev/${targetUrl}`
  },
  {
    name: 'Jina public-page reader',
    wrap: (targetUrl) =>
      targetUrl.startsWith(TMDB_BASE)
        ? targetUrl.replace(TMDB_BASE, READER_BASE)
        : targetUrl
  },
  {
    name: 'Cloudflare CORS proxy',
    wrap: (targetUrl) => `https://test.cors.workers.dev/?${targetUrl}`
  },
  {
    name: 'CORS Anywhere',
    wrap: (targetUrl) => `https://cors-anywhere.herokuapp.com/${targetUrl}`
  }
];

const CACHE_PREFIX = 'posterboxd-tmdb-public:v1:';
const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 25000;

let preferredProxyIndex = 0;

function debugLog(event, details = {}) {
  if (typeof window !== 'undefined' && window.__TMDB_DEBUG__) {
    console.info(`[TMDB-Public] ${event}`, details);
  }
}

export async function fetchText(targetUrl, isUsable = () => true) {
  const errors = [];
  const candidateIndexes = PROXY_CANDIDATES.map((_, index) =>
    (preferredProxyIndex + index) % PROXY_CANDIDATES.length
  );
  debugLog('request:start', { target: targetUrl });

  for (const proxyIndex of candidateIndexes) {
    const proxy = PROXY_CANDIDATES[proxyIndex];
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const startedAt = performance.now();

    try {
      const response = await fetch(proxy.wrap(targetUrl), {
        signal: controller.signal
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`${proxy.name} returned HTTP ${response.status}`);
      }
      if (!isUsable(text)) {
        throw new Error(`${proxy.name} returned an unexpected page`);
      }
      preferredProxyIndex = proxyIndex;
      debugLog('request:ok', {
        proxy: proxy.name,
        status: response.status,
        bytes: text.length,
        ms: Math.round(performance.now() - startedAt)
      });
      return text;
    } catch (error) {
      const message = error.name === 'AbortError' ? 'timed out' : error.message;
      errors.push(`${proxy.name}: ${message}`);
      debugLog('request:fail', {
        proxy: proxy.name,
        error: message,
        ms: Math.round(performance.now() - startedAt)
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw new Error(`All CORS proxies failed. ${errors.join('; ')}`);
}

function cacheKey(kind, value) {
  return `${CACHE_PREFIX}${kind}:${value}`;
}

function readCache(kind, value) {
  try {
    const raw = localStorage.getItem(cacheKey(kind, value));
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(kind, value));
      return null;
    }
    return cached.value;
  } catch {
    return null;
  }
}

function writeCache(kind, value, data) {
  try {
    const cacheValue = structuredClone(data);
    if (cacheValue && typeof cacheValue === 'object') {
      delete cacheValue._raw_public_page;
    }
    localStorage.setItem(
      cacheKey(kind, value),
      JSON.stringify({ timestamp: Date.now(), value: cacheValue })
    );
  } catch {
    // Caching quota shouldn't break search
  }
}

export function cleanText(value) {
  return String(value || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanHtmlText(value) {
  return cleanText(value).replace(/\u00a0/g, ' ');
}

export function extractYear(value) {
  return String(value || '').match(/\b((?:19|20)\d{2})\b/)?.[1] || null;
}

export function mediaPath(url) {
  const match = String(url || '').match(/\/t\/p\/[^/]+(\/[^/?#]+)$/);
  return match ? match[1] : null;
}

export function extractPublicDate(value) {
  const text = String(value || '');
  const isoMatch = text.match(/\b((?:19|20)\d{2})[-./](\d{1,2})[-./](\d{1,2})\b/);
  if (isoMatch) {
    return {
      date: `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, '0')}-${String(isoMatch[3]).padStart(2, '0')}`,
      text: `${text.slice(0, isoMatch.index)}${text.slice(isoMatch.index + isoMatch[0].length)}`.trim()
    };
  }

  const dayFirstMatch = text.match(/\b(\d{1,2})[./-](\d{1,2})[-./]((?:19|20)\d{2})\b/);
  if (dayFirstMatch) {
    return {
      date: `${dayFirstMatch[3]}-${String(dayFirstMatch[2]).padStart(2, '0')}-${String(dayFirstMatch[1]).padStart(2, '0')}`,
      text: `${text.slice(0, dayFirstMatch.index)}${text.slice(dayFirstMatch.index + dayFirstMatch[0].length)}`.trim()
    };
  }

  const match = text.match(/([A-Z][a-z]+) (\d{1,2}), ((?:19|20)\d{2})/);
  if (!match) return { date: null, text: value };

  const months = {
    January: '01', February: '02', March: '03', April: '04',
    May: '05', June: '06', July: '07', August: '08',
    September: '09', October: '10', November: '11', December: '12'
  };
  const date = `${match[3]}-${months[match[1]]}-${String(match[2]).padStart(2, '0')}`;
  return {
    date,
    text: `${value.slice(0, match.index)}${value.slice(match.index + match[0].length)}`.trim()
  };
}

export function parseTmdbLink(href, expectedType) {
  let normalizedHref = String(href || '');
  try {
    normalizedHref = new URL(normalizedHref, TMDB_BASE).pathname;
  } catch {}
  const match = normalizedHref.match(
    /^\/(movie|tv)\/(\d+)(?:-[^/?#]*)?(?:[?#].*)?$/
  );
  if (!match || (expectedType && match[1] !== expectedType)) return null;
  return { mediaType: match[1], id: Number(match[2]) };
}

function makeSearchItem({ id, mediaType, title, overview, posterUrl, releaseDate, tmdbUrl }) {
  const pPath = mediaPath(posterUrl);
  const item = {
    adult: null,
    backdrop_path: null,
    genre_ids: [],
    id,
    media_type: mediaType,
    overview: cleanText(overview),
    poster_path: pPath,
    poster_url: posterUrl || (pPath ? `https://image.tmdb.org/t/p/w780${pPath}` : ''),
    popularity: null,
    tmdb_url: tmdbUrl,
    vote_average: null,
    vote_count: null,
    is_no_api: true
  };
  item[mediaType === 'movie' ? 'title' : 'name'] = cleanText(title) || 'Untitled';
  if (releaseDate) item[mediaType === 'movie' ? 'release_date' : 'first_air_date'] = releaseDate;
  const releaseYear = extractYear(releaseDate);
  if (releaseYear) item.release_year = releaseYear;
  return item;
}

function findCard(link) {
  return (
    link.closest("[data-object-id], [class*='media-card'], .card, .card_wrapper, .item, article, li") ||
    link.parentElement ||
    link
  );
}

function firstText(root, selectors) {
  for (const selector of selectors) {
    const node = root.querySelector(selector);
    const text = cleanHtmlText(node?.textContent);
    if (text) return text;
  }
  return '';
}

export function isTmdbSearchPage(text) {
  const value = String(text || '');
  const hasQueryInput =
    /<input[^>]+name=["']query["'][^>]*value=["'][^"']+[^>]*>/i.test(value) ||
    /<input[^>]+value=["'][^"']+[^>]*name=["']query["'][^>]*>/i.test(value);
  const hasSearchTitle = /<title>[^<]*(?:&#8212;|—)[^<]*the movie database \(tmdb\)/i.test(value);
  return (
    (/the movie database \(tmdb\)/i.test(value) && (hasQueryInput || hasSearchTitle)) ||
    /URL Source: .*\/search\/(?:movie|tv)/i.test(value) ||
    /title:\s*[^—\n]+[—–-]\s*the movie database/i.test(value)
  );
}

export function parseSearchHtml(html, mediaType) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const items = [];
  const seen = new Set();

  for (const link of doc.querySelectorAll('a[href]')) {
    const parsedLink = parseTmdbLink(link.getAttribute('href'), mediaType);
    if (!parsedLink || seen.has(parsedLink.id)) continue;

    const card = findCard(link);
    const image = link.querySelector('img') || card.querySelector('img');
    const posterUrl = image?.currentSrc || image?.getAttribute('src') || image?.dataset.src || '';
    let title = image?.getAttribute('alt') || '';
    title = title.replace(/^Image \d+:\s*/i, '');
    title ||= firstText(card, ['.title', '.title a', 'h2', 'h3']);
    title ||= cleanHtmlText(link.textContent);

    const overview = firstText(card, ['.overview', '.overview p', '.content p', 'p']);
    const cardText = card.textContent || '';
    const metadata = firstText(card, ['.release_date', '.date', '.meta']);
    const publicDate = extractPublicDate(`${metadata} ${cardText}`);
    const dateMatch = `${metadata} ${cardText}`.match(
      /(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{4})/
    );
    let releaseDate = dateMatch?.[1] || publicDate.date || null;
    if (!releaseDate && dateMatch?.[2]) {
      const [month, day, year] = dateMatch[2].split('/');
      releaseDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    if (!releaseDate) {
      releaseDate = extractYear(cardText);
    }

    seen.add(parsedLink.id);
    items.push(
      makeSearchItem({
        id: parsedLink.id,
        mediaType,
        title,
        overview,
        posterUrl,
        releaseDate,
        tmdbUrl: `${TMDB_BASE}/${mediaType}/${parsedLink.id}`
      })
    );
  }
  return items;
}

export function parseSearchMarkdown(markdown, mediaType) {
  const pattern =
    /\[!\[Image \d+: ([^\]]+)\]\((https?:\/\/[^)]+)\)\]\((https?:\/\/(?:www\.)?themoviedb\.org\/(movie|tv)\/(\d+)(?:-[^)]*)?)\)\n\n([\s\S]*?)(?=\n\n\[!\[Image|\s*$)/g;
  const items = [];
  const seen = new Set();

  for (const match of markdown.matchAll(pattern)) {
    if (match[4] !== mediaType) continue;
    const id = Number(match[5]);
    if (seen.has(id)) continue;
    seen.add(id);

    let overview = cleanText(match[6]);
    const publicDate = extractPublicDate(overview);
    overview = publicDate.text;
    items.push(
      makeSearchItem({
        id,
        mediaType,
        title: match[1],
        overview,
        posterUrl: match[2],
        releaseDate: publicDate.date,
        tmdbUrl: match[3]
      })
    );
  }
  return items;
}

async function fetchPage(path, parser) {
  const directUrl = `${TMDB_BASE}${path}`;
  let directError = null;
  const hasExpectedData = (text) => !parser(text, directUrl).empty;

  try {
    const directText = await fetchText(directUrl, hasExpectedData);
    const directValue = parser(directText, directUrl);
    if (!directValue.empty) return directValue;
  } catch (error) {
    directError = error;
  }

  const readerUrl = `${READER_BASE}${path}`;
  try {
    const readerText = await fetchText(readerUrl, hasExpectedData);
    const readerValue = parser(readerText, directUrl);
    if (!readerValue.empty) return readerValue;
    throw new Error('The page was retrieved but no expected TMDB data was found.');
  } catch (readerError) {
    const detail = readerError?.message || directError?.message || 'Unknown request error';
    throw new Error(detail);
  }
}

async function fetchSearchType(mediaType, query) {
  const path = `/search/${mediaType}?${new URLSearchParams({ query, page: '1', language: 'en-US' })}`;
  const cached = readCache('search', `${mediaType}:${query.toLowerCase()}`);
  if (cached) return cached;

  const page = await fetchPage(path, (text) => {
    const htmlResults = /<html|<body|<div/i.test(text)
      ? parseSearchHtml(text, mediaType)
      : [];
    const results = htmlResults.length ? htmlResults : parseSearchMarkdown(text, mediaType);
    const validSearchPage = isTmdbSearchPage(text);
    return { empty: !validSearchPage, results };
  });
  writeCache('search', `${mediaType}:${query.toLowerCase()}`, page.results);
  return page.results;
}

export async function fetchSearchMulti(query) {
  const [movies, tv] = await Promise.all([
    fetchSearchType('movie', query).catch(() => []),
    fetchSearchType('tv', query).catch(() => [])
  ]);
  const results = [];
  const seen = new Set();
  for (const item of [...movies, ...tv]) {
    const key = `${item.media_type}:${item.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(item);
    }
  }

  return {
    page: 1,
    results,
    total_pages: 1,
    total_results: results.length
  };
}

export async function searchPublicTmdb(query) {
  const normalizedQuery = query.trim();
  const cacheKeyValue = normalizedQuery.toLowerCase();
  const cached = readCache('multi', cacheKeyValue);
  if (cached) return cached;

  let response = null;
  let exactError = null;
  try {
    response = await fetchSearchMulti(normalizedQuery);
  } catch (error) {
    exactError = error;
    response = { page: 1, results: [], total_pages: 1, total_results: 0 };
  }

  let matchedQuery = normalizedQuery;
  if (!hasStrongSearchMatch(normalizedQuery, response.results)) {
    const fallbackQueries = buildFallbackQueries(normalizedQuery);
    const fallbackResults = [];

    for (const fallbackQuery of fallbackQueries) {
      try {
        const candidate = await fetchSearchMulti(fallbackQuery);
        fallbackResults.push(...candidate.results);
      } catch (error) {}
    }

    const rankedFallback = rankSearchResults(normalizedQuery, fallbackResults);
    const closeResults = rankedFallback
      .filter(({ score }) => score >= 0.55)
      .slice(0, 40)
      .map(({ item }) => item);
    if (rankedFallback[0]?.score >= 0.72) {
      response = { ...response, results: closeResults, total_results: closeResults.length };
      matchedQuery = fallbackQueries.join(' + ') || normalizedQuery;
    }
  }

  if (exactError && matchedQuery === normalizedQuery && response.results.length === 0) {
    throw exactError;
  }

  if (matchedQuery !== normalizedQuery) response.matched_query = matchedQuery;
  writeCache('multi', cacheKeyValue, response);
  return response;
}

function emptyDetail(item, sourceUrl) {
  const titleKey = item.media_type === 'movie' ? 'title' : 'name';
  const dateKey = item.media_type === 'movie' ? 'release_date' : 'first_air_date';
  return {
    adult: null,
    backdrop_path: null,
    backdrop_url: '',
    credits: { cast: [], crew: [] },
    genres: [],
    id: item.id,
    keywords: { [item.media_type === 'movie' ? 'keywords' : 'results']: [] },
    media_type: item.media_type,
    overview: item.overview || '',
    poster_path: item.poster_path || null,
    poster_url: item.poster_url || '',
    source_url: sourceUrl,
    release_year: item.release_year || null,
    director: '',
    writer: '',
    runtime: null,
    vote_average: null,
    all_posters: [],
    all_backdrops: [],
    [dateKey]: item[dateKey] || '',
    [titleKey]: item[titleKey] || 'Untitled'
  };
}

function parseDetailHtml(html, item, sourceUrl) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const parsed = emptyDetail(item, sourceUrl);
  const titleKey = item.media_type === 'movie' ? 'title' : 'name';
  let foundTitle = false;

  const ratingMatch = html.match(/"ratingValue"\s*:\s*([0-9.]+)/i)
    || html.match(/data-percent="([0-9.]+)"/i)
    || html.match(/user_score_chart[^>]*data-percent="([0-9.]+)"/i);
  if (ratingMatch) {
    const rawVal = parseFloat(ratingMatch[1]);
    parsed.vote_average = rawVal > 10 ? (rawVal / 10) : rawVal;
  }

  const title = firstText(doc, ['h2.title', 'h1.title', 'h2 a', 'h2', 'h1']);
  if (title) {
    parsed[titleKey] = title;
    foundTitle = true;
  }

  const metaTitle = doc.querySelector('meta[property="og:title"]')?.content;
  if (metaTitle && (!title || metaTitle.length < title.length + 20)) {
    parsed[titleKey] = metaTitle.replace(/\s+\|\s+TMDB$/i, '').trim();
    foundTitle = true;
  }

  const poster = doc.querySelector(
    'img[src*="w300_and_h450"], img[src*="poster"], img[data-src*="poster"]'
  );
  const posterUrl = poster?.currentSrc || poster?.getAttribute('src') || poster?.dataset.src || '';
  if (posterUrl) {
    parsed.poster_url = posterUrl;
    parsed.poster_path = mediaPath(posterUrl);
  }

  const backdrop = doc.querySelector(
    'img[src*="w533_and_h300"], img[data-src*="w533_and_h300"]'
  );
  const backdropUrl = backdrop?.currentSrc || backdrop?.getAttribute('src') || backdrop?.dataset.src || '';
  if (backdropUrl) {
    parsed.backdrop_url = backdropUrl;
    parsed.backdrop_path = mediaPath(backdropUrl);
  }

  const overviewNode = doc.querySelector('.overview, .overview p, [data-role="overview"]');
  if (overviewNode) parsed.overview = cleanHtmlText(overviewNode.textContent);

  const bodyText = cleanHtmlText(doc.body?.textContent);
  const publicDate = extractPublicDate(bodyText);
  const dateKey = item.media_type === 'movie' ? 'release_date' : 'first_air_date';
  if (publicDate.date) parsed[dateKey] = publicDate.date;
  if (!parsed.release_year) parsed.release_year = extractYear(bodyText);

  for (const link of doc.querySelectorAll('a[href*="/genre/"]')) {
    const match = link.getAttribute('href')?.match(/\/genre\/(\d+)-/);
    const name = cleanHtmlText(link.textContent);
    if (match && name && !parsed.genres.some((genre) => genre.id === Number(match[1]))) {
      parsed.genres.push({ id: Number(match[1]), name });
    }
  }

  const runtime = bodyText.match(/(\d+)h(?:\s+(\d+)m)?/);
  if (runtime) parsed.runtime = Number(runtime[1]) * 60 + Number(runtime[2] || 0);

  const cast = [];
  const castIds = new Set();
  for (const link of doc.querySelectorAll('a[href*="/person/"]')) {
    const match = link.getAttribute('href')?.match(/\/person\/(\d+)/);
    const name = cleanHtmlText(link.textContent);
    if (!match || !name || castIds.has(match[1])) continue;
    const row = link.closest('li, .card, .cast_card, .item') || link.parentElement;
    const rowText = cleanHtmlText(row?.textContent).replace(name, '').trim();
    castIds.add(match[1]);

    if (/director/i.test(rowText) && !parsed.director) {
      parsed.director = name;
    } else if (/screenplay|writer|story/i.test(rowText) && !parsed.writer) {
      parsed.writer = name;
    }
    cast.push({ id: Number(match[1]), name, character: rowText });
  }
  parsed.credits.cast = cast.slice(0, 30);

  // Discover all TMDB artwork images
  const discoveredPosters = [];
  const discoveredBackdrops = [];
  for (const img of doc.querySelectorAll('img[src*="/t/p/"]')) {
    const src = img.currentSrc || img.src || '';
    const path = mediaPath(src);
    if (path) {
      if (src.includes('w533') || src.includes('w1280') || src.includes('backdrop')) {
        discoveredBackdrops.push(`https://image.tmdb.org/t/p/w1280${path}`);
      } else {
        discoveredPosters.push(`https://image.tmdb.org/t/p/w780${path}`);
      }
    }
  }
  parsed.all_posters = Array.from(new Set(discoveredPosters));
  parsed.all_backdrops = Array.from(new Set(discoveredBackdrops));

  parsed._raw_public_page = html;
  return { empty: !foundTitle, value: parsed };
}

function parseDetailMarkdown(markdown, item, sourceUrl) {
  const parsed = emptyDetail(item, sourceUrl);
  const titleKey = item.media_type === 'movie' ? 'title' : 'name';
  let foundTitle = false;

  const ratingMatch = markdown.match(/"ratingValue"\s*:\s*([0-9.]+)/i)
    || markdown.match(/(\d{1,2})%\s*(?:User Score|Score)/i)
    || markdown.match(/User\s+Score[\s\S]{1,40}?(\d{1,2})%/i);
  if (ratingMatch) {
    const rawVal = parseFloat(ratingMatch[1]);
    parsed.vote_average = rawVal > 10 ? (rawVal / 10) : rawVal;
  }

  const titleMatch = markdown.match(new RegExp(`^## \\[([^\\]]+)\\]\\([^)]*\\)\\((\\d{4})\\)$`, 'm'));
  if (titleMatch) {
    parsed[titleKey] = titleMatch[1];
    parsed.year = Number(titleMatch[2]);
    foundTitle = true;
  }

  const metadataMatch = markdown.match(
    /^## \[[^\]]+\]\([^)]*\)\(\d{4}\)\n\n([\s\S]*?)(?=\n\n### )/m
  );
  const metadata = metadataMatch?.[1] || '';
  const publicDate = extractPublicDate(metadata);
  const dateMatch = metadata.match(/(\d{2})\/(\d{2})\/(\d{4}) \(([^)]+)\)/);
  if (publicDate.date) {
    parsed[item.media_type === 'movie' ? 'release_date' : 'first_air_date'] = publicDate.date;
  }
  if (!parsed.release_year) parsed.release_year = extractYear(parsed.release_date || parsed.first_air_date || markdown);
  if (item.media_type === 'tv' && !parsed.first_air_date) {
    const premiere = markdown.match(/premiered on ([A-Z][a-z]+ \d{1,2}, \d{4})/);
    if (premiere) parsed.first_air_date = extractPublicDate(premiere[1]).date;
  }

  const genrePattern = /\[([^\]]+)\]\(https?:\/\/(?:www\.)?themoviedb\.org\/genre\/(\d+)-[^)]*\)/g;
  for (const match of metadata.matchAll(genrePattern)) {
    parsed.genres.push({ id: Number(match[2]), name: match[1] });
  }
  const runtime = metadata.match(/(\d+)h(?:\s+(\d+)m)?/);
  if (runtime) parsed.runtime = Number(runtime[1]) * 60 + Number(runtime[2] || 0);

  const overviewMatch = markdown.match(
    /### Overview\n\n([\s\S]*?)(?=\n\n(?:\d+\.\s+|### |#### ))/
  );
  if (overviewMatch) parsed.overview = cleanText(overviewMatch[1]);

  const castSection = markdown.match(
    /### (?:Top Billed Cast|Series Cast|Featured Crew)\n\n([\s\S]*?)(?=\n\n### )/
  );
  const castPattern =
    /\[([^\]!][^\]]*)\]\(https?:\/\/(?:www\.)?themoviedb\.org\/person\/(\d+)[^)]*\)\n\n([^\n]+)/g;
  for (const match of (markdown).matchAll(castPattern)) {
    const name = match[1];
    const role = cleanText(match[3]);
    if (/director/i.test(role) && !parsed.director) {
      parsed.director = name;
    } else if (/screenplay|writer|story/i.test(role) && !parsed.writer) {
      parsed.writer = name;
    }
    parsed.credits.cast.push({
      id: Number(match[2]),
      name,
      character: role
    });
  }

  // Extract all media paths from markdown image tags
  const discoveredPosters = [];
  const discoveredBackdrops = [];
  const imgPattern = /!\[([^\]]*)\]\((https:\/\/media\.themoviedb\.org\/t\/p\/[^\/]+(\/[^?#)]+))\)/g;
  for (const match of markdown.matchAll(imgPattern)) {
    const p = match[3];
    if (p.endsWith('.jpg') || p.endsWith('.png')) {
      if (match[2].includes('w533') || match[2].includes('w1280')) {
        discoveredBackdrops.push(`https://image.tmdb.org/t/p/w1280${p}`);
      } else {
        discoveredPosters.push(`https://image.tmdb.org/t/p/w780${p}`);
      }
    }
  }

  if (discoveredPosters.length > 0) {
    parsed.poster_url = discoveredPosters[0];
    parsed.poster_path = mediaPath(discoveredPosters[0]);
  }
  if (discoveredBackdrops.length > 0) {
    parsed.backdrop_url = discoveredBackdrops[0];
    parsed.backdrop_path = mediaPath(discoveredBackdrops[0]);
  }

  parsed.all_posters = Array.from(new Set(discoveredPosters));
  parsed.all_backdrops = Array.from(new Set(discoveredBackdrops));
  parsed._raw_public_page = markdown;
  return { empty: !foundTitle, value: parsed };
}

export async function fetchPublicTmdbDetail(item) {
  const key = `${item.media_type}:${item.id}`;
  const cached = readCache('detail', key);
  if (cached) return cached;

  const path = `/${item.media_type}/${item.id}?language=en-US`;
  const page = await fetchPage(path, (text, sourceUrl) => {
    const isHtml = /<html|<body|<div/i.test(text);
    return isHtml ? parseDetailHtml(text, item, sourceUrl) : parseDetailMarkdown(text, item, sourceUrl);
  });
  writeCache('detail', key, page.value);
  return page.value;
}
