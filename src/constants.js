export const CUSTOM_LOGO_SVG_DATA = `data:image/svg+xml;utf8,` + encodeURIComponent(`
  <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" rx="220" fill="#1C1B1A"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M270 196H556C718 196 814 290 814 432C814 574 718 668 556 668H402V828C402 848 386 864 366 864H270C250 864 234 848 234 828V232C234 212 250 196 270 196ZM402 332V532H544C624 532 674 494 674 432C674 370 624 332 544 332H402ZM268 272H330V334H268V272ZM268 386H330V448H268V386ZM268 500H330V562H268V500ZM268 614H330V676H268V614ZM268 728H330V790H268V728Z" fill="#F4EFE6"/>
  </svg>
`);

export const APP_VERSION = 'v1.3.1';

export const ARCHETYPE_NAMES = Object.freeze({
  floatingticket: '1 / 11 · Floating Vintage Ticket',
  classic: '2 / 11 · Classic Centered',
  editorial: '3 / 11 · Full-Bleed Editorial',
  polaroid: '4 / 11 · Polaroid Gallery Frame',
  criterion: '5 / 11 · Criterion Arthouse Split',
  ticket: '6 / 11 · Full Cinema Ticket Stub',
  iosglass: '7 / 11 · Apple iOS Glass Card',
  scoreboard: '8 / 11 · Big Score & One-Liner',
  retro: '9 / 11 · 70s Retro Grindhouse',
  marquee: '10 / 11 · Movie Theater Marquee',
  vippass: '11 / 11 · VIP Screening Pass'
});

export const ARCHETYPE_KEYS = Object.keys(ARCHETYPE_NAMES);
