/*
 * NoPasskey core interceptor.
 *
 * Pure, environment-agnostic logic that wraps a CredentialsContainer's create()
 * method. It is deliberately free of any WebExtension or browser-only globals so
 * it can be unit-tested in Node and reused unchanged inside the MAIN-world content
 * script (see inject-main.js).
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

  // A create() call is a passkey registration iff it carries a publicKey option.
  function isPasskeyCreate(options) {
    return !!(options && typeof options === 'object' && options.publicKey);
  }

  // Reject the same way a user-cancelled passkey dialog does, so relying parties
  // fall back to their password/2FA flow.
  function blockedError() {
    return new DOMException(
      'Passkey registration blocked by NoPasskey',
      'NotAllowedError'
    );
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

  /*
   * Wrap credentials.create(). For passkey registrations, ask requestDecision()
   * (which resolves to 'allow' or 'block') and either block or delegate to the
   * native create(). Anything else - including credentials.get() logins - is left
   * completely untouched. Returns an uninstall function.
   */
  function installCreateInterceptor({ credentials, requestDecision, timeoutMs = 2000 }) {
    const originalCreate = credentials.create.bind(credentials);

    async function create(options) {
      if (!isPasskeyCreate(options)) {
        return originalCreate(options);
      }

      let decision;
      try {
        decision = await withTimeout(requestDecision(), timeoutMs);
      } catch (_err) {
        // Fail open: a hung/broken bridge must never break a real login.
        return originalCreate(options);
      }

      if (decision === 'block') {
        throw blockedError();
      }
      return originalCreate(options);
    }

    // Masquerade as the native method (name/length) to avoid trivial detection.
    Object.defineProperty(create, 'name', { value: 'create', configurable: true });
    Object.defineProperty(create, 'length', { value: originalCreate.length, configurable: true });

    credentials.create = create;
    return function uninstall() {
      credentials.create = originalCreate;
    };
  }

  return { isPasskeyCreate, installCreateInterceptor };
});
