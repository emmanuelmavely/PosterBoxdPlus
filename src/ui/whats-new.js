import { APP_VERSION, CURRENT_RELEASE_NOTES, RELEASE_DATE } from '../constants.js';

export function openWhatsNewMenu() {
  const modal = document.getElementById('whats-new-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

export function closeWhatsNewMenu() {
  const modal = document.getElementById('whats-new-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

export function initWhatsNewMenu() {
  document.querySelectorAll('[data-app-version]').forEach((badge) => {
    badge.textContent = APP_VERSION;
    badge.title = `What's new in ${APP_VERSION}`;
    badge.setAttribute('aria-label', `What's new in ${APP_VERSION}`);
    badge.classList.add('cursor-pointer');
    badge.addEventListener('click', openWhatsNewMenu);
  });

  const versionLabel = document.getElementById('whats-new-version');
  const releaseDate = document.getElementById('whats-new-date');
  const notes = document.getElementById('whats-new-list');
  if (versionLabel) versionLabel.textContent = APP_VERSION;
  if (releaseDate) releaseDate.textContent = RELEASE_DATE;
  if (notes) {
    notes.innerHTML = CURRENT_RELEASE_NOTES.map((note) => `
      <li class="flex items-start gap-2.5">
        <i class="fa-solid fa-check text-lbgreen text-[10px] mt-1 shrink-0"></i>
        <span>${note}</span>
      </li>
    `).join('');
  }

  document.getElementById('close-whats-new-btn')?.addEventListener('click', closeWhatsNewMenu);
  document.getElementById('whats-new-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'whats-new-modal') closeWhatsNewMenu();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeWhatsNewMenu();
  });
}
