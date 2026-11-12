export const CUSTOM_LOGO_SVG_DATA = `data:image/svg+xml;utf8,` + encodeURIComponent(`
  <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" rx="220" fill="#1C1B1A"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M270 196H556C718 196 814 290 814 432C814 574 718 668 556 668H402V828C402 848 386 864 366 864H270C250 864 234 848 234 828V232C234 212 250 196 270 196ZM402 332V532H544C624 532 674 494 674 432C674 370 624 332 544 332H402ZM268 272H330V334H268V272ZM268 386H330V448H268V386ZM268 500H330V562H268V500ZM268 614H330V676H268V614ZM268 728H330V790H268V728Z" fill="#F4EFE6"/>
  </svg>
`);

export const APP_VERSION = 'v1.5.0';
export const RELEASE_DATE = '2026-11-12';
export const CURRENT_RELEASE_NOTES = Object.freeze([
  'New iOS-style poster editor: the poster stays pinned while Style, Size, Artwork, Colour, Adjust, Details and Move tools sit underneath.',
  '11 new poster styles (22 in total), each with a live thumbnail of your own poster, plus a square 1:1 canvas.',
  'Mobile fixes: notch-safe header, drag positions now save, finger-sized controls, and Save opens the share sheet on iPhone.'
]);

export const ARCHETYPE_NAMES = Object.freeze({
  floatingticket: '1 / 22 · Floating Vintage Ticket',
  classic: '2 / 22 · Classic Centered',
  editorial: '3 / 22 · Full-Bleed Editorial',
  polaroid: '4 / 22 · Polaroid Gallery Frame',
  criterion: '5 / 22 · Criterion Arthouse Split',
  ticket: '6 / 22 · Full Cinema Ticket Stub',
  iosglass: '7 / 22 · Apple iOS Glass Card',
  scoreboard: '8 / 22 · Big Score & One-Liner',
  retro: '9 / 22 · 70s Retro Grindhouse',
  marquee: '10 / 22 · Movie Theater Marquee',
  vippass: '11 / 22 · VIP Screening Pass',
  brutalist: '12 / 22 · Brutalist Verdict Tape',
  contactsheet: '13 / 22 · 35mm Contact Sheet',
  glassplayer: '14 / 22 · Glass Media Player',
  receipt: '15 / 22 · Thermal Cinema Receipt',
  swissgrid: '16 / 22 · Swiss Archival Grid',
  billboard: '17 / 22 · Press Billboard',
  archivestub: '18 / 22 · 35mm Archive Stub',
  spatial: '19 / 22 · Spatial Glass Window',
  glassstack: '20 / 22 · Glass Widget Stack',
  splitspread: '21 / 22 · Split-Tone Spread',
  archivepass: '22 / 22 · Instant-Photo Archive Pass'
});

export const ARCHETYPE_KEYS = Object.keys(ARCHETYPE_NAMES);

export const EXTENDED_REVIEW_ARCHETYPES = new Set(['polaroid', 'iosglass', 'vippass']);
export const DEFAULT_REVIEW_CHARACTER_LIMIT = 220;
export const EXTENDED_REVIEW_CHARACTER_LIMIT = 500;
export const DEFAULT_DETAILED_REVIEW_CHARACTER_LIMIT = 500;
export const MIN_DETAILED_REVIEW_CHARACTER_LIMIT = 1;
export const MAX_DETAILED_REVIEW_CHARACTER_LIMIT = 10000;

export const DEFAULT_DETAILED_REVIEW_CHARACTER_LIMITS = Object.freeze({
  floatingticket: 350,
  classic: 350,
  editorial: 350,
  polaroid: 770,
  criterion: 450,
  ticket: 500,
  iosglass: 500,
  scoreboard: 500,
  retro: 500,
  marquee: 280,
  vippass: 750,
  brutalist: 350,
  contactsheet: 350,
  glassplayer: 400,
  receipt: 450,
  swissgrid: 350,
  billboard: 350,
  archivestub: 350,
  spatial: 350,
  glassstack: 350,
  splitspread: 350,
  archivepass: 350,
  design12: 350
});

export const DEFAULT_DETAILED_REVIEW_CHARACTER_LIMITS_BY_NUMBER = Object.freeze([
  350, 350, 350, 770, 450, 500, 500, 500, 500, 280, 750, 350
]);

export function getDefaultDetailedReviewCharacterLimit(archetype) {
  return DEFAULT_DETAILED_REVIEW_CHARACTER_LIMITS[archetype] || DEFAULT_DETAILED_REVIEW_CHARACTER_LIMIT;
}

export function getReviewCharacterLimit(archetype) {
  return EXTENDED_REVIEW_ARCHETYPES.has(archetype)
    ? EXTENDED_REVIEW_CHARACTER_LIMIT
    : DEFAULT_REVIEW_CHARACTER_LIMIT;
}

export const STORY_SAFE_ZONE = Object.freeze({
  width: 1080,
  height: 1920,
  dangerTop: 155,
  dangerBottom: 155,
  safeHeight: 1610,
  safeTop: 155,
  safeBottom: 1765
});
