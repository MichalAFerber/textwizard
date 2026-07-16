// Mounts a tool onto its page. Reuses the framework-agnostic feature modules:
// render() draws the editor into #feature-root, and the feature's action list
// is rendered as a button row in #tool-actions (where the old app put them in a
// sidebar). The tool to mount is read from #feature-root[data-tool].

import { setupToast, preventStrayFileDrops } from './globals.js';
import { caseConverter } from '../features/case-converter.js';
import { textTools } from '../features/text-tools.js';
import { codeData } from '../features/code-data.js';
import { translators } from '../features/translators.js';
import { analyzers } from '../features/analyzers.js';
import { diff } from '../features/diff.js';
import { fancyText } from '../features/fancy-text.js';
import { generators } from '../features/generators.js';
import { qrCode } from '../features/qr-code.js';

const REGISTRY = {};
for (const f of [caseConverter, textTools, codeData, translators, analyzers, diff, fancyText, generators, qrCode]) {
  REGISTRY[f.id] = f;
}

export function mountTool() {
  setupToast();
  preventStrayFileDrops();

  const root = document.getElementById('feature-root');
  if (!root) return;
  const feature = REGISTRY[root.dataset.tool];
  if (!feature) return;

  const handle = feature.render(root);

  const actionsEl = document.getElementById('tool-actions');
  if (!actionsEl) return;
  if (!(feature.actions && feature.actions.length)) {
    actionsEl.remove(); // tools like QR render their own controls
    return;
  }
  for (const action of feature.actions) {
    if (action.section) {
      const h = document.createElement('div');
      h.className = 'btn-section';
      h.textContent = action.section;
      actionsEl.appendChild(h);
    } else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = action.className || 'btn';
      btn.textContent = action.label;
      if (action.title) btn.title = action.title;
      btn.addEventListener('click', () => action.onClick(handle));
      actionsEl.appendChild(btn);
    }
  }
}
