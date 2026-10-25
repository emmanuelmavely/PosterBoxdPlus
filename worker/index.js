const ALLOWED_ORIGINS = new Set([
  'https://posterboxd.com',
  'https://www.posterboxd.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080'
]);

const TMDB_PREFIX = '/api/tmdb';
const CACHE_TTL_SECONDS = 86400;

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const isAllowedOrigin = ALLOWED_ORIGINS.has(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(isAllowedOrigin ? origin : 'https://posterboxd.com')
      });
    }

    if (request.method !== 'GET' || !isAllowedOrigin) {
      return jsonResponse({ error: 'Forbidden origin or method' }, 403, isAllowedOrigin ? origin : '');
    }

    const incomingUrl = new URL(request.url);
    if (incomingUrl.pathname !== TMDB_PREFIX && !incomingUrl.pathname.startsWith(`${TMDB_PREFIX}/`)) {
      return jsonResponse({ error: 'Unknown proxy path' }, 404, origin);
    }

    const tmdbReadToken = String(env.TMDB_READ_TOKEN || '').trim().replace(/^Bearer\s+/i, '');
    if (!tmdbReadToken) {
      return jsonResponse({ error: 'TMDB proxy is not configured' }, 503, origin);
    }

    const tmdbPath = incomingUrl.pathname.slice(TMDB_PREFIX.length) || '/configuration';
    const tmdbUrl = new URL(`https://api.themoviedb.org/3${tmdbPath}`);
    incomingUrl.searchParams.forEach((value, key) => {
      if (key !== 'api_key') tmdbUrl.searchParams.append(key, value);
    });

    const cacheKey = new Request(tmdbUrl.toString(), { method: 'GET' });
    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (!response) {
      const tmdbResponse = await fetch(tmdbUrl, {
        headers: {
          Authorization: `Bearer ${tmdbReadToken}`,
          Accept: 'application/json'
        }
      });

      response = new Response(tmdbResponse.body, tmdbResponse);
      if (tmdbResponse.ok) {
        response.headers.set(
          'Cache-Control',
          `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=3600`
        );
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
    }

    const headers = new Headers(response.headers);
    Object.entries(corsHeaders(origin)).forEach(([name, value]) => headers.set(name, value));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    Vary: 'Origin'
  };
}

function jsonResponse(body, status, origin = '') {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });
  if (origin) {
    Object.entries(corsHeaders(origin)).forEach(([name, value]) => headers.set(name, value));
  }

  return new Response(JSON.stringify(body), {
    status,
    headers
  });
}
