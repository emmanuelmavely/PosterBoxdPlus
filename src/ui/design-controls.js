import { state } from '../state.js';
import {
  ARCHETYPE_NAMES,
  ARCHETYPE_KEYS,
  DEFAULT_DETAILED_REVIEW_CHARACTER_LIMIT,
  getReviewCharacterLimit,
  MAX_DETAILED_REVIEW_CHARACTER_LIMIT,
  MIN_DETAILED_REVIEW_CHARACTER_LIMIT
} from '../constants.js';
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
  const reviewInput = document.getElementById('input-review');
  const reviewLimit = getReviewCharacterLimit(state.archetype);
  if (reviewInput) reviewInput.maxLength = reviewLimit;
  const reviewCount = document.getElementById('review-char-count');
  if (reviewCount) reviewCount.textContent = `${state.review.length} / ${reviewLimit}`;

  const detailedReviewCount = document.getElementById('detailed-review-char-count');
  if (detailedReviewCount) detailedReviewCount.textContent = `${(state.detailedReview || '').length} chars`;

  const marqueeModeRow = document.getElementById('marquee-mode-selector-row');
  if (marqueeModeRow) {
    const isMarquee = state.archetype === 'marquee';
    marqueeModeRow.classList.toggle('hidden', !isMarquee);
    marqueeModeRow.classList.toggle('flex', isMarquee);

    const activeMode = state.marqueeTitleMode || 'bulb';
    document.querySelectorAll('.marquee-mode-btn').forEach((btn) => {
      const active = btn.dataset.marqueeMode === activeMode;
      btn.classList.toggle('bg-amber-400/20', active);
      btn.classList.toggle('text-amber-300', active);
      btn.classList.toggle('font-bold', active);
      btn.classList.toggle('border', active);
      btn.classList.toggle('border-amber-400/30', active);
      btn.classList.toggle('text-gray-400', !active);
      btn.classList.toggle('font-normal', !active);
    });
  }
}

export function syncFooterChipsUI() {
  const cfg = state.footerItems || { username: true, posterboxd: true, letterboxd: true, venue: true };
  const labels = {
    username: '@Username',
    posterboxd: 'PosterBoxd',
    letterboxd: 'Letterboxd',
    venue: 'Venue / Logged'
  };
  document.querySelectorAll('.footer-chip').forEach((chip) => {
    const key = chip.dataset.footerElement;
    const active = Boolean(cfg[key]);
    chip.classList.toggle('bg-lbgreen/15', active);
    chip.classList.toggle('text-lbgreen', active);
    chip.classList.toggle('border-lbgreen/40', active);
    chip.classList.toggle('font-semibold', active);
    chip.classList.toggle('bg-cardbg', !active);
    chip.classList.toggle('text-gray-400', !active);
    chip.classList.toggle('border-white/10', !active);
    chip.classList.toggle('font-normal', !active);
    chip.classList.toggle('opacity-60', !active);

    chip.innerHTML = active
      ? `<i class="fa-solid fa-check text-[9px]"></i> ${labels[key] || key}`
      : `${labels[key] || key}`;
  });
}

export function syncDesignControlsUI() {
  syncArchetypeUI();
  syncFooterChipsUI();

  // Disable X-Y axis correction if no image artwork is available
  const hasArtwork = Boolean(state.posterImg || state.backdropImg);
  const xSlider = document.getElementById('slider-poster-offset-x');
  const ySlider = document.getElementById('slider-poster-offset-y');
  const resetOffsetsBtn = document.getElementById('reset-photo-offsets-btn');
  const cropContainer = document.getElementById('photo-crop-container');
  if (xSlider) xSlider.disabled = !hasArtwork;
  if (ySlider) ySlider.disabled = !hasArtwork;
  if (resetOffsetsBtn) resetOffsetsBtn.disabled = !hasArtwork;
  if (cropContainer) {
    cropContainer.classList.toggle('opacity-40', !hasArtwork);
    cropContainer.classList.toggle('pointer-events-none', !hasArtwork);
  }

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
    ['slider-detailed-review-limit', 'val-detailed-review-limit', state.detailedReviewCharacterLimit, (value) => `${value} chars`],
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
  const detailedReviewLimitSlider = document.getElementById('slider-detailed-review-limit');
  const detailedReviewLimitValue = document.getElementById('val-detailed-review-limit');
  detailedReviewLimitSlider?.addEventListener('input', () => {
    const number = Math.min(MAX_DETAILED_REVIEW_CHARACTER_LIMIT, Math.max(MIN_DETAILED_REVIEW_CHARACTER_LIMIT, parseInt(detailedReviewLimitSlider.value, 10)));
    state.detailedReviewCharacterLimit = number;
    localStorage.setItem('posterboxd_detailed_review_limit', String(number));
    if (detailedReviewLimitValue) detailedReviewLimitValue.textContent = `${number} chars`;
    const detailedReviewCount = document.getElementById('detailed-review-char-count');
    if (detailedReviewCount) detailedReviewCount.textContent = `${(state.detailedReview || '').length} chars`;
    scheduleCanvasRender();
    recordCurrentFetchToHistory();
  });
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

  document.querySelectorAll('.marquee-mode-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.marqueeTitleMode = button.dataset.marqueeMode;
      document.querySelectorAll('.marquee-mode-btn').forEach((btn) => {
        const active = btn === button;
        btn.classList.toggle('bg-amber-400/20', active);
        btn.classList.toggle('text-amber-300', active);
        btn.classList.toggle('font-bold', active);
        btn.classList.toggle('border', active);
        btn.classList.toggle('border-amber-400/30', active);
        btn.classList.toggle('text-gray-400', !active);
        btn.classList.toggle('font-normal', !active);
      });
      scheduleCanvasRender();
      recordCurrentFetchToHistory();
    });
  });

  document.querySelectorAll('.footer-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.footerElement;
      if (!state.footerItems) {
        state.footerItems = { username: true, posterboxd: true, letterboxd: true, venue: true };
      }
      state.footerItems[key] = !state.footerItems[key];
      syncFooterChipsUI();
      scheduleCanvasRender();
      recordCurrentFetchToHistory();
    });
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
    state.detailedReviewCharacterLimit = DEFAULT_DETAILED_REVIEW_CHARACTER_LIMIT;
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

    const detailedReviewLimitSlider = document.getElementById('slider-detailed-review-limit');
    const detailedReviewLimitValue = document.getElementById('val-detailed-review-limit');
    if (detailedReviewLimitSlider) detailedReviewLimitSlider.value = DEFAULT_DETAILED_REVIEW_CHARACTER_LIMIT;
    if (detailedReviewLimitValue) detailedReviewLimitValue.textContent = `${DEFAULT_DETAILED_REVIEW_CHARACTER_LIMIT} chars`;
    localStorage.setItem('posterboxd_detailed_review_limit', String(DEFAULT_DETAILED_REVIEW_CHARACTER_LIMIT));
    const detailedReviewCount = document.getElementById('detailed-review-char-count');
    if (detailedReviewCount) detailedReviewCount.textContent = `${(state.detailedReview || '').length} chars`;

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
