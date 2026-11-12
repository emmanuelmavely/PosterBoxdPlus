import { state } from '../state.js';
import { scheduleCanvasRender } from '../rendering/canvas-renderer.js';
import { getElTransform, saveTransformsToStorage } from '../rendering/transforms.js';
import { showToast } from './toast.js';

export function initCanvasInteractions() {
  const canvas = document.getElementById('poster-canvas');
  if (!canvas) return;

  const editModeButton = document.getElementById('toggle-edit-mode-btn');
  const editModeText = document.getElementById('edit-mode-btn-text');
  const interactiveToolbar = document.getElementById('interactive-toolbar');
  const selectedElementLabel = document.getElementById('selected-el-label');

  editModeButton?.addEventListener('click', () => {
    state.isInteractiveEdit = !state.isInteractiveEdit;
    interactiveToolbar?.classList.toggle('hidden', !state.isInteractiveEdit);
    editModeButton.classList.toggle('border-lbgreen', state.isInteractiveEdit);
    editModeButton.classList.toggle('text-lbgreen', state.isInteractiveEdit);
    if (editModeText) editModeText.textContent = state.isInteractiveEdit ? 'Done Moving' : 'Move & Resize';
    if (state.isInteractiveEdit && !state.selectedElementId && state.hitBoxes[0]) {
      state.selectedElementId = state.hitBoxes[0].id;
      if (selectedElementLabel) selectedElementLabel.textContent = `Selected: ${state.hitBoxes[0].label}`;
    }
    scheduleCanvasRender();
  });

  let draggingId = null;
  let dragStart = { x: 0, y: 0, origDx: 0, origDy: 0 };

  const getCanvasCoords = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const onPointerDown = (clientX, clientY) => {
    if (!state.isInteractiveEdit) return false;
    const point = getCanvasCoords(clientX, clientY);
    const hit = [...state.hitBoxes].reverse().find((box) =>
      point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h
    );
    if (hit) {
      state.selectedElementId = hit.id;
      draggingId = hit.id;
      const transform = getElTransform(hit.id);
      dragStart = { x: point.x, y: point.y, origDx: transform.dx, origDy: transform.dy };
      if (selectedElementLabel) selectedElementLabel.textContent = `Selected: ${hit.label}`;
      scheduleCanvasRender();
    }
    return Boolean(hit);
  };

  const onPointerMove = (clientX, clientY) => {
    if (!state.isInteractiveEdit || !draggingId) return;
    const point = getCanvasCoords(clientX, clientY);
    const transform = getElTransform(draggingId);
    transform.dx = dragStart.origDx + (point.x - dragStart.x);
    transform.dy = dragStart.origDy + (point.y - dragStart.y);
    scheduleCanvasRender();
  };

  canvas.addEventListener('mousedown', (event) => onPointerDown(event.clientX, event.clientY));
  window.addEventListener('mousemove', (event) => onPointerMove(event.clientX, event.clientY));

  canvas.addEventListener('touchstart', (event) => {
    // Only claim the gesture when a block is actually grabbed, so a touch on empty
    // poster area still scrolls the page instead of trapping the user on the canvas.
    if (state.isInteractiveEdit && event.touches.length === 1) {
      if (onPointerDown(event.touches[0].clientX, event.touches[0].clientY)) event.preventDefault();
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (event) => {
    if (state.isInteractiveEdit && draggingId && event.touches[0]) {
      event.preventDefault();
      onPointerMove(event.touches[0].clientX, event.touches[0].clientY);
    }
  }, { passive: false });

  document.getElementById('el-scale-up-btn')?.addEventListener('click', () => {
    if (!state.selectedElementId) return;
    const transform = getElTransform(state.selectedElementId);
    transform.scale = Math.min(2.0, +(transform.scale + 0.08).toFixed(2));
    saveTransformsToStorage();
    scheduleCanvasRender();
  });

  document.getElementById('el-scale-down-btn')?.addEventListener('click', () => {
    if (!state.selectedElementId) return;
    const transform = getElTransform(state.selectedElementId);
    transform.scale = Math.max(0.4, +(transform.scale - 0.08).toFixed(2));
    saveTransformsToStorage();
    scheduleCanvasRender();
  });

  document.getElementById('el-reset-single-btn')?.addEventListener('click', () => {
    if (state.elementTransformsByArchetype[state.archetype]) {
      state.elementTransformsByArchetype[state.archetype] = {};
      saveTransformsToStorage();
    }
    scheduleCanvasRender();
    showToast('Current design element positions reset');
  });

  // Release: persist the dragged position, then let go. touchcancel matters on phones:
  // a system gesture (notification shade, app switcher, incoming call) ends the touch
  // without a touchend, which otherwise leaves the block glued to the next touch.
  const releaseDrag = () => {
    if (draggingId) saveTransformsToStorage();
    draggingId = null;
  };
  window.addEventListener('mouseup', releaseDrag);
  canvas.addEventListener('touchend', releaseDrag);
  canvas.addEventListener('touchcancel', releaseDrag);
}
