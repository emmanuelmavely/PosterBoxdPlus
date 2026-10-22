import { state } from '../state.js';
import { ARCHETYPE_NAMES, ARCHETYPE_KEYS } from '../constants.js';
import { scheduleCanvasRender } from '../rendering/canvas-renderer.js';
import { showToast } from './toast.js';

export function initDesignControls() {
  const setArchetype = (archetype) => {
    state.archetype = archetype;
    document.querySelectorAll('.arch-select-btn').forEach((button) => {
      const active = button.dataset.archetype === archetype;
      button.classList.toggle('active', active);
      button.classList.toggle('bg-lbgreen', active);
      button.classList.toggle('text-obsidian', active);
      button.classList.toggle('bg-slatepanel', !active);
      button.classList.toggle('text-gray-300', !active);
      if (active) {
        button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });

    const currentName = document.getElementById('current-archetype-name');
    if (currentName) currentName.textContent = ARCHETYPE_NAMES[archetype];
    scheduleCanvasRender();
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
    });
  };

  bindSlider('slider-brightness', 'val-brightness', 'backdropBrightness', (value) => `${value}%`);
  bindSlider('slider-blur', 'val-blur', 'backdropBlur', (value) => `${value}px`);
  bindSlider('slider-poster-scale', 'val-poster-scale', 'posterScale', (value) => `${value.toFixed(2)}x`);
  bindSlider('slider-font-scale', 'val-font-scale', 'fontScale', (value) => `${value.toFixed(2)}x`);

  document.getElementById('chk-gradient')?.addEventListener('change', (event) => {
    state.gradientOverlay = event.target.checked;
    scheduleCanvasRender();
  });

  document.getElementById('chk-grain')?.addEventListener('change', (event) => {
    state.filmGrain = event.target.checked;
    scheduleCanvasRender();
  });

  document.getElementById('chk-qrcode')?.addEventListener('change', (event) => {
    state.showQrCode = event.target.checked;
    scheduleCanvasRender();
  });

  document.getElementById('chk-marquee-bulb')?.addEventListener('change', (event) => {
    state.marqueeBulbMode = event.target.checked;
    scheduleCanvasRender();
  });

  document.getElementById('toggle-use-logo')?.addEventListener('change', (event) => {
    state.useLogoImage = event.target.checked;
    scheduleCanvasRender();
  });

  document.getElementById('reset-sliders-btn')?.addEventListener('click', () => {
    state.backdropBrightness = 55;
    state.backdropBlur = 14;
    state.posterScale = 1.0;
    state.fontScale = 1.0;

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

    scheduleCanvasRender();
    showToast('Sliders reset');
  });
}
