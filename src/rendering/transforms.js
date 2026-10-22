import { state } from '../state.js';
import { saveTransformsToStorage } from '../services/storage.js';

export { saveTransformsToStorage };

export function getElTransform(id) {
  const archetype = state.archetype || 'floatingticket';
  if (!state.elementTransformsByArchetype[archetype]) {
    state.elementTransformsByArchetype[archetype] = {};
  }
  if (!state.elementTransformsByArchetype[archetype][id]) {
    state.elementTransformsByArchetype[archetype][id] = { dx: 0, dy: 0, scale: 1.0 };
  }
  return state.elementTransformsByArchetype[archetype][id];
}

export function drawMovableGroup(context, id, label, baseBox, drawFunction) {
  const transform = getElTransform(id);
  const centerX = baseBox.x + baseBox.w / 2 + transform.dx;
  const centerY = baseBox.y + baseBox.h / 2 + transform.dy;
  const scaledWidth = baseBox.w * transform.scale;
  const scaledHeight = baseBox.h * transform.scale;

  context.save();
  context.translate(centerX, centerY);
  context.scale(transform.scale, transform.scale);
  context.translate(-(baseBox.x + baseBox.w / 2), -(baseBox.y + baseBox.h / 2));
  drawFunction();
  context.restore();

  state.hitBoxes.push({
    id,
    label,
    x: centerX - scaledWidth / 2,
    y: centerY - scaledHeight / 2,
    w: scaledWidth,
    h: scaledHeight
  });
}
