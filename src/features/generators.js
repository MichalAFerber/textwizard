import { createEditor, askInputs } from './_editor.js';

const PLACEHOLDER = 'Generators write their output here. "Random choice" reads the lines you paste in.';

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const LOREM = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod ' +
  'tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis ' +
  'nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis ' +
  'aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur').split(' ');

function uuidLines(n) {
  return Array.from({ length: n }, () => crypto.randomUUID()).join('\n');
}

function makePassword(len, { lower = true, upper = true, digits = true, symbols = false } = {}) {
  let pool = '';
  if (lower) pool += LETTERS;
  if (upper) pool += LETTERS.toUpperCase();
  if (digits) pool += '0123456789';
  if (symbols) pool += '!@#$%^&*()-_=+[]{};:,.?/';
  if (!pool) pool = LETTERS;
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < len; i++) out += pool[buf[i] % pool.length];
  return out;
}

function randomNumbers(min, max, count) {
  if (min > max) [min, max] = [max, min];
  return Array.from({ length: count }, () => String(randInt(min, max))).join('\n');
}

const randomLetter = () => pick(LETTERS.split(''));
const randomMonth = () => pick(MONTHS);

function randomDates(startStr, endStr, count) {
  const a = new Date(startStr).getTime();
  const b = new Date(endStr).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) throw new Error('Enter valid start and end dates (YYYY-MM-DD)');
  const lo = Math.min(a, b), hi = Math.max(a, b);
  return Array.from({ length: count }, () =>
    new Date(lo + Math.random() * (hi - lo)).toISOString().slice(0, 10)
  ).join('\n');
}

function randomChoice(text, n) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) throw new Error('Paste some non-empty lines to choose from first');
  const shuffled = [...lines];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(n, shuffled.length)).join('\n');
}

const randomIP = () => Array.from({ length: 4 }, () => randInt(0, 255)).join('.');
const randomHexColor = () =>
  '#' + Array.from({ length: 3 }, () => randInt(0, 255).toString(16).padStart(2, '0')).join('');

function loremIpsum(paras, wordsPer) {
  const out = [];
  for (let p = 0; p < paras; p++) {
    const words = Array.from({ length: wordsPer }, () => pick(LOREM));
    const s = words.join(' ');
    out.push(s.charAt(0).toUpperCase() + s.slice(1) + '.');
  }
  return out.join('\n\n');
}

// Exported for unit tests; the UI wires these through the actions below.
export const _gen = {
  uuidLines, makePassword, randomNumbers, randomLetter, randomMonth,
  randomDates, randomChoice, randomIP, randomHexColor, loremIpsum,
};

const clampCount = (v, fallback = 1) => Math.max(1, Math.min(1000, parseInt(v, 10) || fallback));

