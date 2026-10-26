# Changelog

All notable changes to **PosterBoxd** are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.3.9] - 2026-10-26

### Changed
- **Responsive Layout**: Improved narrow-header behavior, mobile content safe spacing, and poster preview sizing across short and tall viewports.
- **Desktop Preview Positioning**: Corrected sticky preview offsets relative to the header and disabled sticky positioning on short desktop screens where it constrains the workspace.
- **History Scrolling**: Removed the nested fixed-height history scroller in favor of natural page scrolling.
- **Accessibility Polish**: Restored browser zoom support, added consistent visible focus rings, and respected reduced-motion preferences.

## [v1.3.8] - 2026-10-25

### Changed
- **Hosted TMDB Only**: Removed the browser TMDB API-key button, modal, status indicator, and fallback credential path. The main runtime now uses the hosted Cloudflare Worker proxy exclusively.
- **Archived No-API Mode**: Moved the experimental public-page scraper and its search-ranking helper to `src/archive/no-api/`; they are no longer imported by the application.
- **Unified Enrichment**: Letterboxd imports and title searches now use the same proxy-backed TMDB JSON flow.

---

## [v1.3.7] - 2026-10-25

### Changed
- **Per-Design Live Poster Defaults**: Set the Detailed Review output defaults to 350, 350, 350, 770, 450, 500, 500, 500, 500, 280, and 750 characters for designs 1–11 respectively.
- **Independent Customization**: Changing the live poster limit now stores the value for the active design instead of applying one global value to every design.
- **Design 12 Reservation**: Added the requested 350-character default to the design-limit registry for the next poster renderer; the current app still contains 11 actual poster renderers.

---

## [v1.3.6] - 2026-10-25

### Changed
- **Letterboxd URL Flow**: Only direct Letterboxd URL fetches open Poster Studio immediately after loading; title searches and raw JSON retain their existing review flow.
- **Desktop Navigation**: Replaced the desktop breadcrumb row with persistent icon tabs for Home, Review Form, Poster Studio, and History.
- **Desktop Preview Fit**: Constrained the live poster stage to the available viewport height so the complete poster is visible without page scrolling.
- **Review Callout**: Changed the long Letterboxd label to italic `more on` text followed by a tiny Letterboxd mark.

---

## [v1.3.5] - 2026-10-25

### Changed
- **Live Poster Output Control**: Removed the per-design detailed-review line caps. The exact poster output limit now comes from the shared renderer and can be entered directly up to 10,000 characters.
- **Callout Rendering**: Removed the distracting green glow and switched the callout to a compact display treatment.
- **Letterboxd Callout**: Replaced the long green label with an italic `more on` treatment followed by a tiny Letterboxd mark.
- **Title Fitting**: Long titles now continue shrinking below the previous 24px floor; Polaroid titles can use three lines and Marquee bulb mode no longer silently falls back for long titles.
- **Search-to-Studio Flow**: Letterboxd result cards resolve a poster thumbnail when possible, then open Poster Studio through a loading transition after selection.

---

## [v1.3.4] - 2026-10-25

### Changed
- **Live Poster Review Limit**: The extended-review slider now controls how much Detailed Review / Notes text is rendered on the live poster. It no longer truncates the editing field or limits what can be typed.
- **Poster Truncation**: The selected output limit is applied by the shared poster text renderer, while the `Full review on Letterboxd profile` callout remains visible when the output is shortened.

---

## [v1.3.3] - 2026-10-25

### Added
- **Live Poster Review Limit Slider**: Added a Settings control for choosing how many Detailed Review / Notes characters appear on the live poster, from 220 to 2,000 characters, persisted locally between sessions. The input itself is not truncated.
- **What's New Menu**: The clickable version badge now opens a current-release panel with the active version highlighted and a direct link to the full changelog.
- **Startup Recovery**: The splash screen now has a font-loading timeout and startup recovery path so a slow font or network failure cannot leave the app stuck indefinitely.

### Changed
- **Letterboxd Profile Callout**: `Full review on Letterboxd profile` now renders as bold, green, and visually distinct from the surrounding extended review text in every poster design.
- **Design 1 Background Fade**: Extended the background image under the full poster and strengthened the lower black fade to eliminate the visible photo cutoff.
- **Design 4 Extended Review**: Increased the available extended-review lines for the Polaroid design.

---

## [v1.3.2] - 2026-10-25

### Added
- **Longer Reviews for Designs 4, 7, and 11**: Raised the review character limit to 500 for Polaroid Gallery Frame, Apple iOS Glass Card, and VIP Screening Pass, with expanded canvas line capacity to use the available space.

### Changed
- **Letterboxd Review Text Placement**: Imports now place only the first sentence in the One-Liner and move the remaining review text to Detailed Review.
- **No-API Letterboxd Metadata**: URL imports now retain Letterboxd-sourced director, writer, cast, genre, and runtime details through the TMDb matching and fallback flow.

