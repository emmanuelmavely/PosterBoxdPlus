import { CUSTOM_LOGO_SVG_DATA } from '../constants.js';

export const renderRuntime = {
  grainPatternCanvas: null,
  customBrandSvgImg: null
};

export function initRenderRuntime() {
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = 180;
  grainCanvas.height = 180;
  const grainContext = grainCanvas.getContext('2d');
  const imageData = grainContext.createImageData(180, 180);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const value = (Math.random() * 255) | 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 16;
  }
  grainContext.putImageData(imageData, 0, 0);
  renderRuntime.grainPatternCanvas = grainCanvas;

  const logoImage = new Image();
  logoImage.onload = () => { renderRuntime.customBrandSvgImg = logoImage; };
  logoImage.src = CUSTOM_LOGO_SVG_DATA;
}