const ACTIONS = [
  { section: 'Identifiers' },
  {
    label: 'UUID…',
    className: 'btn btn-primary',
    onClick: async ({ setValue }) => {
      const ans = await askInputs({
        title: 'Generate UUIDs',
        fields: [{ key: 'count', label: 'How many', type: 'number', default: '1' }],
        submitLabel: 'Generate',
      });
      if (!ans) return;
      setValue(uuidLines(clampCount(ans.count)));
    },
  },
  {
    label: 'Password…',
    onClick: async ({ setValue }) => {
      const ans = await askInputs({
        title: 'Random password',
        fields: [
          { key: 'len', label: 'Length', type: 'number', default: '20' },
          { key: 'count', label: 'How many', type: 'number', default: '1' },
          { key: 'symbols', label: 'Include symbols? (yes/no)', default: 'yes' },
        ],
        submitLabel: 'Generate',
      });
      if (!ans) return;
      const len = Math.max(4, Math.min(256, parseInt(ans.len, 10) || 20));
      const symbols = /^y/i.test((ans.symbols || '').trim());
      const lines = Array.from({ length: clampCount(ans.count) }, () => makePassword(len, { symbols }));
      setValue(lines.join('\n'));
    },
  },

  { section: 'Numbers & picks' },
  {
    label: 'Random number…',
    onClick: async ({ setValue }) => {
      const ans = await askInputs({
        title: 'Random number',
        fields: [
          { key: 'min', label: 'Min', type: 'number', default: '1' },
          { key: 'max', label: 'Max', type: 'number', default: '100' },
          { key: 'count', label: 'How many', type: 'number', default: '1' },
        ],
        submitLabel: 'Generate',
      });
      if (!ans) return;
      const min = parseInt(ans.min, 10) || 0;
      const max = parseInt(ans.max, 10) || 0;
      setValue(randomNumbers(min, max, clampCount(ans.count)));
    },
  },
  { label: 'Random letter', onClick: ({ setValue }) => setValue(randomLetter()) },
  { label: 'Random month', onClick: ({ setValue }) => setValue(randomMonth()) },
  {
    label: 'Random date…',
    onClick: async ({ setValue }) => {
      const ans = await askInputs({
        title: 'Random date in range',
        fields: [
          { key: 'start', label: 'Start (YYYY-MM-DD)', default: '2000-01-01' },
          { key: 'end', label: 'End (YYYY-MM-DD)', default: '2030-12-31' },
          { key: 'count', label: 'How many', type: 'number', default: '1' },
        ],
        submitLabel: 'Generate',
      });
      if (!ans) return;
      try { setValue(randomDates(ans.start, ans.end, clampCount(ans.count))); }
      catch (e) { window.tw.toast(e.message); }
    },
  },
  {
    label: 'Random choice…',
    title: 'Pick N random lines from the textarea',
    onClick: async ({ getValue, setValue }) => {
      const ans = await askInputs({
        title: 'Random choice from lines',
        fields: [{ key: 'n', label: 'How many to pick', type: 'number', default: '1' }],
        submitLabel: 'Pick',
      });
      if (!ans) return;
      try { setValue(randomChoice(getValue(), clampCount(ans.n))); }
      catch (e) { window.tw.toast(e.message); }
    },
  },

  { section: 'Web & filler' },
  { label: 'Random IP', onClick: ({ setValue }) => setValue(randomIP()) },
  { label: 'Random hex color', onClick: ({ setValue }) => setValue(randomHexColor()) },
  {
    label: 'Lorem ipsum…',
    onClick: async ({ setValue }) => {
      const ans = await askInputs({
        title: 'Lorem ipsum',
        fields: [
          { key: 'paras', label: 'Paragraphs', type: 'number', default: '3' },
          { key: 'words', label: 'Words per paragraph', type: 'number', default: '40' },
        ],
        submitLabel: 'Generate',
      });
      if (!ans) return;
      const paras = Math.max(1, Math.min(100, parseInt(ans.paras, 10) || 3));
      const words = Math.max(1, Math.min(500, parseInt(ans.words, 10) || 40));
      setValue(loremIpsum(paras, words));
    },
  },
];

export const generators = {
  id: 'generators',
  navLabel: 'Generators',
  navIcon: '⚄',
  title: 'Generators',
  subtitle: 'Generate UUIDs, passwords, random numbers, colors, dates, and filler text.',
  actions: ACTIONS,
  render(container) {
    return createEditor({
      container,
      storageKey: 'tw::generators',
      placeholderText: PLACEHOLDER,
      buttons: ACTIONS,
      toolbarLeft: [
        {
          label: 'Copy',
          className: 'btn btn-primary',
          onClick: async ({ getValue }) => {
            try { await navigator.clipboard.writeText(getValue()); window.tw.toast('Copied to clipboard'); }
            catch { window.tw.toast('Copy failed'); }
          },
        },
      ],
      toolbarRight: [
        { label: 'Clear', className: 'btn btn-ghost', onClick: ({ setValue }) => setValue('') },
      ],
    });
  },
};
