/*
 * NoPasskey background event page.
 *
 * Seeds default settings on install and maintains the per-tab toolbar badge that
 * counts how many passkey registrations were blocked on the current page.
 */
'use strict';

const DEFAULTS = { blockCreate: true, blockGet: true, allowlist: [], showToast: true };
const blockedCounts = new Map();

async function storage() {
  // storage.sync roams the allowlist across the user's Firefox; fall back to local.
  try {
    await browser.storage.sync.get('enabled');
    return browser.storage.sync;
  } catch (_e) {
    return browser.storage.local;
  }
}

browser.runtime.onInstalled.addListener(async () => {
  const area = await storage();
  const current = await area.get(Object.keys(DEFAULTS));
  await area.set({ ...DEFAULTS, ...current });
});

browser.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== 'blocked' || !sender.tab) return;
  const tabId = sender.tab.id;
  const next = (blockedCounts.get(tabId) || 0) + 1;
  blockedCounts.set(tabId, next);
  browser.action.setBadgeText({ tabId, text: String(next) });
  browser.action.setBadgeBackgroundColor({ tabId, color: '#b60205' });
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    blockedCounts.delete(tabId);
    browser.action.setBadgeText({ tabId, text: '' });
  }
});

browser.tabs.onRemoved.addListener((tabId) => blockedCounts.delete(tabId));
