import { state } from '../state.js';
import { getSavedHistory } from '../services/storage.js';
import { scheduleCanvasRender } from '../rendering/canvas-renderer.js';

let renderHistoryList = () => {};

export function configureNavigation({ historyRenderer } = {}) {
  if (typeof historyRenderer === 'function') renderHistoryList = historyRenderer;
}

export function updateHeaderHistoryVisibility() {
  const historyButton = document.getElementById('header-history-btn');
  const countBadge = document.getElementById('header-history-count');
  if (!historyButton) return;

  const history = getSavedHistory();
  if (countBadge) countBadge.textContent = String(history.length);
  if (history.length > 0) {
    historyButton.classList.remove('hidden');
    historyButton.classList.add('flex');
  } else {
    historyButton.classList.add('hidden');
    historyButton.classList.remove('flex');
  }
}

export function switchView(viewName, openSettingsDrawer = false) {
  state.currentView = viewName;
  const homeView = document.getElementById('view-home');
  const reviewView = document.getElementById('view-review');
  const previewView = document.getElementById('view-preview');
  const historyView = document.getElementById('view-history');
  const headerSearch = document.getElementById('header-search-container');
  const bottomNavigation = document.getElementById('mobile-bottom-nav');

  homeView?.classList.toggle('hidden', viewName !== 'home');
  reviewView?.classList.toggle('hidden', viewName !== 'review');
  previewView?.classList.toggle('hidden', viewName !== 'preview');
  historyView?.classList.toggle('hidden', viewName !== 'history');
  updateHeaderHistoryVisibility();

  document.querySelectorAll('[data-breadcrumb-target]').forEach((button) => {
    const isActive = button.dataset.breadcrumbTarget === viewName;
    button.classList.toggle('text-white', isActive);
    button.classList.toggle('text-lbgreen', isActive);
    button.classList.toggle('font-semibold', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  if (viewName === 'home') {
    headerSearch?.classList.add('hidden');
    bottomNavigation?.classList.remove('bottom-nav-enter');
    bottomNavigation?.classList.add('bottom-nav-hidden');
  } else {
    headerSearch?.classList.remove('hidden');
    bottomNavigation?.classList.remove('bottom-nav-hidden');
    bottomNavigation?.classList.add('bottom-nav-enter');
  }

  let activeTab = 'design';
  if (viewName === 'review') activeTab = 'review';
  else if (viewName === 'history') activeTab = 'history';
  else if (openSettingsDrawer) activeTab = 'settings';

  document.querySelectorAll('.bottom-nav-btn').forEach((button) => {
    const isActive = button.dataset.navTarget === activeTab;
    button.classList.toggle('active', isActive);
    button.classList.toggle('bg-elevated', isActive);
    button.classList.toggle('text-lbgreen', isActive);
    button.classList.toggle('border', isActive);
    button.classList.toggle('border-lbgreen/30', isActive);
    button.classList.toggle('text-gray-400', !isActive);
  });

  if (viewName === 'history') renderHistoryList();

  if (viewName === 'preview') {
    scheduleCanvasRender();
    const settingsAccordion = document.getElementById('settings-accordion');
    if (openSettingsDrawer && settingsAccordion) {
      settingsAccordion.open = true;
      setTimeout(() => settingsAccordion.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

export function initNavigation() {
  document.getElementById('brand-home-trigger')?.addEventListener('click', () => switchView('home'));
  document.getElementById('header-history-btn')?.addEventListener('click', () => switchView('history'));
  document.getElementById('proceed-to-preview-btn')?.addEventListener('click', () => switchView('preview', false));

  document.querySelectorAll('[data-breadcrumb-target]').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.breadcrumbTarget, false));
  });

  document.querySelectorAll('.bottom-nav-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.navTarget;
      if (target === 'review') switchView('review', false);
      else if (target === 'design') switchView('preview', false);
      else if (target === 'settings') switchView('preview', true);
      else if (target === 'history') switchView('history', false);
    });
  });
}
