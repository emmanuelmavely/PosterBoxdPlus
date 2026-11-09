# AGENTS.md — AI Agent Index & Developer Guide

This document is the primary reference and index for AI coding assistants and autonomous agents working within the **PosterBoxd** codebase.

---

## 1. Project Overview & Architecture

**PosterBoxd** is a client-side cinema and TV review poster generator that creates high-resolution visual posters from TMDB metadata and Letterboxd review links.

### Key Architectural Pillars
- **Zero Build Step**: Native ES Modules (`type="module"`) running directly in modern web browsers. No Webpack, Vite, Rollup, Babel, or npm compilation step.
- **Pure Client-Side Execution**: Runs 100% in the browser. Uses HTML5 Canvas 2D for high-res image generation.
- **Styling**: Tailwind CSS loaded via CDN (`https://cdn.tailwindcss.com`) with custom styles in `index.html`.
- **API & Data Proxy**: TMDB metadata is fetched through a Cloudflare Worker proxy (`worker/`) to keep credentials off the client and cache responses for 24 hours.
- **State Management**: Central reactive-like single-source-of-truth object in `src/state.js`.

---

## 2. Directory Structure

```
PosterBoxdPlus/
├── index.html                  # Main SPA markup, Tailwind configuration, head meta, and canvas
├── jsconfig.json               # ES module resolution for IDEs & language servers
├── AGENTS.md                   # Universal AI agent instructions & architectural index
├── CLAUDE.md                   # Claude Code / Anthropic instructions
├── llms.txt                    # LLM crawler and context index
├── CHANGELOG.md                # Semantic versioning release log
├── README.md                   # Public documentation & user guide
├── worker/
│   ├── index.js                # Cloudflare Worker TMDB caching proxy
│   └── wrangler.toml           # Cloudflare Worker configuration
└── src/
    ├── main.js                 # Application entry point & bootstrapping
    ├── state.js                # Global state store (`state`) and reset routines
    ├── constants.js            # App constants, limits, safe zone dimensions, archetype names
    ├── utils.js                # String, date formatting, and slug utilities
    ├── controllers/
    │   ├── letterboxd-import.js # Letterboxd URL parsing & media hydration
    │   └── media.js            # TMDB metadata fetch orchestration & demo presets
    ├── rendering/
    │   ├── canvas-renderer.js  # Main rendering loop, aspect-ratio sizing, safe zone guides
    │   ├── posters.js          # Archetype registry (`POSTER_RENDERERS`)
    │   ├── primitives.js       # Drawing primitives (text, badges, stars, brand footers, palettes)
    │   ├── runtime.js          # Grain pattern generation & brand SVG caching
    │   ├── transforms.js       # Interactive movable groups, hitboxes, and element offsets
    │   ├── qr-code.js          # QR code rendering utility
    │   └── posters/            # 11 distinct poster style renderers
    │       ├── floating-ticket.js # 1. Floating Vintage Ticket
    │       ├── classic.js         # 2. Classic Centered
    │       ├── editorial.js       # 3. Full-Bleed Editorial
    │       ├── polaroid.js        # 4. Polaroid Gallery Frame
    │       ├── criterion.js       # 5. Criterion Arthouse Split
    │       ├── ticket.js          # 6. Full Cinema Ticket Stub
    │       ├── ios-glass.js       # 7. Apple iOS Glass Card
    │       ├── scoreboard.js      # 8. Big Score & One-Liner
    │       ├── retro.js           # 9. 70s Retro Grindhouse
    │       ├── marquee.js         # 10. Movie Theater Marquee
    │       └── vip-pass.js        # 11. VIP Screening Pass
    ├── services/
    │   ├── letterboxd.js       # Letterboxd raw HTML regex parser and sanitizers
    │   ├── media-assets.js     # Image CORS loader and ColorThief palette extraction
    │   ├── storage.js          # LocalStorage persistence for history and element transforms
    │   └── tmdb.js             # TMDB proxy HTTP client
    └── ui/
        ├── navigation.js       # View switcher (`home`, `review`, `preview`, `history`)
        ├── search.js           # Google-style live search bar and auto-complete
        ├── review-form.js      # Review text, rating, and metadata inputs
        ├── assets.js           # Foreground poster & background still strip pickers
        ├── design-controls.js  # Sliders, ratio pills, safe zone toggle, archetype scroller
        ├── canvas-interactions.js # Interactive drag, scale, and touch manipulation
        ├── export-controls.js  # Save PNG, Copy to Clipboard, and Web Share API
        ├── history.js          # Local storage poster fetch history list
        ├── qr-controls.js      # QR code toggle & Letterboxd URL sync
        ├── toast.js            # Non-blocking HUD toast notification system
        ├── pwa-install.js      # Progressive Web App installation prompt
        └── whats-new.js        # Version release notes modal
```