### Fixed
- **Letterboxd Import History Error**: Added the missing history recorder import that caused `recordCurrentFetchToHistory is not defined` after a Letterboxd import.

---

## [v1.3.1] - 2026-10-24

### Added
- **Experimental No-API TMDB Search**: Users can now search movies and TV series directly in the browser without requiring a TMDb API key. Powered by a multi-proxy fallback rotation engine (`https://cors.tyxc.org/`, `https://proxy.cors.dev/`, `https://r.jina.ai/`, `https://test.cors.workers.dev/`) with client-side response validation, 15-minute caching, and public-page HTML/Markdown parsing.
- **Fuzzy Title Matching & Query Fallbacks (`search-logic.js`)**: Pure, UI-independent algorithmic module providing Levenshtein edit distance, token-level scoring, and fallback search query ranking to find close matches for misspellings.
- **Poster Footer Multi-Select Choice Chips**: Choice chips in Poster Studio settings allowing users to independently toggle footer elements drawn on canvas (`@Username`, `PosterBoxd`, `Letterboxd`, `Venue / Logged`).
- **Marquee Segmented Title Mode Switcher**: Replaced the single checkbox with a 3-way segmented switch (`| Normal text | Bulb | Logo artwork |`) for Design 10 (Marquee).
- **Progressive Web App (PWA) Support**: Full offline caching and "Add to Home Screen" support enabled via [manifest.json](file:///c:/Users/emz/Documents/GitHub/PosterBoxdPlus/manifest.json) and [sw.js](file:///c:/Users/emz/Documents/GitHub/PosterBoxdPlus/sw.js). Includes desktop/Android `beforeinstallprompt` handling and guided iOS Home Screen installation modal.
- **Authentic App Icon Suite**: Exported pixel-perfect icons from master [favicon.png](file:///c:/Users/emz/Documents/GitHub/PosterBoxdPlus/favicon.png) for [favicon.ico](file:///c:/Users/emz/Documents/GitHub/PosterBoxdPlus/favicon.ico) (48×48), [apple-touch-icon.png](file:///c:/Users/emz/Documents/GitHub/PosterBoxdPlus/apple-touch-icon.png) (180×180), [icon-192.png](file:///c:/Users/emz/Documents/GitHub/PosterBoxdPlus/icon-192.png) (192×192), and [icon-512.png](file:///c:/Users/emz/Documents/GitHub/PosterBoxdPlus/icon-512.png) (512×512) without artificial colors or altered styling.
- **Social Preview Banner & SEO Schema**: Configured [PosterBoxd-Banner.jpg](file:///c:/Users/emz/Documents/GitHub/PosterBoxdPlus/PosterBoxd-Banner.jpg) across Open Graph, Twitter cards, and WebSite/WebApplication JSON-LD schemas in [index.html](file:///c:/Users/emz/Documents/GitHub/PosterBoxdPlus/index.html).
- **Artwork-Aware Crop Sliders**: Photo Crop Offset Correction (X & Y) sliders and Center button are automatically disabled and dimmed when no image artwork is present to crop.

### Changed
- **Minimal Pinned Page Footer**: Cleaned up the site footer layout so it stays pinned at the bottom across all views without excess height or unwanted gaps.
- **De-cluttered Search Copy**: Simplified verbose search headings, placeholders, and tips across Home and Studio views for a cleaner, focused experience.
- **Criterion (Design 5) Text-Only Typography**: Configured Criterion Arthouse Split to render clean text typography alone without artwork logo overlay.

### Fixed
- **BigScore Render Freeze & Navigation Hang**: Fixed missing `ensureVisibleAccentOnDark` import in `scoreboard.js` that crashed the canvas render loop and hung Next/Prev style navigation, and added protective canvas render error handling.
- **Removed 4.5★ Fallback Defaults**: Eliminated hardcoded 4.5★ fallback ratings across initial app state, review helpers, and media loaders. Unrated media now starts clean as `Unrated` (`0★`), while fetched items dynamically use their real TMDB score (`vote_average / 2`) or authentic Letterboxd review stars.

---

## [v1.3.0] - 2026-10-24

### Added
- **TMDb Missing Key Warning Modal**: Added an informative popup modal when proceeding with a Letterboxd import without a TMDb API key configured, explaining limited high-resolution artwork and metadata availability with direct options to add a key or proceed without one.
- **Subtle Persistent Top Warning Banner**: Non-intrusive warning banner pinned below the header across studio views when running without a TMDb key, complete with an inline `Add API Key` action button.
- **Complete State Isolation & Clean Reset (`resetMediaState`)**: Dedicated media cleanup system ensuring every new search or review import starts from a pristine state, completely eliminating metadata, image, and logo bleed between searches.
- **Dynamic Letterboxd Search Dropdown**: Typing or pasting a Letterboxd review URL (standard or `boxd.it` shortlinks) dynamically renders a rich preview dropdown card showing movie title, year, poster thumbnail, reviewer handle, and star rating.
- **Letterboxd Rating Freeze**: When importing a Letterboxd review, the user's authentic review rating is locked and prioritized strictly.
- **Context-Aware Review QR Codes**: QR codes are strictly scoped to authentic Letterboxd / PosterBoxd review imports, hiding the toggle and canvas code when creating posters from scratch or standard cinema searches.
- **Marquee Title Bulb Illumination Toggle**: Toggle option for the Marquee archetype to switch between authentic illuminated marquee bulb typography and clean high-contrast vector titles, with main marquee title scale increased to 1.3×.
- **Startup Splash Screen**: Smooth animated filmstrip logo and initialization status loader fading out once typography, icons, and studio rendering engines are ready.

### Changed
- **Total Elimination of Dummy Fallbacks**: Removed all dummy presets, demo buttons, and fallback strings (e.g. `'Cinema | Feature'`, `'2h 15m'`, `'2026'`, `'Unknown'`, `'Denis Villeneuve'`, `'VIP ACCESS'`) across all 11 poster renderers. All unprovided fields remain cleanly empty.
- **Adaptive Header Text Theming**: Canvas title headers and bylines across ticket and scoreboard archetypes now dynamically sample and adapt to the dominant extracted poster artwork palette (`ensureVisibleAccentOnDark`) rather than using hardcoded green or canvas stroke leaks.
- **TMDb Logo Language Priority**: Official title logos fetched from TMDb prioritize English (`en` / `en-US`) and highest vote score before populating the asset picker.

### Fixed
- **Stale Demo Asset Bleed ("The Nun" / "Dune" bug)**: Resolved issue where importing a Letterboxd review without a TMDb key retained the startup demo's title logo, backdrops, and director credits.
- **Green Title Byline Bug**: Fixed canvas stroke/fill color leak in the Floating Vintage Ticket archetype that caused director headers to render in green.
- **Criterion Title Alignment**: Fixed title and logo vertical positioning and container bounds in the Criterion Arthouse Split design.

---

## [v1.2.1] - 2026-10-23

### Fixed
- **API Key Button Interaction & Accessibility**: Replaced external webfont icon with an inline vector SVG so the TMDB key button is immediately recognizable and never appears empty or invisible before font assets load. Added explicit `cursor-pointer` and hover feedback.
- **Backdrop & Keyboard Dismissal**: Clicking anywhere outside the TMDB API Key dialog on the dimmed backdrop or pressing the `Escape` key now immediately closes the modal.

---

## [v1.2.0] - 2026-10-23

### Added
- **Photo Crop Offset Correction (X & Y)**: Added horizontal and vertical focal point shift sliders with a quick `Center (0,0)` reset button in *Visual & Typography Sliders*.
- **Review Box Clear Buttons**: One-click `Clear` buttons for both the One-Line Review and Detailed Review / Notes input fields.
- **Random Review Generator**: Dynamic template engine in `utils.js` generating rich, witty reviews pairing director, cast chemistry (lead, duo, trio), genre flavor (Sci-Fi, Thriller, Romance, Action), and rating sentiment (Masterpiece, Positive, Mixed).
- **TV Series Episode Emphasis**: Prominent display of single episodes (e.g. `S01E01 - Winter Is Coming`) across all poster designs. If a whole season is selected, displays `Season 1`.
- **TV Episode-Specific Credits**: Dynamically loads episode directors, writers, guest stars/cast, and runtime when a specific episode is chosen.
- **Season Poster Filtering**: Selecting a season filters posters and backdrops to official season artwork, falling back gracefully to series assets.
- **Desktop Split-Screen Studio**: 12-column responsive layout on $\ge 1024\text{px}$ viewports pairing controls & artwork settings on the left with a sticky live poster canvas on the right.
- **Header Desktop Navigation**: Direct access buttons for Review Form, Poster Studio, and History on desktop.

### Changed
- **Default Ratings**: New media loads default to the actual TMDB score (`vote_average / 2` rounded to 0.5★) rather than stale previous ratings.
- **Live History Progress**: Any edits to ratings, likes, review quotes, medium, or episode selections now update the browser fetch history.
- **Mobile-Only Bottom Bar**: Bottom navigation bar is strictly hidden on desktop screens to maximize usable real estate.
- **TV Media Filtering**: Suppresses movie-only poster archetypes (Full Ticket, Marquee) and theater formats when TV series are loaded.

---

## [v1.1.0] - 2026-10-22

### Added
- Modular ES6 architecture in `src/` (`rendering/`, `controllers/`, `services/`, `ui/`, `data/`).
- Direct drag-and-drop repositioning and scaling toolbar for all poster elements.
- Letterboxd review importer with automatic TMDB asset enrichment.
- Scannable QR code generator for Letterboxd reviews.
- 11 distinct poster styles (Floating Ticket, Classic, Editorial, Polaroid, Criterion, etc.).
- Regional Now Playing cinema presets and TMDB API key manager.
