export async function loadCorsImage(url) {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = url;
    });
  }

  const candidates = [
    url + (url.includes('?') ? '&' : '?') + 'cors=1',
    `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=png`
  ];
  for (const candidate of candidates) {
    const loaded = await new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = candidate;
    });
    if (loaded) return loaded;
  }
  return null;
}

export function extractDominantPalette(img, fallbackPalette) {
  if (!img) return fallbackPalette;
  try {
    const sampleCanvas = document.createElement('canvas');
    const size = 64;
    sampleCanvas.width = size;
    sampleCanvas.height = size;
    const context = sampleCanvas.getContext('2d');
    context.drawImage(img, 0, 0, size, size);
    const { data } = context.getImageData(0, 0, size, size);
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 16) {
      if (data[i + 3] < 128) continue;
      const r = Math.min(255, Math.round(data[i] / 24) * 24);
      const g = Math.min(255, Math.round(data[i + 1] / 24) * 24);
      const b = Math.min(255, Math.round(data[i + 2] / 24) * 24);
      const key = `${r},${g},${b}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }

    const sorted = Array.from(buckets.entries())
      .map(([key, count]) => {
        const [r, g, b] = key.split(',').map(Number);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const score = count * (1 + saturation * 1.4) * (luminance > 18 && luminance < 245 ? 1.2 : 0.5);
        return { r, g, b, score };
      })
      .sort((a, b) => b.score - a.score);

    const chosen = [];
    const colorDistance = (first, second) => Math.hypot(first.r - second.r, first.g - second.g, first.b - second.b);
    for (const candidate of sorted) {
      if (chosen.length >= 5) break;
      if (chosen.every(color => colorDistance(color, candidate) > 52)) chosen.push(candidate);
    }
    for (const candidate of sorted) {
      if (chosen.length >= 5) break;
      if (!chosen.includes(candidate)) chosen.push(candidate);
    }

    const toHex = ({ r, g, b }) => '#' + [r, g, b].map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
    const hexes = chosen.slice(0, 5).map(toHex);
    while (hexes.length < 5) hexes.push('#2A2F3D');
    return hexes;
  } catch (error) {
    return fallbackPalette;
  }
}
