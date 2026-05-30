/*
 * NoPasskey MAIN-world shim.
 *
 * Runs in the page's own execution world (content_scripts "world": "MAIN",
 * document_start) so it can replace navigator.credentials.create before any page
 * script touches it. It owns no policy of its own: every passkey registration is
 * referred to the isolated bridge content script (which can read storage) over
 * window.postMessage, and the answer drives interceptor.js.
 */
(function () {
  'use strict';

  const interceptor = globalThis.__noPasskeyInterceptor;
  if (!interceptor || !navigator.credentials || typeof navigator.credentials.create !== 'function') {
    return;
  }

  const PAGE = 'nopasskey-page';
  const BRIDGE = 'nopasskey-bridge';
  const pending = new Map();
  let nextId = 0;

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== BRIDGE || data.type !== 'decision-response') return;
    const resolve = pending.get(data.id);
    if (resolve) {
      pending.delete(data.id);
      resolve(data.decision);
    }
  });

  function requestDecision() {
    return new Promise((resolve) => {
      const id = ++nextId;
      pending.set(id, resolve);
      window.postMessage(
        { source: PAGE, type: 'decision-request', id, origin: location.origin },
        '*'
      );
    });
  }

  interceptor.installCreateInterceptor({
    credentials: navigator.credentials,
    requestDecision,
    timeoutMs: 2000,
  });
})();
