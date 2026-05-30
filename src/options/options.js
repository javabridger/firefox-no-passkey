'use strict';

const enabledEl = document.getElementById('enabled');
const showToastEl = document.getElementById('showToast');
const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');
const addForm = document.getElementById('addForm');
const addInput = document.getElementById('addInput');

function area() {
  return browser.storage.sync ?? browser.storage.local;
}

function normalizeOrigin(value) {
  const raw = value.trim();
  if (!raw) return null;
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).origin;
  } catch (_e) {
    return null;
  }
}

async function load() {
  const { enabled = true, showToast = true, allowlist = [] } = await area().get([
    'enabled', 'showToast', 'allowlist',
  ]);
  enabledEl.checked = enabled;
  showToastEl.checked = showToast;
  renderList(allowlist);
}

function renderList(allowlist) {
  listEl.textContent = '';
  emptyEl.hidden = allowlist.length > 0;
  for (const origin of allowlist) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = origin;
    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => removeOrigin(origin));
    li.append(span, remove);
    listEl.append(li);
  }
}

async function removeOrigin(origin) {
  const { allowlist = [] } = await area().get('allowlist');
  await area().set({ allowlist: allowlist.filter((o) => o !== origin) });
}

enabledEl.addEventListener('change', () => area().set({ enabled: enabledEl.checked }));
showToastEl.addEventListener('change', () => area().set({ showToast: showToastEl.checked }));

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const origin = normalizeOrigin(addInput.value);
  if (!origin) {
    addInput.setCustomValidity('Enter a valid site, e.g. https://example.com');
    addInput.reportValidity();
    return;
  }
  addInput.setCustomValidity('');
  const { allowlist = [] } = await area().get('allowlist');
  await area().set({ allowlist: Array.from(new Set([...allowlist, origin])) });
  addInput.value = '';
});

addInput.addEventListener('input', () => addInput.setCustomValidity(''));

// Keep the UI live if storage changes elsewhere (popup, toast "Allow this site").
browser.storage.onChanged.addListener((changes) => {
  if (changes.allowlist) renderList(changes.allowlist.newValue || []);
  if (changes.enabled) enabledEl.checked = changes.enabled.newValue;
  if (changes.showToast) showToastEl.checked = changes.showToast.newValue;
});

load();
