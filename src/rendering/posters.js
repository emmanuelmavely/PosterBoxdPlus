import { renderFloatingTicketPoster } from './posters/floating-ticket.js';
import { renderClassicPoster } from './posters/classic.js';
import { renderEditorialPoster } from './posters/editorial.js';
import { renderPolaroidPoster } from './posters/polaroid.js';
import { renderCriterionPoster } from './posters/criterion.js';
import { renderTicketPoster } from './posters/ticket.js';
import { renderIosGlassPoster } from './posters/ios-glass.js';
import { renderScoreboardPoster } from './posters/scoreboard.js';
import { renderRetroPoster } from './posters/retro.js';
import { renderMarqueePoster } from './posters/marquee.js';
import { renderVipPassPoster } from './posters/vip-pass.js';

export const POSTER_RENDERERS = Object.freeze({
  floatingticket: renderFloatingTicketPoster,
  classic: renderClassicPoster,
  editorial: renderEditorialPoster,
  polaroid: renderPolaroidPoster,
  criterion: renderCriterionPoster,
  ticket: renderTicketPoster,
  iosglass: renderIosGlassPoster,
  scoreboard: renderScoreboardPoster,
  retro: renderRetroPoster,
  marquee: renderMarqueePoster,
  vippass: renderVipPassPoster
});
