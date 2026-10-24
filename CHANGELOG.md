# Changelog

All notable changes to **PosterBoxd Studio** are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.3.1] - 2026-10-24

### Added
- **Poster Footer Multi-Select Choice Chips**: Choice chips in Poster Studio settings allowing users to independently toggle footer elements drawn on canvas (`@Username`, `PosterBoxd`, `Letterboxd`, `Venue / Logged`).
- **Marquee Segmented Title Mode Switcher**: Replaced the single checkbox with a 3-way segmented switch (`| Normal text | Bulb | Logo artwork |`) for Design 10 (Marquee).
- **Artwork-Aware Crop Sliders**: Photo Crop Offset Correction (X & Y) sliders and Center button are automatically disabled and dimmed when no image artwork is present to crop.

### Changed
- **Minimal Pinned Page Footer**: Cleaned up the site footer layout so it stays pinned at the bottom across all views without excess height or unwanted gaps.
- **De-cluttered Search Copy**: Simplified verbose search headings, placeholders, and tips across Home and Studio views for a cleaner, focused experience.
- **Criterion (Design 5) Text-Only Typography**: Configured Criterion Arthouse Split to render clean text typography alone without artwork logo overlay.

### Fixed
- **BigScore Render Freeze & Navigation Hang**: Fixed missing `ensureVisibleAccentOnDark` import in `scoreboard.js` that crashed the canvas render loop and hung Next/Prev style navigation, and added protective canvas render error handling.

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
