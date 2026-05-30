# Handoff: NoPasskey UI Redesign (Popup + Settings)

## Overview
NoPasskey is a Firefox (WebExtension) that blocks WebAuthn/passkey operations. This handoff covers a visual + structural redesign of its two surfaces:

1. **Browser-action popup** — the panel that opens from the toolbar button. Shows current-site status and the main on/off controls.
2. **Options/settings page** — the full extension settings page (`options_ui` / a standalone `options.html`).

The redesign adds a **third control ("Block login")** to the existing "Allow on this site" and "Block registration" controls, replaces checkboxes with switches, adds a subtle per-site status, and adapts to light **and** dark browser themes.

## About the Design Files
The files in this bundle are **design references created in HTML/React (via in-browser Babel)** — prototypes showing the intended look and behavior. They are **not** production code to ship as-is. The included `NoPasskey.html` uses a pan/zoom "design canvas" wrapper purely for presentation; ignore that wrapper.

Your task is to **recreate these screens inside the actual extension codebase**, using its established conventions:
- This is a Firefox WebExtension. The popup and options page are plain HTML documents loaded by the browser (`browser_action`/`action.default_popup` and `options_ui.page` in `manifest.json`).
- If the existing extension uses vanilla JS + HTML/CSS, implement these with vanilla JS + CSS (no framework needed — the markup is simple). If it already uses a framework (React/Preact/Svelte), match that.
- Wire the controls to the extension's existing storage and message-passing logic (`browser.storage.local` / `runtime.sendMessage`). The prototype's toggles are visual only.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, and states are specified below and should be reproduced closely. Type uses the OS system UI stack (matches native Firefox chrome), so exact rendering will vary slightly by platform — that's expected and correct.

---

## Design Tokens

Defined as CSS custom properties, themed by a `.theme-light` / `.theme-dark` wrapper class. In the real extension, derive the theme from `@media (prefers-color-scheme: dark)` (and/or the `theme.getCurrent()` WebExtension API) rather than a fixed class.

### Light theme
| Token | Value | Use |
|---|---|---|
| `--bg` | `#ffffff` | Popup base (flat surfaces) |
| `--page` | `#f6f6f9` | Sunken page behind cards (popup + settings bg) |
| `--surface` | `#ffffff` | Card background |
| `--text` | `#15141a` | Primary text |
| `--dim` | `#5b5b6b` | Secondary text |
| `--faint` | `#8a8a99` | Tertiary / sub-labels / placeholders |
| `--line` | `#e7e7ed` | Hairline dividers / borders |
| `--line-strong` | `#d3d3dc` | Switch off-track, button border |
| `--field` | `#ffffff` | Input background |
| `--field-line` | `#cdcdd6` | Input border |
| `--accent` | `#7c3aed` | Active switch, primary button, links, icon tile |
| `--accent-press` | `#6d28d9` | Primary button hover |
| `--accent-weak` | `rgba(124,58,237,.10)` | Status pill bg, icon tile bg, focus ring |
| `--on-accent` | `#ffffff` | Foreground on accent fills |
| `--hover` | `rgba(0,0,0,.045)` | Row hover |

### Dark theme
| Token | Value |
|---|---|
| `--bg` | `#2b2a33` (Firefox dark popup color) |
| `--page` | `#1c1b22` |
| `--surface` | `#34333d` |
| `--text` | `#fbfbfe` |
| `--dim` | `#c4c4d0` |
| `--faint` | `#8e8e9d` |
| `--line` | `rgba(255,255,255,.09)` |
| `--line-strong` | `rgba(255,255,255,.17)` |
| `--field` | `#1c1b22` |
| `--field-line` | `rgba(255,255,255,.17)` |
| `--accent` | `#b69bff` |
| `--accent-press` | `#a585ff` |
| `--accent-weak` | `rgba(182,155,255,.16)` |
| `--on-accent` | `#1c1b22` |
| `--hover` | `rgba(255,255,255,.06)` |

