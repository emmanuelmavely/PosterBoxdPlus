import { state } from '../state.js';

const DEFAULT_TMDB_PROXY_BASE = 'https://posterboxd-tmdb-proxy.jaygatsby.workers.dev/api/tmdb';

function getTmdbProxyBase() {
  if (typeof window !== 'undefined') {
    const configuredBase = window.__POSTERBOXD_TMDB_PROXY_URL__;
    if (typeof configuredBase === 'string') {
      return configuredBase.trim().replace(/\/$/, '');
    }
  }
  return DEFAULT_TMDB_PROXY_BASE;
}

export function hasTmdbAccess() {
  return Boolean((state.tmdbApiKey || '').trim() || getTmdbProxyBase());
}

export async function tmdbFetch(endpoint, params = {}) {
  const key = (state.tmdbApiKey || '').trim();
  const baseUrl = key ? 'https://api.themoviedb.org/3' : getTmdbProxyBase();
  const url = new URL(`${baseUrl}${endpoint}`);
  Object.entries(params).forEach(([keyName, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(keyName, value);
  });
  const headers = { Accept: 'application/json' };
  if (key) {
    if (key.length > 45) {
      headers.Authorization = `Bearer ${key}`;
    } else {
      url.searchParams.set('api_key', key);
    }
  }
  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`TMDB HTTP ${response.status}`);
  }
  return response.json();
}

export function detectBrowserRegion() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const timezoneMap = {
      'Asia/Kolkata': { code: 'IN', name: 'India' },
      'Asia/Calcutta': { code: 'IN', name: 'India' },
      'Europe/Warsaw': { code: 'PL', name: 'Poland' },
      'Europe/London': { code: 'GB', name: 'UK' },
      'Europe/Berlin': { code: 'DE', name: 'Germany' },
      'Europe/Paris': { code: 'FR', name: 'France' },
      'America/New_York': { code: 'US', name: 'USA' },
      'America/Los_Angeles': { code: 'US', name: 'USA' },
      'America/Chicago': { code: 'US', name: 'USA' },
      'America/Toronto': { code: 'CA', name: 'Canada' },
      'Australia/Sydney': { code: 'AU', name: 'Australia' },
      'Asia/Tokyo': { code: 'JP', name: 'Japan' },
      'Asia/Dubai': { code: 'AE', name: 'UAE' },
      'Asia/Singapore': { code: 'SG', name: 'Singapore' }
    };
    if (timezoneMap[timezone]) return timezoneMap[timezone];
    const languageRegion = (navigator.language || 'en-US').split('-')[1];
    if (languageRegion && languageRegion.length === 2) {
      return { code: languageRegion.toUpperCase(), name: languageRegion.toUpperCase() };
    }
  } catch (error) {
    // Fall through to the stable default region.
  }
  return { code: 'US', name: 'Your Region' };
}
