# CLAUDE.md — Claude Agent Instructions

## Overview
PosterBoxd is a buildless, 100% client-side web application for generating cinema & TV review posters from TMDB metadata and Letterboxd review links.

## Tech Stack
- **JavaScript**: Vanilla ES Modules (`import`/`export`), no bundlers (no Vite/Webpack/Rollup).
- **Rendering**: HTML5 Canvas 2D API (`src/rendering/`).
- **Styling**: Tailwind CSS via CDN.
- **Backend / API**: Serverless Cloudflare Worker proxy (`worker/`) for TMDB API requests with 24h edge caching.
- **Persistence**: `window.localStorage` for review character limits, transform offsets, and fetch history.

## Development Commands
No build step exists. To run locally, start any static web server:
- `python -m http.server 8080` or
- `npx http-server -p 8080 -c-1`
Then open `http://localhost:8080`.

For live TMDB data on localhost, put `TMDB_API_KEY=...` in the git-ignored `.env.local` and run `node scripts/dev-server.mjs` (http://localhost:8123).

## Architecture & Code Map
- `src/main.js`: Bootstraps views, services, UI controls, and loads fonts.
- `src/state.js`: Single reactive store holding active media, review, palette, and poster customization settings.
- `src/constants.js`: System limits, archetype names, and `STORY_SAFE_ZONE` (1080×1610 safe area).
- `src/rendering/canvas-renderer.js`: Main render loop, handles canvas dimensions (9:16, 4:5, 1:1, 2:3), style thumbnails, film grain, interactive hitboxes, and safe zone guidelines.
- `src/rendering/primitives.js`: Drawing helpers (typography fitting, badges, stars, palettes, footer branding).
- `src/rendering/posters/`: 22 poster style renderers (`floating-ticket.js`, `classic.js`, `editorial.js`, `polaroid.js`, `criterion.js`, `ticket.js`, `ios-glass.js`, `scoreboard.js`, `retro.js`, `marquee.js`, `vip-pass.js`, plus `brutalist.js`, `contact-sheet.js`, `glass-player.js`, `receipt.js`, `studio-editorial.js`, `studio-glass.js`; shared helpers in `studio-shared.js`).
- `src/ui/editor.js`: iOS-style editor shell (tool tabs, sub-tabs, style thumbnails, swipe).
- `src/ui/`: UI controller modules for search, design sliders, review form, asset pickers, and export.

## Key Rules
1. **Never introduce a build step or bundler**. Keep files vanilla ES Modules.
2. **Safe Zone Constraints**: In 9:16 aspect ratio (`h === 1920`), all content elements must stay within the centered 1080×1610 safe zone (`Y = 155` to `Y = 1765`).
3. **Movable Elements**: New visual components on posters must use `drawMovableGroup()` to support the interactive "Move & Resize" feature.
4. **Version Bumping & Changelog**: Always bump the semantic version in `src/constants.js`, `index.html`, and `README.md` on each iteration, document changes in `CHANGELOG.md`, and execute/provide a git commit.

