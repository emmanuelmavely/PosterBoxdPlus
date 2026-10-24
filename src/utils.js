export function formatSafeDate(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (m >= 1 && m <= 12) return `${d} ${months[m - 1]} ${y}`;
  }
  return dateStr;
}

export function buildRelevantMovieReview(title, director, cast, genre, mediaType = 'movie', rating = 0) {
  const castList = (cast || '').split(',').map(s => s.trim()).filter(Boolean);
  const lead = castList[0] || '';
  const duo = castList.slice(0, 2).join(' and ');
  const trio = castList.slice(0, 3).join(', ');
  const primaryGenre = (genre || '').split('|')[0]?.trim()?.toLowerCase() || (mediaType === 'tv' ? 'series' : 'cinema');
  const cleanTitle = title || (mediaType === 'tv' ? 'this series' : 'this film');
  const parsedRating = Number(rating);
  const numRating = Number.isFinite(parsedRating) ? parsedRating : 0;

  const isMasterpiece = numRating >= 4.5;
  const isPositive = numRating >= 3.5 && numRating < 4.5;
  const isUnrated = numRating <= 0;
  const isMixed = numRating > 0 && numRating < 3.5;

  const templates = [];

  // High rating / Masterpiece templates (4.5 - 5.0)
  if (isMasterpiece) {
    if (director && duo) {
      templates.push(`${director} orchestrates a breathtaking ${primaryGenre} triumph, ignited by the electric chemistry between ${duo}.`);
      templates.push(`A tour de force from ${director}. ${duo} turn in career-defining work in this hypnotic ${primaryGenre} masterpiece.`);
      templates.push(`${director} proves once again why cinema matters. ${duo} deliver sheer emotional resonance from start to finish.`);
    }
    if (director && lead) {
      templates.push(`${director} crafts an extraordinary ${primaryGenre} odyssey, driven by a transcendent lead turn from ${lead}.`);
      templates.push(`Pure auteur filmmaking. ${director} constructs a visionary world anchored by ${lead}'s riveting screen presence.`);
      templates.push(`${director} hits every emotional and visceral chord, elevating ${cleanTitle} into pure modern ${primaryGenre} lore.`);
    }
    if (trio) {
      templates.push(`Unmatched ensemble brilliance. ${trio} turn this ${primaryGenre} into an absolute masterclass of acting.`);
    }
    if (director) {
      templates.push(`${director} delivers a breathtaking, millimeter-perfect ${primaryGenre} symphony that demands to be experienced.`);
    }
    templates.push(`An indelible ${primaryGenre} triumph that lingers long after the credits roll. Pure five-star cinema.`);
    templates.push(`Stunning, immersive, and relentlessly compelling. Easily one of the finest ${primaryGenre} achievements in recent memory.`);
  } else if (isPositive) { // Good / Solid rating (3.5 - 4.0)
    if (director && duo) {
      templates.push(`${director} keeps the tension razor-sharp, with ${duo} delivering deeply engaging, magnetic performances.`);
      templates.push(`A thoroughly entertaining ${primaryGenre} ride from ${director}, carried by the sheer charisma of ${duo}.`);
    }
    if (director && lead) {
      templates.push(`${director} delivers a stylish, well-crafted ${primaryGenre} powered by a magnetic turn from ${lead}.`);
      templates.push(`${lead} commands every single frame under ${director}'s confident, kinetic direction.`);
    }
    if (lead) {
      templates.push(`A hugely satisfying ${primaryGenre} showcase, led by a fiercely charismatic performance from ${lead}.`);
    }
    templates.push(`A richly atmospheric ${primaryGenre} that delivers big thrills and genuine heart throughout.`);
    templates.push(`Smartly paced, visually inventive, and thoroughly absorbing from open to close.`);
  } else if (isUnrated) {
    if (director && lead) {
      templates.push(`An atmospheric ${primaryGenre} vision by ${director}, anchored by a compelling turn from ${lead}.`);
    }
    if (director) {
      templates.push(`${director} crafts a distinctive, visually immersive ${primaryGenre} experience.`);
    }
    templates.push(`A singular ${primaryGenre} experience with striking craft and memorable atmosphere.`);
  } else { // Mixed / Modest rating (< 3.5)
    if (director && lead) {
      templates.push(`${lead} gives everything to the role, even when ${director}'s ${primaryGenre} narrative strains under its ambitions.`);
    }
    if (lead) {
      templates.push(`Anchored by genuine moments of flair from ${lead}, offering enough bright spots to reward fans of ${primaryGenre}.`);
    }
    templates.push(`A bold, curious ${primaryGenre} swing with distinct flashes of brilliance scattered across its runtime.`);
  }

  // Genre-flavored spices stay inside the rating bucket so a low-rated
  // thriller cannot randomly receive masterpiece-level praise.
  if (isMasterpiece) {
    if (primaryGenre.includes('sci-fi') || primaryGenre.includes('science fiction')) {
      if (director && lead) templates.push(`${director} builds a colossal, mind-bending sci-fi tapestry anchored by ${lead}'s magnetic soul.`);
      templates.push(`A jaw-dropping sci-fi spectacle that pairs staggering scale with intimate existential dread.`);
    } else if (primaryGenre.includes('horror') || primaryGenre.includes('thriller')) {
      if (director && lead) templates.push(`${director} ratchets up relentless dread, pushing ${lead} to heart-stopping extremes.`);
      templates.push(`Tense, claustrophobic, and utterly unpredictable. A masterclass in sustained suspense.`);
    } else if (primaryGenre.includes('romance') || primaryGenre.includes('drama')) {
      if (duo) templates.push(`The unspoken longing between ${duo} burns right through the screen in this tender ${primaryGenre}.`);
      templates.push(`An aching, melancholic study of human connection that hits straight in the chest.`);
    } else if (primaryGenre.includes('action') || primaryGenre.includes('adventure')) {
      if (lead) templates.push(`Pure kinetic adrenaline. ${lead} powers through breathtaking set-pieces with relentless grit.`);
      templates.push(`A pulse-pounding thrill ride that rarely pauses to let you catch your breath.`);
    }
  } else if (isPositive) {
    if (primaryGenre.includes('sci-fi') || primaryGenre.includes('science fiction')) {
      templates.push(`A striking sci-fi ride that balances ambitious ideas with immersive world-building.`);
    } else if (primaryGenre.includes('horror') || primaryGenre.includes('thriller')) {
      templates.push(`A tense, well-calibrated thriller with enough sharp turns to keep the suspense alive.`);
    } else if (primaryGenre.includes('romance') || primaryGenre.includes('drama')) {
      if (duo) templates.push(`The chemistry between ${duo} gives this thoughtful ${primaryGenre} real emotional pull.`);
    } else if (primaryGenre.includes('action') || primaryGenre.includes('adventure')) {
      templates.push(`A confident action-adventure with tactile set pieces and a satisfying sense of momentum.`);
    }
  } else if (primaryGenre.includes('sci-fi') || primaryGenre.includes('science fiction')) {
    templates.push(`An ambitious sci-fi experiment with striking ideas that do not always fully land.`);
  } else if (primaryGenre.includes('horror') || primaryGenre.includes('thriller')) {
    templates.push(`A fitfully tense thriller with a few effective jolts amid uneven pacing.`);
  } else if (primaryGenre.includes('romance') || primaryGenre.includes('drama')) {
    templates.push(`A sincere but uneven ${primaryGenre} with flashes of feeling beneath the surface.`);
  } else if (primaryGenre.includes('action') || primaryGenre.includes('adventure')) {
    templates.push(`A lively action-adventure with standout moments, even when the momentum dips.`);
  }

  const selected = templates[Math.floor(Math.random() * templates.length)];
  return selected;
}

export function getSafeSlug(title) {
  return (title || 'poster').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
