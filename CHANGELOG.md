# Changelog

All notable changes to **PosterBoxd Studio** are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
