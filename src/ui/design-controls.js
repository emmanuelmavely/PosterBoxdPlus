import { state } from '../state.js';
import { ARCHETYPE_NAMES, ARCHETYPE_KEYS } from '../constants.js';
import { scheduleCanvasRender } from '../rendering/canvas-renderer.js';
import { recordCurrentFetchToHistory } from '../services/storage.js';
import { showToast } from './toast.js';

const MOVIE_ONLY_ARCHETYPES = new Set(['ticket', 'marquee']);

export function syncArchetypeUI() {
  const isTv = state.mediaType === 'tv';
  if (isTv && MOVIE_ONLY_ARCHETYPES.has(state.archetype)) state.archetype = 'classic';

  document.querySelectorAll('.arch-select-btn').forEach((button) => {
    const hidden = isTv && button.dataset.movieOnly === 'true';
    const active = button.dataset.archetype === state.archetype;
    button.classList.toggle('hidden', hidden);
    button.disabled = hidden;
    button.setAttribute('aria-hidden', String(hidden));
    button.classList.toggle('active', active);
    button.classList.toggle('bg-lbgreen', active);
    button.classList.toggle('text-obsidian', active);
    button.classList.toggle('bg-slatepanel', !active);
    button.classList.toggle('text-gray-300', !active);
    button.classList.toggle('border-lbgreen/30', active);
    button.classList.toggle('border-white/10', !active);
  });

  const currentName = document.getElementById('current-archetype-name');
  if (currentName) currentName.textContent = ARCHETYPE_NAMES[state.archetype];
}

export function syncDesignControlsUI() {
  syncArchetypeUI();

  document.querySelectorAll('.ratio-pill').forEach((button) => {
    const active = button.dataset.ratio === state.aspectRatio;
    button.classList.toggle('active', active);
    button.classList.toggle('bg-lbgreen', active);
    button.classList.toggle('text-obsidian', active);
    button.classList.toggle('text-gray-300', !active);
  });

  const sliderState = [
    ['slider-brightness', 'val-brightness', state.backdropBrightness, (value) => `${value}%`],
    ['slider-blur', 'val-blur', state.backdropBlur, (value) => `${value}px`],
    ['slider-poster-scale', 'val-poster-scale', state.posterScale, (value) => `${value.toFixed(2)}x`],
    ['slider-font-scale', 'val-font-scale', state.fontScale, (value) => `${value.toFixed(2)}x`],
    ['slider-poster-offset-x', 'val-poster-offset-x', state.posterOffsetX, (value) => `${value > 0 ? `+${value}` : value}%`],
    ['slider-poster-offset-y', 'val-poster-offset-y', state.posterOffsetY, (value) => `${value > 0 ? `+${value}` : value}%`]
  ];
  sliderState.forEach(([sliderId, valueId, value, formatValue]) => {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(valueId);
    if (slider) slider.value = value;
    if (label) label.textContent = formatValue(Number(value));
  });

  const checkboxState = [
    ['chk-gradient', state.gradientOverlay],
    ['chk-grain', state.filmGrain],
    ['chk-qrcode', state.showQrCode],
    ['chk-marquee-bulb', state.marqueeBulbMode],
    ['toggle-use-logo', state.useLogoImage]
  ];
  checkboxState.forEach(([id, checked]) => {
    const checkbox = document.getElementById(id);
    if (checkbox) checkbox.checked = Boolean(checked);
  });
}