---

## 3. Canvas Rendering & Safe Zone System

### Canvas Dimensions & Aspect Ratios
Defined in `src/rendering/canvas-renderer.js`:
- **`9:16` (Default)**: `1080 × 1920` (Instagram / TikTok Story format)
- **`4:5`**: `1080 × 1350` (Instagram Feed portrait)
- **`2:3`**: `1200 × 1800` (Standard Cinema / One-Sheet poster)

### Instagram Story Safe Zone (Standard Organic Story)
Defined in `src/constants.js` (`STORY_SAFE_ZONE`):
- **Top Danger Zone**: `0 – 155 px` (Profile picture, username, timestamp, and close button).
- **Bottom Danger Zone**: `1765 – 1920 px` (Message reply input bar & reaction buttons).
- **Safe Zone Dimensions**: Centered **`1080 × 1610 px`** (`Y = 155 px` to `Y = 1765 px`).
- **Layout Rule**:
  - Full-bleed photos, backdrops, vignettes, and film grain cover the entire `1080 × 1920` canvas.
  - All critical layout content (artwork cards, titles, ratings, reviews, cast, QR code, and footer branding) must start at or below `Y = 158–165 px` and conclude at or above `Y = 1755 px`.
  - In `4:5` and `2:3` ratios, original top/bottom coordinates apply.

---

## 4. Local Development & Testing

Since the project uses browser-native ES Modules, files must be served over an HTTP server (direct `file://` execution is blocked by browser CORS security):

```bash
# Option 1: Python 3
python -m http.server 8080

# Option 2: Node.js
npx http-server -p 8080 -c-1
```
Open `http://localhost:8080` in any browser.

---

## 5. Coding Standards & Agent Guidelines

1. **Do Not Introduce a Build System**: Keep the project 100% buildless vanilla ES Modules. Do not add `npm`, `package.json` build scripts, bundlers (Vite/Webpack), or TypeScript transpile steps unless explicitly requested by the user.
2. **Preserve Comments & Formatting**: Maintain existing documentation, architecture comments, and inline documentation integrity.
3. **Line Endings & File Editing**: On Windows workstations, source files may use CRLF (`\r\n`). Prefer single-line `Target` replacements or complete file writes (`write_file` with `Overwrite: true`) to avoid CRLF mismatch failures.
4. **Interactive Transforms**: Every major movable group on the canvas must be wrapped in `drawMovableGroup(ctx, id, label, baseBox, drawFn)` in `src/rendering/transforms.js` so that touch/mouse drag & resize controls function properly.
5. **Footer Branding**: Always use `drawFooterBrand(ctx, cx, bottomY, isLightMode)` from `src/rendering/primitives.js`, which automatically enforces the safe-zone boundary in 9:16 Story format.
6. **Version Bumping, Changelog & Git Commit**: On each feature change or iteration, always bump the semantic version in `src/constants.js` (`APP_VERSION`, `RELEASE_DATE`, `CURRENT_RELEASE_NOTES`), `index.html` (version badges), and `README.md` (version badge). Update `CHANGELOG.md` with detailed release notes following Keep a Changelog convention, and prepare/execute a git commit for the changes.

