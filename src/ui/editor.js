import { state } from '../state.js';
import { ARCHETYPE_NAMES } from '../constants.js';
import { addAfterRenderListener, renderArchetypeInto } from '../rendering/canvas-renderer.js';

// iOS photo-editor style studio: the poster stays pinned on top, one tool panel
// is visible underneath, and the tool bar at the bottom switches between panels.

let activeTool = 'style';
let thumbSignature = '';
let thumbQueueToken = 0;
let thumbTimer = null;
let lastArchetype = '';

function isEditorVisible() {
  const view = document.getElementById('view-preview');
  return Boolean(view && !view.classList.contains('hidden'));
}

function setEditMode(shouldBeOn) {
  if (Boolean(state.isInteractiveEdit) !== shouldBeOn) {
    document.getElementById('toggle-edit-mode-btn')?.click();
  }
}

export function openEditorPanel(tool = 'style') {
  const panel = document.querySelector(`[data-editor-panel="${tool}"]`);
  if (!panel) return;
  activeTool = tool;
  document.querySelectorAll('[data-editor-panel]').forEach((element) => {
    element.classList.toggle('hidden', element !== panel);
  });
  document.querySelectorAll('[data-editor-tool]').forEach((button) => {
    const active = button.dataset.editorTool === tool;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    if (active) button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  // "Move" is a mode, not just a panel: blocks are only draggable while it is open.
  setEditMode(tool === 'move');
  if (tool === 'style') scrollActiveStyleIntoView(false);
}

export function closeEditorModes() {
  setEditMode(false);
  if (activeTool === 'move') openEditorPanel('style');
}

function initSubTabs() {
  document.querySelectorAll('.subtabs').forEach((tabList) => {
    const panel = tabList.closest('.editor-panel');
    if (!panel) return;
    tabList.querySelectorAll('[data-sub-target]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = button.dataset.subTarget;
        tabList.querySelectorAll('[data-sub-target]').forEach((other) => other.classList.toggle('active', other === button));
        panel.querySelectorAll('.subpane').forEach((pane) => pane.classList.toggle('hidden', pane.dataset.sub !== target));
        button.scrollIntoView({ block: 'nearest', inline: 'center' });
        syncRangeFills();
      });
    });
  });
}

// Paints the filled part of each slider track (CSS reads --fill).
export function syncRangeFills() {
  document.querySelectorAll('input[type="range"]').forEach((slider) => {
    const min = Number(slider.min || 0);
    const max = Number(slider.max || 100);
    const value = Number(slider.value);
    const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
    slider.style.setProperty('--fill', `${Math.max(0, Math.min(100, percent)).toFixed(1)}%`);
  });
}

function scrollActiveStyleIntoView(smooth = true) {
  const active = document.querySelector('#archetype-pill-strip .arch-select-btn.active');
  if (active && active.offsetParent) {
    active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: smooth ? 'smooth' : 'auto' });
  }
}

function getThumbSignature() {
  return [
    state.title, state.year, state.aspectRatio, state.mediaType, state.review, state.rating, state.isLiked,
    state.posterImg?.src || '', state.backdropImg?.src || '', state.logoImg?.src || '', state.useLogoImage,
    (state.palette || []).join(''), state.medium, state.username
  ].join('|');
}

// Each style button shows a miniature of the real poster. They are drawn one per
// frame so a new film never blocks the UI, and only when something that changes
// every style (film, artwork, palette, ratio, review) has changed.
function refreshStyleThumbnails() {
  if (!isEditorVisible()) return;
  const signature = getThumbSignature();
  if (signature === thumbSignature) return;
  thumbSignature = signature;
  const token = ++thumbQueueToken;
  const buttons = [...document.querySelectorAll('#archetype-pill-strip .arch-select-btn')]
    .filter((button) => !button.classList.contains('hidden'));
  // Start with the selected style and its neighbours: those are on screen.
  const activeIndex = Math.max(0, buttons.findIndex((button) => button.classList.contains('active')));
  buttons.sort((a, b) => Math.abs(buttons.indexOf(a) - activeIndex) - Math.abs(buttons.indexOf(b) - activeIndex));
  const ordered = [...buttons];

  const step = () => {
    if (token !== thumbQueueToken || !isEditorVisible()) {
      if (token === thumbQueueToken) thumbSignature = '';
      return;
    }
    const button = ordered.shift();
    if (!button) return;
    const canvas = button.querySelector('canvas.style-thumb');
    if (canvas) renderArchetypeInto(canvas, button.dataset.archetype, 176);
    setTimeout(step, 30);
  };
  step();
}

function scheduleThumbnailRefresh() {
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(refreshStyleThumbnails, 450);
}

function initStageSwipe() {
  const stage = document.getElementById('desktop-poster-col');
  if (!stage) return;
  let start = null;
  stage.addEventListener('touchstart', (event) => {
    start = (!state.isInteractiveEdit && event.touches.length === 1)
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY, time: Date.now() }
      : null;
  }, { passive: true });
  stage.addEventListener('touchend', (event) => {
    if (!start || state.isInteractiveEdit) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const quick = Date.now() - start.time < 700;
    start = null;
    if (quick && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      document.getElementById(dx < 0 ? 'next-style-btn' : 'prev-style-btn')?.click();
    }
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { start = null; }, { passive: true });
}

export function initEditor({ onBack } = {}) {
  document.querySelectorAll('[data-editor-tool]').forEach((button) => {
    button.addEventListener('click', () => openEditorPanel(button.dataset.editorTool));
  });
  document.getElementById('editor-back-btn')?.addEventListener('click', () => {
    closeEditorModes();
    if (typeof onBack === 'function') onBack();
  });
  initSubTabs();
  initStageSwipe();

  document.addEventListener('input', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.type === 'range') syncRangeFills();
  });

  addAfterRenderListener(() => {
    syncRangeFills();
    if (state.archetype !== lastArchetype) {
      lastArchetype = state.archetype;
      scrollActiveStyleIntoView(true);
      const title = document.getElementById('editor-style-name');
      // "3 / 22 · Full-Bleed Editorial" -> "Full-Bleed Editorial"
      if (title) title.textContent = String(ARCHETYPE_NAMES[state.archetype] || 'Poster').split('· ').pop();
    }
    scheduleThumbnailRefresh();
  });
  syncRangeFills();
}