### Type
- **Family (UI):** `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Family (mono, for origins/URLs):** `ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace`
- **Scale used:**
  - Settings H1: 20px / weight 680 / letter-spacing −0.015em
  - Popup title & section H2: 14–15px / weight 660
  - Row label: 13px (popup) → 14px (settings `--lg`) / weight 550
  - Row sub-label: 11.5px / `--faint`
  - Helper note / status: 12.5px
  - Section eyebrow (uppercase, settings): 11px / weight 700 / letter-spacing .07em
- Antialiasing: `-webkit-font-smoothing: antialiased`.

### Radii / shadow / spacing
- Card radius: **11px** (popup), inner button/field **7px**, status pill **9px**, icon tiles **8–13px**.
- Switch: track **34×20px**, knob **16px**, knob offset 2px, checked translateX **14px**, transition `.16s ease`.
- Field / button height: **34px**.
- Popup outer padding: **13px**. Settings page padding: **28px 30px**.
- Row vertical padding: 12px (popup), 15px (settings).
- Card dividers: 1px `--line`, inset 13px from card edges in the popup; full-width inside padded settings cards.
- No drop shadows on the UI itself (flat, native). The status dot uses a 3px soft ring: `box-shadow:0 0 0 3px color-mix(in srgb,#27ae73 22%, transparent)`.

---

## Screens / Views

### 1. Popup (`popup.html`)
**Purpose:** Quick status + the three primary toggles for the current tab and globally.

**Layout:** Vertical flex, `gap:11px`, padding 13px, background `--page`. Recommended width **~320–340px** (Firefox sizes the popup to content; design width 336px).

Top to bottom:
1. **Header row** — flex, `gap:9px`.
   - Icon tile: 26×26px, radius 8px, background `--accent`, icon in `--on-accent`. Icon = **shield + keyhole** mark (see Assets), 16px.
   - Title "**NoPasskey**", 14px / weight 660 / letter-spacing −0.01em.
2. **Status pill** — flex, `gap:8px`, padding `8px 11px`, background `--accent-weak`, radius 9px, text 12.5px `--text`.
   - Green dot (7px, `#27ae73` + soft ring) = active/protected.
   - Text: `Protected on <b>github.com</b>` — substitute the **current tab's eTLD+1**. Empty-tab state below.
3. **Card** (`--surface`, 1px `--line` border, radius 11px, `overflow:hidden`) containing 3 rows separated by inset dividers:
   - **Allow passkeys on this site** — sub: "Override blocking for `<site>`". Default **off**. (Per-origin allowlist entry for the active tab.)
   - **Block registration** — sub: "Creating new passkeys · all sites". Default **on**. (Global block of `navigator.credentials.create`.)
   - **Block login** — sub: "Signing in with passkeys · all sites". Default **on per prototype** — see "Open question" below. (Global block of `navigator.credentials.get`.)
   - Each row: flex, space-between, padding `12px 13px`, label column (`gap:3px`) + switch. Whole row hover bg `--hover`; the entire row is the `<label>` for its switch.
4. **Footer link** — "Manage allowlist & settings →", centered, 12.5px, color `--accent`, weight 550, padding 9px, hover bg `--accent-weak`, radius 8px. Opens the options page (`runtime.openOptionsPage()`).

**Empty-tab state:** When there is no web page (about:blank, about:pages, internal tabs), the per-site row can't apply. Replace the status pill text with a muted "No web page in this tab" (use `--dim`, neutral/grey dot instead of green) and disable the "Allow passkeys on this site" row (reduced opacity, switch non-interactive). The two global toggles remain active.

### 2. Settings / Options page (`options.html`)
**Purpose:** Global defaults + the allowlist manager.

**Layout:** Vertical flex, padding `28px 30px`, background `--page`. The prototype frames it at 600px wide; in a real options page let it sit in a centered column ~560–640px max-width.

Top to bottom:
1. **Header** — flex, `gap:14px`, margin-bottom 20px.
   - Icon tile: 46×46px, radius 13px, background `--accent`, **shield+keyhole** icon (24px) in `--on-accent`.
   - H1 "**NoPasskey settings**" + sub "Block sites from registering or signing in with passkeys." (sub: 13px `--dim`).
2. **Protection card** (`--surface`, radius 11px, padding `2px 15px`) — 3 `--lg` rows, full-width 1px dividers:
   - **Block passkey registration by default** — sub: "Recommended · stops new passkeys being created". On.
   - **Block passkey login by default** — sub: "Stops existing passkeys from signing you in". On per prototype (see Open question).
   - **Show a toast when something is blocked** — (no sub). On.
3. **Helper note** (12.5px `--faint`, max-width ~54ch, margin-top 12px):
   > "Registration blocking stops new passkeys from being created. Login blocking also prevents passkeys you already have from signing you in — turn it off if you still log in with passkeys."
4. **Allowlist section header** — flex baseline, `gap:10px`, margin-top 26px:
   - H2 "**Allowlist**" (15px / weight 660).
   - Count pill: "2 origins" — 11.5px `--faint`, bg `--hover`, padding `2px 9px`, radius 999px (reflect real count).
5. **Sub** (13px `--dim`): "Passkeys are fully permitted on these origins."
6. **Allowlist card** (`--surface`, radius 11px, padding `2px 15px`):
   - **Add row** — flex `gap:8px`, padding `11px 0 13px`: text `<input>` (placeholder `https://example.com`) + primary **Add** button.
   - **Origins list** — `<ul>`, each `<li>` (`origin-row`): flex, `gap:10px`, padding `11px 0`, top border 1px `--line`. Monospace origin string (flex-grow) + a "✕" remove button (`--faint`, hover → `--text` on `--hover` bg, radius 6px).
   - **Empty state:** when the list is empty, show "No sites allowlisted yet." in `--faint` instead of the `<ul>`.

---

## Components

### Switch (replaces the old checkboxes)
- Build from a visually-hidden `<input type="checkbox">` + a `.track` + `.knob` span inside a `<label>` (whole settings row acts as the label so clicking text toggles).
- Track 34×20px, radius 999px. Off: `--line-strong`. On (`:checked`): `--accent`.
- Knob 16px white circle, `box-shadow:0 1px 2px rgba(0,0,0,.35)`, `top:2px; left:2px`, on → `translateX(14px)`.
- Focus-visible ring on the track: `outline:2px solid var(--accent); outline-offset:2px`.
- Transition 0.16s ease on background + transform.

### Field (text input)
- Height 34px, padding `0 11px`, radius 7px, 1px `--field-line` border, bg `--field`, 13px text, placeholder `--faint`.
- Focus: border `--accent` + `box-shadow:0 0 0 3px var(--accent-weak)`.

### Button (primary "Add")
- Height 34px, padding `0 15px`, radius 7px, 13px / weight 600.
- Primary: bg `--accent`, text `--on-accent`, no border; hover bg `--accent-press`.

### Status dot
- 7px circle. Active: `#27ae73` with 3px translucent ring. Inactive/empty-tab: `--faint`, no ring.

---

## Interactions & Behavior
- **Toggles** persist to `browser.storage.local` and take effect immediately:
  - *Allow passkeys on this site* → add/remove the active tab's origin in the allowlist; reflects the same data the options page edits.
  - *Block registration* (global) → gates `navigator.credentials.create` interception.
  - *Block login* (global) → gates `navigator.credentials.get` interception.
- **Allowlist Add:** validate input as an origin (`new URL(value).origin`); trim, dedupe, reject non-http(s). On success prepend to the list and clear the field. Enter key in the field = Add.
- **Allowlist Remove:** removes that origin immediately; if it was the last entry show the empty state.
- **Footer link / no options button:** `browser.runtime.openOptionsPage()`.
- **Toast setting:** controls whether the content/background script surfaces a notification when an operation is blocked.
- **Theme:** follow `prefers-color-scheme`; no manual theme switch in-UI.
- **Hover** states only on pointer devices; all interactive targets ≥ the row height (≥40px) for the popup. Keyboard: switches and buttons are natively focusable; ensure visible focus rings (spec'd above).

## State Management
Persisted in `browser.storage.local` (suggested shape — adapt to existing schema):
```
{
  blockRegistration: boolean,   // default true
  blockLogin: boolean,          // default — SEE OPEN QUESTION
  showToast: boolean,           // default true
  allowlist: string[]           // array of origins, e.g. "https://accounts.work-sso.com"
}
```
- Popup derives the per-site "Allow" switch from whether the active tab's origin is in `allowlist`.
- Both popup and options read/write the same keys; use `storage.onChanged` to keep an open popup and options page in sync.

## Open question (please confirm with design/product before shipping)
The prototype shows **Block login default = ON** to match the requested screenshot. Defaulting login-blocking on prevents signing in with existing passkeys everywhere, which is aggressive. Consider defaulting `blockLogin: false` (opt-in) while keeping `blockRegistration: true`. Confirm intended default.

## Assets
- **Icon — "shield + keyhole":** a simple geometric, single-color (currentColor) SVG, 24×24 viewBox, stroke-based (stroke-width ~1.8, round caps/joins). Path reference is in `np-icons.jsx` under `case 'shield-key'`. Toolbar icons must be **monochrome** and inherit theme color; export PNGs at **16, 32, 48, 96px** (and a 128px for AMO listing) for the `manifest.json` `icons` and `action.default_icon` sets. The accent purple is only used for in-UI fills (icon tiles), not the toolbar glyph itself.
- No raster images, no web fonts (system stack only).

## Files in this bundle
- `NoPasskey.html` — presentation host (design-canvas wrapper). Open in a browser to see all four frames (popup + settings, light + dark).
- `np-screens.jsx` — the screen markup. **`PopupB` and `SettingsB` are the approved designs.** (`PopupA`/`SettingsA` are an unused earlier direction — ignore.)
- `np-icons.jsx` — the `NPIcon` set; use `shield-key`. Other marks were exploration; ignore.
- `np-icongallery.jsx` — icon exploration board (reference only).
- `design-canvas.jsx` — presentation wrapper only; **not** part of the product.
- `styles-reference.css` — all component CSS extracted from `NoPasskey.html` for easy reference.

Implement from this README + `np-screens.jsx` (PopupB/SettingsB) + `styles-reference.css`. The canvas/host files are scaffolding only.
