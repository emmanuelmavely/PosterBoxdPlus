export function showToast(message, isError = false) {
  const banner = document.getElementById('toast-banner');
  const icon = document.getElementById('toast-icon');
  const messageElement = document.getElementById('toast-message');
  if (!banner || !messageElement) return;

  messageElement.textContent = message;
  if (icon) {
    icon.className = isError
      ? 'fa-solid fa-triangle-exclamation text-amber-400'
      : 'fa-solid fa-circle-check text-lbgreen';
  }
  banner.classList.remove('opacity-0', '-translate-y-2');
  banner.classList.add('opacity-100', 'translate-y-0');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    banner.classList.add('opacity-0', '-translate-y-2');
    banner.classList.remove('opacity-100', 'translate-y-0');
  }, 2600);
}
