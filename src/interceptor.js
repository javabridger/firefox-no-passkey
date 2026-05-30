/*
 * NoPasskey core interceptor.
 *
 * Pure, environment-agnostic logic that wraps a CredentialsContainer's create()
 * and get() methods. It is deliberately free of any WebExtension or browser-only
 * globals so it can be unit-tested in Node and reused unchanged inside the
 * MAIN-world content script (see inject-main.js).
 *
 * Loaded two ways:
 *   - Node (tests):      const interceptor = require('./interceptor.js')
 *   - Browser (MAIN):    listed before inject-main.js in the same content_scripts
 *                        entry; attaches to globalThis.__noPasskeyInterceptor
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.__noPasskeyInterceptor = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Both create() (registration) and get() (login) are passkey requests iff they
  // carry a publicKey option.
  function isPasskeyRequest(options) {
    return !!(options && typeof options === 'object' && options.publicKey);
  }

  // Reject the same way a user-cancelled passkey dialog does, so relying parties
  // fall back to their password/2FA flow.
  function blockedError(operation) {
    const what = operation === 'get' ? 'login' : 'registration';
    return new DOMException(`Passkey ${what} blocked by NoPasskey`, 'NotAllowedError');
  }

  function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('NoPasskey: bridge timeout')), ms);
      Promise.resolve(promise).then(
        (value) => { clearTimeout(timer); resolve(value); },
        (err) => { clearTimeout(timer); reject(err); }
      );
    });
  }

  // Wrap a single CredentialsContainer method. Passkey requests are referred to
  // requestDecision(operation) -> 'allow' | 'block'; everything else (and any
  // bridge failure) delegates straight to the native method. Returns an uninstaller.
  function wrapMethod(credentials, method, operation, requestDecision, timeoutMs) {
    const original = credentials[method].bind(credentials);

    async function wrapped(options) {
      if (!isPasskeyRequest(options)) {
        return original(options);
      }
      let decision;
      try {
        decision = await withTimeout(requestDecision(operation), timeoutMs);
      } catch (_err) {
        // Fail open: a hung/broken bridge must never lock the user out.
        return original(options);
      }
      if (decision === 'block') {
        throw blockedError(operation);
      }
      return original(options);
    }

    // Masquerade as the native method (name/length) to avoid trivial detection.
    Object.defineProperty(wrapped, 'name', { value: method, configurable: true });
    Object.defineProperty(wrapped, 'length', { value: original.length, configurable: true });

    credentials[method] = wrapped;
    return function uninstall() {
      credentials[method] = original;
    };
  }

  /*
   * Wrap both create() and get(). requestDecision is called with the operation
   * ('create' | 'get') so the caller can apply per-operation policy. Returns an
   * uninstall function that restores both native methods.
   */
  function installInterceptor({ credentials, requestDecision, timeoutMs = 2000 }) {
    const uninstallers = [
      wrapMethod(credentials, 'create', 'create', requestDecision, timeoutMs),
      wrapMethod(credentials, 'get', 'get', requestDecision, timeoutMs),
    ];
    return function uninstall() {
      uninstallers.forEach((fn) => fn());
    };
  }

  return { isPasskeyRequest, installInterceptor };
});
