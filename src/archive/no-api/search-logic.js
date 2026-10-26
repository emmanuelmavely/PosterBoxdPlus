export function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function editDistance(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let row = 1; row <= a.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= b.length; column += 1) {
      const nextDiagonal = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (a[row - 1] === b[column - 1] ? 0 : 1)
      );
      diagonal = nextDiagonal;
    }
  }
  return previous[b.length];
}

function tokenScore(queryToken, titleTokens) {
  return Math.max(
    0,
    ...titleTokens.map((titleToken) => {
      if (titleToken === queryToken) return 1;
      if (titleToken.includes(queryToken) || queryToken.includes(titleToken)) return 0.85;
      if (queryToken.length < 4) return 0;
      const distance = editDistance(queryToken, titleToken);
      const limit = Math.max(1, Math.floor(Math.max(queryToken.length, titleToken.length) * 0.34));
      return distance <= limit ? 1 - distance / Math.max(queryToken.length, titleToken.length) : 0;
    })
  );
}

export function searchMatchScore(query, title) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTitle = normalizeSearchText(title);
  if (!normalizedQuery || !normalizedTitle) return 0;
  if (normalizedTitle === normalizedQuery) return 1;
  if (normalizedTitle.includes(normalizedQuery)) return 0.98;

  const queryTokens = normalizedQuery.split(/\s+/);
  const titleTokens = normalizedTitle.split(/\s+/);
  const scores = queryTokens.map((token) => tokenScore(token, titleTokens));
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

export function rankSearchResults(query, results) {
  return results
    .map((item, index) => ({
      item,
      index,
      score: searchMatchScore(query, item.title || item.name)
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
}

export function hasStrongSearchMatch(query, results, threshold = 0.72) {
  return rankSearchResults(query, results)[0]?.score >= threshold;
}

export function buildFallbackQueries(query, maximum = 3) {
  return [...new Set(normalizeSearchText(query).split(/\s+/).filter((token) => token.length >= 3))]
    .sort((left, right) => right.length - left.length)
    .slice(0, maximum);
}
