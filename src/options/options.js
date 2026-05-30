'use strict';

const blockCreateEl = document.getElementById('blockCreate');
const blockGetEl = document.getElementById('blockGet');
const showToastEl = document.getElementById('showToast');
const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');
const countEl = document.getElementById('count');
const addForm = document.getElementById('addForm');
const addInput = document.getElementById('addInput');

function area() {
  return browser.storage.sync ?? browser.storage.local;
}

function normalizeOrigin(value) {
  const raw = value.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch (_e) {
    return null;
  }
}

async function load() {
  const { blockCreate = true, blockGet = true, showToast = true, allowlist = [] } = await area().get([
    'blockCreate', 'blockGet', 'showToast', 'allowlist',
  ]);
  blockCreateEl.checked = blockCreate;
  blockGetEl.checked = blockGet;
  showToastEl.checked = showToast;
  renderList(allowlist);
}

function renderList(allowlist) {
  listEl.textContent = '';
  emptyEl.hidden = allowlist.length > 0;
  countEl.textContent = `${allowlist.length} ${allowlist.length === 1 ? 'origin' : 'origins'}`;
  for (const origin of allowlist) {
    const li = document.createElement('li');
    li.className = 'origin-row';
    const span = document.createElement('span');
    span.className = 'origin';
    span.textContent = origin;
    const remove = document.createElement('button');
    remove.className = 'remove';
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove ${origin}`);
    remove.textContent = '✕';
    remove.addEventListener('click', () => removeOrigin(origin));
    li.append(span, remove);
    listEl.append(li);
  }
}

async function removeOrigin(origin) {
  const { allowlist = [] } = await area().get('allowlist');
  await area().set({ allowlist: allowlist.filter((o) => o !== origin) });
}

blockCreateEl.addEventListener('change', () => area().set({ blockCreate: blockCreateEl.checked }));
blockGetEl.addEventListener('change', () => area().set({ blockGet: blockGetEl.checked }));
showToastEl.addEventListener('change', () => area().set({ showToast: showToastEl.checked }));

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const origin = normalizeOrigin(addInput.value);
  if (!origin) {
    addInput.setCustomValidity('Enter a valid http(s) site, e.g. https://example.com');
    addInput.reportValidity();
    return;
  }
  addInput.setCustomValidity('');
  const { allowlist = [] } = await area().get('allowlist');
  // Prepend, dedupe.
  await area().set({ allowlist: Array.from(new Set([origin, ...allowlist])) });
  addInput.value = '';
});

addInput.addEventListener('input', () => addInput.setCustomValidity(''));

// Keep the UI live if storage changes elsewhere (popup, toast "Allow this site").
browser.storage.onChanged.addListener((changes) => {
  if (changes.allowlist) renderList(changes.allowlist.newValue || []);
  if (changes.blockCreate) blockCreateEl.checked = changes.blockCreate.newValue;
  if (changes.blockGet) blockGetEl.checked = changes.blockGet.newValue;
  if (changes.showToast) showToastEl.checked = changes.showToast.newValue;
});

load();
