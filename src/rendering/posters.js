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
import { renderBrutalistPoster } from './posters/brutalist.js';
import { renderContactSheetPoster } from './posters/contact-sheet.js';
import { renderGlassPlayerPoster } from './posters/glass-player.js';
import { renderReceiptPoster } from './posters/receipt.js';
import {
  renderArchivePassPoster,
  renderArchiveStubPoster,
  renderBillboardPoster,
  renderSwissGridPoster
} from './posters/studio-editorial.js';
import {
  renderGlassStackPoster,
  renderSpatialWindowPoster,
  renderSplitSpreadPoster
} from './posters/studio-glass.js';

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
  vippass: renderVipPassPoster,
  brutalist: renderBrutalistPoster,
  contactsheet: renderContactSheetPoster,
  glassplayer: renderGlassPlayerPoster,
  receipt: renderReceiptPoster,
  swissgrid: renderSwissGridPoster,
  billboard: renderBillboardPoster,
  archivestub: renderArchiveStubPoster,
  spatial: renderSpatialWindowPoster,
  glassstack: renderGlassStackPoster,
  splitspread: renderSplitSpreadPoster,
  archivepass: renderArchivePassPoster
});
