// Browser globals the tool feature modules rely on.

// The toast helper features call via window.tw.toast(...).
export function setupToast() {
  if (window.tw && window.tw.toast) return;
  let el = null;
  let timer = null;
  window.tw = window.tw || {};
  window.tw.toast = (msg) => {
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), 1600);
  };
}

// Stop a file dropped outside the textarea from navigating the page away.
export function preventStrayFileDrops() {
  const isFileDrag = (e) =>
    e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
  window.addEventListener('dragover', (e) => { if (isFileDrag(e)) e.preventDefault(); });
  window.addEventListener('drop', (e) => { if (isFileDrag(e)) e.preventDefault(); });
}
