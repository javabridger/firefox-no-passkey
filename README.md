# NoPasskey

A Firefox (Manifest V3) extension that **blocks new passkey registration by default** while leaving
ordinary logins alone. When a site calls `navigator.credentials.create({ publicKey })` to enrol a
passkey, NoPasskey rejects it as if you'd cancelled the dialog (`NotAllowedError`), so the site falls
back to password + 2FA. A non-blocking toast tells you it happened and offers **Allow this site**.
Logging in with passkeys you already have (`navigator.credentials.get`) is **never** touched.

## How it works

- A content script in the page's **MAIN world** (natively supported since **Firefox 128**) runs at
  `document_start` and wraps `navigator.credentials.create` before any page script can use it
  ([src/interceptor.js](src/interceptor.js), [src/inject-main.js](src/inject-main.js)).
- MAIN-world scripts can't use extension APIs, so an isolated **bridge** content script
  ([src/bridge.js](src/bridge.js)) answers each block/allow decision from storage, draws the toast,
  and asks the background page to update the toolbar badge.
- Because `create()` returns a Promise, the wrapper simply `await`s the bridge — no load-time race —
  and **fails open** if the bridge ever goes quiet, so a broken extension can never brick a login.

## Install for development

```bash
npm install
npm start          # web-ext run: launches Firefox with the extension loaded
```

Or load it manually: open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** →
pick [src/manifest.json](src/manifest.json).

## Using it

- **Toolbar popup** — shows the current site, an *Allow passkeys on this site* toggle, a global
  *Block passkey registration* switch, and a count badge of blocks on the page.
- **Toast** — appears bottom-right when a registration is blocked; click **Allow this site** to
  add the origin to the allowlist and reload.
- **Options page** — manage the allowlist (add/remove origins), toggle blocking globally, and toggle
  the toast.

Settings are stored in `storage.sync` (so the allowlist roams across your signed-in Firefox), with a
`storage.local` fallback.

## Recommended settings & hardening

- **Keep the defaults:** block everywhere, allowlist the handful of sites where you genuinely want a
  passkey. This is the whole point of the extension.
- **Pair it with real 2FA:** a password manager plus TOTP or a hardware security key gives you the
  phishing resistance people cite for passkeys, without the lock-in you dislike.
- **Nuclear option (no extension):** in `about:config`, the `security.webauth.webauthn*` prefs can
  disable WebAuthn entirely — blunt, but total.
- **Coverage:** the content scripts use `all_frames` + `match_origin_as_fallback`, so passkey calls
  made inside iframes and sandboxed/`srcdoc` frames are caught too.
- **Privacy:** zero telemetry, zero network requests; the only permissions are `storage` and
  `activeTab`, and the manifest declares `data_collection_permissions: ["none"]`.

### Possible future enhancements
- An advanced **also block logins** (`get()`) toggle — `interceptor.js` is structured to extend.
- Per-site *block once / always* memory, a block history view, allowlist import/export, localization.

## Testing — BDD (red → green → refactor)

Behaviour is specified first in Gherkin, then implemented minimally, then refactored under green.

```bash
npm test           # unit features  — interceptor logic in Node (fast, no browser)
npm run test:e2e   # E2E features    — real headless Firefox via web-ext + Selenium/geckodriver
```

- Unit specs: [test/unit/features/interceptor.feature](test/unit/features/interceptor.feature)
- E2E specs: [test/e2e/features/block.feature](test/e2e/features/block.feature)

**E2E notes:** the harness packages the add-on, serves a fixture over `http://localhost` (a WebAuthn
secure context), launches headless Firefox, and installs the add-on temporarily. It sets
`security.webauth.webauthn_enable_softtoken=true` / `..._enable_usbtoken=false` so any *passthrough*
`create()`/`get()` resolves against Firefox's internal software token and **never triggers the real
OS (Windows Hello / platform) passkey dialog**. `selenium-webdriver` auto-provisions geckodriver via
Selenium Manager; set `FIREFOX_BIN` if Firefox isn't at the default Windows path.

## Build, lint & publish to AMO

```bash
npm run lint       # web-ext lint — AMO validation (currently 0 errors / 0 warnings)
npm run build      # web-ext build — produces web-ext-artifacts/<name>-<version>.zip
npm run sign       # web-ext sign — submit to addons.mozilla.org for signing (needs API creds)
```

For AMO: set `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET` (from your AMO Developer Hub account) before
`npm run sign`, or upload the built zip via the AMO web UI. The add-on id and
`strict_min_version: 128.0` are already declared in [src/manifest.json](src/manifest.json).