export function initDesignControls() {
  const setArchetype = (archetype) => {
    if (state.mediaType === 'tv' && MOVIE_ONLY_ARCHETYPES.has(archetype)) return;
    state.archetype = archetype;
    syncArchetypeUI();
    const activeButton = document.querySelector(`.arch-select-btn[data-archetype="${archetype}"]`);
    activeButton?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
  };

  document.querySelectorAll('.arch-select-btn').forEach((button) => {
    button.addEventListener('click', () => setArchetype(button.dataset.archetype));
  });

  document.getElementById('prev-style-btn')?.addEventListener('click', () => {
    const index = (ARCHETYPE_KEYS.indexOf(state.archetype) - 1 + ARCHETYPE_KEYS.length) % ARCHETYPE_KEYS.length;
    setArchetype(ARCHETYPE_KEYS[index]);
  });

  document.getElementById('next-style-btn')?.addEventListener('click', () => {
    const index = (ARCHETYPE_KEYS.indexOf(state.archetype) + 1) % ARCHETYPE_KEYS.length;
    setArchetype(ARCHETYPE_KEYS[index]);
  });

  document.querySelectorAll('.ratio-pill').forEach((button) => {
    button.addEventListener('click', () => {
      state.aspectRatio = button.dataset.ratio;
      document.querySelectorAll('.ratio-pill').forEach((ratioButton) => {
        const active = ratioButton.dataset.ratio === state.aspectRatio;
        ratioButton.classList.toggle('active', active);
        ratioButton.classList.toggle('bg-lbgreen', active);
        ratioButton.classList.toggle('text-obsidian', active);
        ratioButton.classList.toggle('text-gray-300', !active);
      });
      scheduleCanvasRender();
      recordCurrentFetchToHistory();
    });
  });

  const bindSlider = (sliderId, valueId, stateKey, formatValue) => {
    const slider = document.getElementById(sliderId);
    const valueLabel = document.getElementById(valueId);
    if (!slider) return;
    slider.addEventListener('input', () => {
      const number = parseFloat(slider.value);
      state[stateKey] = number;
      if (valueLabel) valueLabel.textContent = formatValue(number);
      scheduleCanvasRender();
      recordCurrentFetchToHistory();
    });
  };

  bindSlider('slider-brightness', 'val-brightness', 'backdropBrightness', (value) => `${value}%`);
  bindSlider('slider-blur', 'val-blur', 'backdropBlur', (value) => `${value}px`);
  bindSlider('slider-poster-scale', 'val-poster-scale', 'posterScale', (value) => `${value.toFixed(2)}x`);
  bindSlider('slider-font-scale', 'val-font-scale', 'fontScale', (value) => `${value.toFixed(2)}x`);
  bindSlider('slider-poster-offset-x', 'val-poster-offset-x', 'posterOffsetX', (value) => `${value > 0 ? `+${value}` : value}%`);
  bindSlider('slider-poster-offset-y', 'val-poster-offset-y', 'posterOffsetY', (value) => `${value > 0 ? `+${value}` : value}%`);

  document.getElementById('reset-photo-offsets-btn')?.addEventListener('click', () => {
    state.posterOffsetX = 0;
    state.posterOffsetY = 0;
    const xSlider = document.getElementById('slider-poster-offset-x');
    const xVal = document.getElementById('val-poster-offset-x');
    const ySlider = document.getElementById('slider-poster-offset-y');
    const yVal = document.getElementById('val-poster-offset-y');
    if (xSlider) xSlider.value = 0;
    if (xVal) xVal.textContent = '0%';
    if (ySlider) ySlider.value = 0;
    if (yVal) yVal.textContent = '0%';
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
    showToast('Photo crop centered (0, 0)');
  });

  document.getElementById('chk-gradient')?.addEventListener('change', (event) => {
    state.gradientOverlay = event.target.checked;
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
  });

  document.getElementById('chk-grain')?.addEventListener('change', (event) => {
    state.filmGrain = event.target.checked;
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
  });

  document.getElementById('chk-qrcode')?.addEventListener('change', (event) => {
    state.showQrCode = event.target.checked;
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
  });

  document.getElementById('chk-marquee-bulb')?.addEventListener('change', (event) => {
    state.marqueeBulbMode = event.target.checked;
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
  });

  document.getElementById('toggle-use-logo')?.addEventListener('change', (event) => {
    state.useLogoImage = event.target.checked;
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
  });

  document.getElementById('reset-sliders-btn')?.addEventListener('click', () => {
    state.backdropBrightness = 55;
    state.backdropBlur = 14;
    state.posterScale = 1.0;
    state.fontScale = 1.0;
    state.posterOffsetX = 0;
    state.posterOffsetY = 0;

    const brightnessSlider = document.getElementById('slider-brightness');
    const brightnessValue = document.getElementById('val-brightness');
    if (brightnessSlider) brightnessSlider.value = 55;
    if (brightnessValue) brightnessValue.textContent = '55%';

    const blurSlider = document.getElementById('slider-blur');
    const blurValue = document.getElementById('val-blur');
    if (blurSlider) blurSlider.value = 14;
    if (blurValue) blurValue.textContent = '14px';

    const posterScaleSlider = document.getElementById('slider-poster-scale');
    const posterScaleValue = document.getElementById('val-poster-scale');
    if (posterScaleSlider) posterScaleSlider.value = 1.0;
    if (posterScaleValue) posterScaleValue.textContent = '1.00x';

    const fontScaleSlider = document.getElementById('slider-font-scale');
    const fontScaleValue = document.getElementById('val-font-scale');
    if (fontScaleSlider) fontScaleSlider.value = 1.0;
    if (fontScaleValue) fontScaleValue.textContent = '1.00x';

    const xSlider = document.getElementById('slider-poster-offset-x');
    const xVal = document.getElementById('val-poster-offset-x');
    const ySlider = document.getElementById('slider-poster-offset-y');
    const yVal = document.getElementById('val-poster-offset-y');
    if (xSlider) xSlider.value = 0;
    if (xVal) xVal.textContent = '0%';
    if (ySlider) ySlider.value = 0;
    if (yVal) yVal.textContent = '0%';

    scheduleCanvasRender();
    recordCurrentFetchToHistory();
    showToast('Sliders reset');
  });

  syncDesignControlsUI();
}
