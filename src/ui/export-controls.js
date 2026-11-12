import { state } from '../state.js';
import { getSafeSlug } from '../utils.js';
import { showToast } from './toast.js';

export function initExportControls() {
  const canvas = document.getElementById('poster-canvas');
  if (!canvas) return;

  const downloadButton = document.getElementById('download-poster-btn');
  const copyButton = document.getElementById('copy-poster-btn');
  const shareButton = document.getElementById('share-poster-btn');

  const getFileName = () =>
    `posterboxd-${getSafeSlug(state.title)}-${state.archetype}-${String(state.aspectRatio).replace(':', 'x')}.png`;

  // iOS ignores <a download> for blob URLs inside an installed (standalone) web app and
  // saves to Files rather than Photos in Safari, so the share sheet ("Save Image") is the
  // reliable route there.
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const downloadBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = getFileName();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    showToast('Saved high-res PNG!');
  };

  downloadButton?.addEventListener('click', () => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast('Could not render the PNG — try a different artwork', true);
        return;
      }
      if (isIOS) {
        const file = new File([blob], getFileName(), { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file] });
            return;
          } catch (error) {
            if (error && error.name === 'AbortError') return;
          }
        }
      }
      downloadBlob(blob);
    }, 'image/png');
  });

  copyButton?.addEventListener('click', () => {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          const copyButtonText = document.getElementById('copy-btn-text');
          if (copyButtonText) copyButtonText.textContent = 'Copied!';
          setTimeout(() => {
            if (copyButtonText) copyButtonText.textContent = 'Copy';
          }, 2000);
          showToast('Copied poster to clipboard!');
        } else {
          throw new Error('Unsupported');
        }
      } catch (error) {
        showToast('Clipboard restricted — use Save PNG', true);
      }
    }, 'image/png');
  });

  shareButton?.addEventListener('click', () => {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], getFileName(), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${state.title} (${state.year}) — PosterBoxd`,
            text: state.review,
            files: [file]
          });
        } catch (error) {
          // User cancellation and unavailable share targets are intentionally silent.
        }
      } else {
        document.getElementById('download-poster-btn')?.click();
      }
    }, 'image/png');
  });
}
