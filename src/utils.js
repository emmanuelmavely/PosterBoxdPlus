export function formatSafeDate(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (m >= 1 && m <= 12) return `${d} ${months[m - 1]} ${y}`;
  }
  return dateStr;
}

export function buildRelevantMovieReview(title, director, cast, genre, mediaType = 'movie') {
  const leadCast = (cast || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 2).join(' and ');
  const primaryGenre = (genre || '').split('|')[0]?.trim()?.toLowerCase() || (mediaType === 'tv' ? 'series' : 'cinema');
  if (director && leadCast) {
    return `${director} crafts a gripping ${primaryGenre} triumph, anchored by unforgettable performances from ${leadCast}.`;
  }
  if (director) {
    return `${director} delivers a masterclass in ${primaryGenre} storytelling with "${title || 'this film'}".`;
  }
  if (leadCast) {
    return `${leadCast} command the screen in a deeply atmospheric ${primaryGenre} experience.`;
  }
  return `An unforgettable ${primaryGenre} experience that lingers long after the credits roll.`;
}

export function getSafeSlug(title) {
  return (title || 'poster').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
