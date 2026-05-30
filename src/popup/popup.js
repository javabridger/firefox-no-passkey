'use strict';

const siteEl = document.getElementById('site');
const allowSiteEl = document.getElementById('allowSite');
const enabledEl = document.getElementById('enabled');
const statusEl = document.getElementById('status');

let origin = null;

function area() {
  return browser.storage.sync ?? browser.storage.local;
}

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  try {
    origin = tab && tab.url ? new URL(tab.url).origin : null;
  } catch (_e) {
    origin = null;
  }

  const { enabled = true, allowlist = [] } = await area().get(['enabled', 'allowlist']);
  enabledEl.checked = enabled;

  if (origin && /^https?:/.test(origin)) {
    siteEl.textContent = origin;
    allowSiteEl.checked = allowlist.includes(origin);
    allowSiteEl.disabled = false;
  } else {
    siteEl.textContent = 'No web page in this tab';
    allowSiteEl.disabled = true;
  }
}

allowSiteEl.addEventListener('change', async () => {
  if (!origin) return;
  const { allowlist = [] } = await area().get('allowlist');
  const next = allowSiteEl.checked
    ? Array.from(new Set([...allowlist, origin]))
    : allowlist.filter((o) => o !== origin);
  await area().set({ allowlist: next });
  flash(allowSiteEl.checked ? 'Passkeys allowed here. Reload to apply.' : 'Passkeys blocked here. Reload to apply.');
});

enabledEl.addEventListener('change', async () => {
  await area().set({ enabled: enabledEl.checked });
  flash(enabledEl.checked ? 'Blocking enabled.' : 'Blocking disabled everywhere.');
});

document.getElementById('options').addEventListener('click', () => {
  browser.runtime.openOptionsPage();
  window.close();
});

function flash(text) {
  statusEl.textContent = text;
}

init();
