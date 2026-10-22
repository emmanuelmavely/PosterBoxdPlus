import { state } from '../state.js';
import { getSafeSlug } from '../utils.js';
import { showToast } from './toast.js';

export function initExportControls() {
  const canvas = document.getElementById('poster-canvas');
  if (!canvas) return;

  const downloadButton = document.getElementById('download-poster-btn');
  const copyButton = document.getElementById('copy-poster-btn');
  const shareButton = document.getElementById('share-poster-btn');

  downloadButton?.addEventListener('click', () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `posterboxd-${getSafeSlug(state.title)}-${state.archetype}.png`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      showToast('Saved high-res PNG!');
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
      const file = new File([blob], `posterboxd-${getSafeSlug(state.title)}.png`, { type: 'image/png' });
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
