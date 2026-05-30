/*
 * NoPasskey bridge (isolated content script).
 *
 * Sits between the MAIN-world shim (inject-main.js) and the extension. It can use
 * WebExtension APIs, so it answers each passkey-registration decision request from
 * storage, shows a non-blocking toast on a block, and asks the background page to
 * bump the toolbar badge.
 */
(function () {
  'use strict';

  const PAGE = 'nopasskey-page';
  const BRIDGE = 'nopasskey-bridge';
  const isTopFrame = window === window.top;

  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== PAGE || data.type !== 'decision-request') return;

    const decision = await decide(data.origin);
    window.postMessage({ source: BRIDGE, type: 'decision-response', id: data.id, decision }, '*');

    if (decision === 'block') {
      browser.runtime.sendMessage({ type: 'blocked', origin: data.origin }).catch(() => {});
      const { showToast = true } = await getSettings(['showToast']);
      if (showToast && isTopFrame) {
        showBlockedToast(data.origin);
      }
    }
  });

  async function getSettings(keys) {
    try {
      return await browser.storage.sync.get(keys);
    } catch (_e) {
      return await browser.storage.local.get(keys);
    }
  }

  async function decide(origin) {
    const { enabled = true, allowlist = [] } = await getSettings(['enabled', 'allowlist']);
    if (!enabled) return 'allow';
    if (allowlist.includes(origin)) return 'allow';
    return 'block';
  }

  async function allowSite(origin) {
    const { allowlist = [] } = await getSettings(['allowlist']);
    if (!allowlist.includes(origin)) {
      allowlist.push(origin);
      try {
        await browser.storage.sync.set({ allowlist });
      } catch (_e) {
        await browser.storage.local.set({ allowlist });
      }
    }
    location.reload();
  }

  let toastHost;
  function showBlockedToast(origin) {
    if (toastHost) toastHost.remove();
    toastHost = document.createElement('div');
    toastHost.setAttribute('data-nopasskey-toast', '');
    toastHost.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; bottom: 16px; right: 16px;';
    const root = toastHost.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .toast { font: 13px/1.4 system-ui, sans-serif; color: #fff; background: #1f2933;
        border-left: 4px solid #b60205; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,.35);
        padding: 12px 14px; max-width: 320px; }
      .msg { margin: 0 0 8px; }
      .origin { font-weight: 600; }
      .actions { display: flex; gap: 8px; justify-content: flex-end; }
      button { font: inherit; cursor: pointer; border-radius: 4px; border: 0; padding: 5px 10px; }
      .allow { background: #2f80ed; color: #fff; }
      .dismiss { background: transparent; color: #9aa5b1; }
    `;

    const card = document.createElement('div');
    card.className = 'toast';
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');

    const msg = document.createElement('p');
    msg.className = 'msg';
    msg.append('Blocked a passkey registration on ');
    const originEl = document.createElement('span');
    originEl.className = 'origin';
    originEl.textContent = origin;
    msg.append(originEl, '.');

    const actions = document.createElement('div');
    actions.className = 'actions';
    const allowBtn = document.createElement('button');
    allowBtn.className = 'allow';
    allowBtn.textContent = 'Allow this site';
    allowBtn.addEventListener('click', () => allowSite(origin));
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'dismiss';
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.addEventListener('click', () => toastHost.remove());
    actions.append(allowBtn, dismissBtn);

    card.append(msg, actions);
    root.append(style, card);
    (document.body || document.documentElement).append(toastHost);
    setTimeout(() => { if (toastHost && toastHost.isConnected) toastHost.remove(); }, 8000);
  }
})();
