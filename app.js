import { caseConverter } from './features/case-converter.js';
import { textTools } from './features/text-tools.js';
import { codeData } from './features/code-data.js';
import { translators } from './features/translators.js';
import { analyzers } from './features/analyzers.js';
import { diff } from './features/diff.js';
import { fancyText } from './features/fancy-text.js';
import { generators } from './features/generators.js';
import { qrCode } from './features/qr-code.js';

// Register features here. To add a new feature: write a module that exports
// { id, title, subtitle, navLabel, navIcon, render(container) } and add it below.
const features = [caseConverter, textTools, codeData, translators, analyzers, diff, fancyText, generators, qrCode];

const nav = document.getElementById('nav');
const main = document.getElementById('main');

// Editor handle for the currently rendered feature. Sidebar action buttons
// dispatch their onClick with this context.
let currentEditor = null;
let pendingAction = null;

function renderNav(activeId) {
  nav.innerHTML = '';
  for (const f of features) {
    const link = document.createElement('a');
    link.href = `#${f.id}`;
    link.className = `nav-link ${f.id === activeId ? 'active' : ''}`;
    const hasActions = !!(f.actions && f.actions.length);
    link.innerHTML = `
      <span class="nav-icon">${f.navIcon}</span>
      <span class="nav-label">${f.navLabel}</span>
      ${hasActions ? '<span class="nav-chevron" aria-hidden="true">›</span>' : ''}
    `;
    nav.appendChild(link);

    if (f.id !== activeId || !hasActions) continue;

    const sub = document.createElement('div');
    sub.className = 'nav-sub';
    for (const action of f.actions) {
      if (action.section) {
        const h = document.createElement('div');
        h.className = 'nav-sub-section';
        h.textContent = action.section;
        sub.appendChild(h);
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nav-sub-btn';
        btn.textContent = action.label;
        if (action.title) btn.title = action.title;
        btn.addEventListener('click', () => executeAction(f.id, action));
        sub.appendChild(btn);
      }
    }
    nav.appendChild(sub);
  }
}

function executeAction(featureId, action) {
  if (currentRoute() === featureId && currentEditor) {
    action.onClick(currentEditor);
    return;
  }
  pendingAction = action;
  window.location.hash = '#' + featureId;
}

function renderFeature(id) {
  const feature = features.find((f) => f.id === id) || features[0];
  renderNav(feature.id);

  main.innerHTML = `
    <header class="page-header">
      <h1 class="page-title">${feature.title}</h1>
      <p class="page-subtitle">${feature.subtitle}</p>
    </header>
    <div id="feature-root"></div>
  `;
  const handle = feature.render(document.getElementById('feature-root'));
  currentEditor = handle || null;

  if (pendingAction) {
    const action = pendingAction;
    pendingAction = null;
    if (currentEditor) action.onClick(currentEditor);
  }
}

const ROUTE_ALIASES = { 'whitespace-cleaner': 'text-tools' };

function currentRoute() {
  const raw = window.location.hash.replace(/^#/, '') || features[0].id;
  return ROUTE_ALIASES[raw] || raw;
}

window.addEventListener('hashchange', () => renderFeature(currentRoute()));
renderFeature(currentRoute());

// Prevent the browser from navigating away if a file drop misses the textarea.
window.addEventListener('dragover', (e) => {
  if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
    e.preventDefault();
  }
});
window.addEventListener('drop', (e) => {
  if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
    e.preventDefault();
  }
});

// Theme toggle: data-theme="dark" on <html>, persisted to localStorage.
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('tw::theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('tw::theme', 'dark');
    }
  });
}

// Tiny toast helper available to features.
let toastEl = null;
let toastTimer = null;
window.tw = {
  toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
  },
};
