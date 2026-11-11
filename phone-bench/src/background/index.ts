import { buildRulesForTab, nextRuleId, ruleIdsForTab } from './rules';
import { EMULATOR_PAGE, type RuntimeMessage } from '../shared/protocol';
import { isHttpUrl } from '../shared/url';

const EMULATOR_URL = chrome.runtime.getURL(EMULATOR_PAGE);
const MENU_PAGE = 'open-page';
const MENU_LINK = 'open-link';

// セッションルールの読み書きを直列にして、ID の重複を防ぐ。
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

function registerTab(tabId: number): Promise<void> {
  return serialized(async () => {
    const rules = await chrome.declarativeNetRequest.getSessionRules();
    const removeRuleIds = ruleIdsForTab(rules, tabId);
    const remaining = rules.filter((r) => !removeRuleIds.includes(r.id));
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds,
      addRules: buildRulesForTab(tabId, nextRuleId(remaining)),
    });
  });
}

function unregisterTab(tabId: number): Promise<void> {
  return serialized(async () => {
    const rules = await chrome.declarativeNetRequest.getSessionRules();
    const removeRuleIds = ruleIdsForTab(rules, tabId);
    if (removeRuleIds.length) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds });
  });
}

async function findEmulatorTab(): Promise<chrome.tabs.Tab | undefined> {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['TAB' as chrome.runtime.ContextType] });
  const context = contexts.find((c) => c.documentUrl?.startsWith(EMULATOR_URL) && c.tabId >= 0);
  if (!context) return undefined;
  try {
    return await chrome.tabs.get(context.tabId);
  } catch {
    return undefined;
  }
}

/** エミュレーター画面を開く。開いていればそのタブへ切り替え、URL を全端末で開く。 */
async function openEmulator(url: string | undefined, from?: chrome.tabs.Tab): Promise<void> {
  const target = isHttpUrl(url) ? url : undefined;
  const existing = await findEmulatorTab();
  if (existing?.id !== undefined) {
    await chrome.tabs.update(existing.id, { active: true });
    if (existing.windowId !== undefined) await chrome.windows.update(existing.windowId, { focused: true });
    if (target) {
      const message: RuntimeMessage = { type: 'emulator:open-url', url: target };
      await chrome.tabs.sendMessage(existing.id, message).catch(() => chrome.runtime.sendMessage(message).catch(() => undefined));
    }
    return;
  }
  const pageUrl = target ? `${EMULATOR_URL}?url=${encodeURIComponent(target)}` : EMULATOR_URL;
  await chrome.tabs.create({
    url: pageUrl,
    index: from?.index !== undefined ? from.index + 1 : undefined,
    windowId: from?.windowId,
  });
}

chrome.action.onClicked.addListener((tab) => {
  void openEmulator(tab.url, tab);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_PAGE,
      title: chrome.i18n.getMessage('menuOpenPage'),
      contexts: ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });
    chrome.contextMenus.create({
      id: MENU_LINK,
      title: chrome.i18n.getMessage('menuOpenLink'),
      contexts: ['link'],
      targetUrlPatterns: ['http://*/*', 'https://*/*'],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = info.menuItemId === MENU_LINK ? info.linkUrl : info.pageUrl;
  void openEmulator(url, tab);
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  if (message?.type !== 'emulator:register') return false;
  const tabId = sender.tab?.id;
  if (tabId === undefined || !sender.url?.startsWith(EMULATOR_URL)) {
    sendResponse({ ok: false });
    return false;
  }
  registerTab(tabId).then(
    () => sendResponse({ ok: true }),
    (error: unknown) => sendResponse({ ok: false, error: String(error) }),
  );
  return true;
});

// エミュレーター画面を閉じた・別のページへ移ったら、そのタブのルールを外す。
chrome.tabs.onRemoved.addListener((tabId) => {
  void unregisterTab(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && !changeInfo.url.startsWith(EMULATOR_URL)) void unregisterTab(tabId);
});
