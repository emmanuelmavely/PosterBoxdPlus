# GitHub Copilot Instructions — PosterBoxd

## Project Context
- Pure client-side cinema poster generator using HTML5 Canvas 2D and vanilla ES Modules.
- There is **no build step** (no npm build, no bundler). All modules in `src/` are loaded directly by the browser via `<script type="module" src="src/main.js">`.
- TMDB API is accessed via a Cloudflare Worker proxy (`worker/index.js`).
- State is managed via a single shared `state` object in `src/state.js`.

## Code Conventions
- Use standard modern ECMAScript (ES2022+).
- Every poster renderer in `src/rendering/posters/` must export a function named `render<StyleName>Poster(ctx, w, h)`.
- Wrap interactive poster components with `drawMovableGroup(ctx, id, label, baseBox, drawFn)` from `src/rendering/transforms.js`.
- Always use `drawFooterBrand(ctx, centerX, bottomY, isLightMode)` from `src/rendering/primitives.js` for the bottom branding bar.
- In 9:16 aspect ratio (`h === 1920`), all visible layout elements must sit within the 1080×1610 safe zone (`Y = 155` to `Y = 1765`).
- Never introduce Node.js-only packages or bundler-specific syntax (`require`, `process.env`, JSX, or TypeScript syntax) into client files in `src/`.
- Always bump the semantic version in `src/constants.js`, `index.html`, and `README.md` on each iteration, document modifications in `CHANGELOG.md`, and prepare/execute a git commit.

