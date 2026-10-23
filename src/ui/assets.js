import { state } from '../state.js';
import { loadCorsImage, extractDominantPalette } from '../services/media-assets.js';
import { recordCurrentFetchToHistory } from '../services/storage.js';
import { scheduleCanvasRender } from '../rendering/canvas-renderer.js';
import { showToast } from './toast.js';

export function renderPaletteSwatchesUI() {
  const container = document.getElementById('palette-swatch-bar');
  if (!container) return;

  container.innerHTML = state.palette.map((hex, index) => `
    <label class="group flex flex-col items-center gap-1 cursor-pointer">
      <div class="w-full h-8 rounded-lg border border-white/20 shadow-inner relative overflow-hidden" style="background-color: ${hex};">
        <input type="color" data-swatch-idx="${index}" value="${hex}" class="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
      </div>
      <span class="text-[10px] font-mono text-gray-400 group-hover:text-white">${hex}</span>
    </label>
  `).join('');

  container.querySelectorAll('input[type="color"]').forEach((input) => {
    input.addEventListener('input', (event) => {
      const index = parseInt(event.target.dataset.swatchIdx, 10);
      state.palette[index] = event.target.value.toUpperCase();
      event.target.parentElement.style.backgroundColor = state.palette[index];
      event.target.parentElement.nextElementSibling.textContent = state.palette[index];
      scheduleCanvasRender();
    });
  });
}

async function selectAndLoadAsset(type, index) {
  if (type === 'poster') {
    state.selectedPosterIndex = index;
    const image = await loadCorsImage(state.posters[index]);
    if (image) {
      state.posterImg = image;
      state.palette = extractDominantPalette(image, state.palette);
      renderPaletteSwatchesUI();
    }
  } else if (type === 'backdrop') {
    state.selectedBackdropIndex = index;
    const image = await loadCorsImage(state.backdrops[index]);
    if (image) state.backdropImg = image;
  } else if (type === 'logo') {
    state.selectedLogoIndex = index;
    state.logoImg = await loadCorsImage(state.logos[index]);
  }
  renderAssetPickerStrips();
  recordCurrentFetchToHistory();
  scheduleCanvasRender();
}

export function renderAssetPickerStrips() {
  const posterStrip = document.getElementById('poster-picker-strip');
  const backdropStrip = document.getElementById('backdrop-picker-strip');
  const logoStrip = document.getElementById('logo-picker-strip');
  const posterCountBadge = document.getElementById('poster-count-badge');
  const backdropCountBadge = document.getElementById('backdrop-count-badge');

  if (posterCountBadge) posterCountBadge.textContent = `${state.posters.length} images`;
  if (backdropCountBadge) backdropCountBadge.textContent = `${state.backdrops.length} images`;

  if (posterStrip) {
    posterStrip.innerHTML = state.posters.map((url, index) => `
      <button type="button" data-asset-type="poster" data-idx="${index}"
        class="w-16 h-22 rounded-lg overflow-hidden shrink-0 border-2 transition ${index === state.selectedPosterIndex ? 'border-lbgreen ring-2 ring-lbgreen/30 scale-105' : 'border-white/10 opacity-75 hover:opacity-100'}">
        <img src="${url}" alt="Foreground Option ${index + 1}" class="w-full h-full object-cover" />
      </button>
    `).join('');
  }

  if (backdropStrip) {
    backdropStrip.innerHTML = state.backdrops.map((url, index) => `
      <button type="button" data-asset-type="backdrop" data-idx="${index}"
        class="w-24 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition ${index === state.selectedBackdropIndex ? 'border-lbblue ring-2 ring-lbblue/30 scale-105' : 'border-white/10 opacity-75 hover:opacity-100'}">
        <img src="${url}" alt="Background Option ${index + 1}" class="w-full h-full object-cover" />
      </button>
    `).join('');
  }

  if (logoStrip) {
    if (state.logos.length > 0) {
      logoStrip.innerHTML = state.logos.map((url, index) => `
        <button type="button" data-asset-type="logo" data-idx="${index}"
          class="w-28 h-12 p-1.5 rounded-lg bg-obsidian flex items-center justify-center shrink-0 border-2 transition ${index === state.selectedLogoIndex ? 'border-lbgreen' : 'border-white/10 opacity-75 hover:opacity-100'}">
          <img src="${url}" alt="Logo ${index + 1}" class="max-w-full max-h-full object-contain" />
        </button>
      `).join('');
    } else {
      logoStrip.innerHTML = '<div class="text-xs text-gray-500 font-mono py-1">Using vector display typography.</div>';
    }
  }

  document.querySelectorAll('[data-asset-type]').forEach((button) => {
    button.addEventListener('click', () => selectAndLoadAsset(button.dataset.assetType, parseInt(button.dataset.idx, 10)));
  });
}

export function initAssetControls() {
  document.getElementById('reextract-palette-btn')?.addEventListener('click', () => {
    if (state.posterImg) {
      state.palette = extractDominantPalette(state.posterImg, state.palette);
      renderPaletteSwatchesUI();
      scheduleCanvasRender();
      showToast('Re-sampled 5 colors from artwork');
    }
  });

  renderAssetPickerStrips();
}
