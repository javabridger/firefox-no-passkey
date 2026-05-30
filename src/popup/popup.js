'use strict';

const statusEl = document.getElementById('status');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const allowRow = document.getElementById('allowRow');
const allowSub = document.getElementById('allowSub');
const allowSiteEl = document.getElementById('allowSite');
const blockCreateEl = document.getElementById('blockCreate');
const blockGetEl = document.getElementById('blockGet');

let origin = null;
let host = null;

function area() {
  return browser.storage.sync ?? browser.storage.local;
}

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  try {
    const url = new URL(tab.url);
    origin = url.origin;
    host = url.hostname;
  } catch (_e) {
    origin = null;
    host = null;
  }

  const { blockCreate = true, blockGet = true, allowlist = [] } = await area().get([
    'blockCreate', 'blockGet', 'allowlist',
  ]);
  blockCreateEl.checked = blockCreate;
  blockGetEl.checked = blockGet;

  const isWebPage = origin && /^https?:/.test(origin);
  if (isWebPage) {
    allowSiteEl.checked = allowlist.includes(origin);
    allowSub.textContent = `Override blocking for ${host}`;
    allowRow.classList.remove('rowB--disabled');
  } else {
    allowSiteEl.disabled = true;
    allowRow.classList.add('rowB--disabled');
  }
  renderStatus({ blockCreate, blockGet, allowed: isWebPage && allowSiteEl.checked, isWebPage });
}

function setStatusText(prefix, boldText) {
  statusText.textContent = prefix;
  if (boldText) {
    const b = document.createElement('b');
    b.textContent = boldText;
    statusText.append(b);
  }
}

function renderStatus({ blockCreate, blockGet, allowed, isWebPage }) {
  if (!isWebPage) {
    statusDot.classList.remove('dot--on');
    statusEl.classList.add('popB__status--off');
    setStatusText('No web page in this tab');
    return;
  }
  const blocking = blockCreate || blockGet;
  if (allowed || !blocking) {
    statusDot.classList.remove('dot--on');
    statusEl.classList.add('popB__status--off');
    setStatusText(allowed ? 'Passkeys allowed on ' : 'Not blocking on ', host);
  } else {
    statusDot.classList.add('dot--on');
    statusEl.classList.remove('popB__status--off');
    setStatusText('Protected on ', host);
  }
}

function refreshStatus() {
  renderStatus({
    blockCreate: blockCreateEl.checked,
    blockGet: blockGetEl.checked,
    allowed: allowSiteEl.checked,
    isWebPage: origin && /^https?:/.test(origin),
  });
}

allowSiteEl.addEventListener('change', async () => {
  if (!origin) return;
  const { allowlist = [] } = await area().get('allowlist');
  const next = allowSiteEl.checked
    ? Array.from(new Set([...allowlist, origin]))
    : allowlist.filter((o) => o !== origin);
  await area().set({ allowlist: next });
  refreshStatus();
});

blockCreateEl.addEventListener('change', async () => {
  await area().set({ blockCreate: blockCreateEl.checked });
  refreshStatus();
});

blockGetEl.addEventListener('change', async () => {
  await area().set({ blockGet: blockGetEl.checked });
  refreshStatus();
});

document.getElementById('options').addEventListener('click', () => {
  browser.runtime.openOptionsPage();
  window.close();
});

init();
