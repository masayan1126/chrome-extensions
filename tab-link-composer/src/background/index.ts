import { OFFSCREEN_DOCUMENT_PATH } from '@/constants';
import type { CopyRequest, TabInfo, TabGroupScope } from '@/types';
import { buildLine, composeText } from '@/utils/format';
import { maybeDecodeUrl } from '@/utils/url';

const OFFSCREEN_REASON = 'CLIPBOARD';

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
  void ensureOffscreen();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
  void ensureOffscreen();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'copy-current-window') {
    await copyTabs({
      scope: { kind: 'currentWindow' },
      format: { kind: 'markdown' },
      decodeUrl: true,
      decodePunycode: false,
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'COPY_REQUEST') {
    const req = message.payload as CopyRequest;
    void copyTabs(req)
      .then((res) => sendResponse({ ok: res.count > 0, ...res }))
      .catch(() => sendResponse({ ok: false, count: 0, text: '' }));
    return true;
  }
});

if (chrome.contextMenus?.onClicked?.addListener) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'copy-current-window') {
      await copyTabs({ scope: { kind: 'currentWindow' }, format: { kind: 'markdown' }, decodeUrl: true, decodePunycode: false });
      return;
    }
    if (info.menuItemId === 'copy-all-windows') {
      await copyTabs({ scope: { kind: 'all' }, format: { kind: 'markdown' }, decodeUrl: true, decodePunycode: false });
      return;
    }
    if (info.menuItemId === 'copy-current-group' && tab?.groupId && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      await copyTabs({ scope: { kind: 'group', groupId: tab.groupId }, format: { kind: 'markdown' }, decodeUrl: true, decodePunycode: false });
      return;
    }
  });
}

async function createContextMenus(): Promise<void> {
  if (!chrome.contextMenus?.create) return;
  try {
    await chrome.contextMenus.removeAll();
    await chrome.contextMenus.create({ id: 'copy-current-window', title: chrome.i18n.getMessage('contextMenuCopyCurrentWindow'), contexts: ['action'] });
    await chrome.contextMenus.create({ id: 'copy-all-windows', title: chrome.i18n.getMessage('contextMenuCopyAllWindows'), contexts: ['action'] });
    await chrome.contextMenus.create({ id: 'copy-current-group', title: chrome.i18n.getMessage('contextMenuCopyCurrentGroup'), contexts: ['action'] });
  } catch (e) {
    console.warn('contextMenusの作成に失敗', e);
  }
}

async function copyTabs(request: CopyRequest): Promise<{ text: string; count: number }> {
  const tabs = await queryTabs(request.scope);
  const tabInfos: TabInfo[] = tabs
    .filter((t) => !!t.url)
    .map((t) => ({ id: t.id ?? -1, title: t.title ?? '', url: t.url ?? '', groupId: t.groupId }))
    .map((t) => ({ ...t, url: maybeDecodeUrl(t.url, request.decodeUrl, request.decodePunycode) }));

  const lines = tabInfos.map((t) => buildLine(t, request.format));
  const text = composeText(lines, request.format);
  return { text, count: tabInfos.length };
}

async function queryTabs(scope: TabGroupScope): Promise<chrome.tabs.Tab[]> {
  if (scope.kind === 'all') {
    return chrome.tabs.query({});
  }
  if (scope.kind === 'currentWindow') {
    return chrome.tabs.query({ currentWindow: true });
  }
  if (scope.kind === 'selectedTabs') {
    const all = await chrome.tabs.query({});
    const wanted = new Set(scope.tabIds);
    return all.filter((t) => t.id != null && wanted.has(t.id));
  }
  // group
  const all = await chrome.tabs.query({});
  return all.filter((t) => t.groupId === scope.groupId);
}

async function ensureOffscreen(): Promise<void> {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
  try {
    const has = await chrome.offscreen.hasDocument?.();
    if (has) return;
    await chrome.offscreen.createDocument?.({
      url: offscreenUrl,
      reasons: [OFFSCREEN_REASON as chrome.offscreen.Reason],
      justification: 'Clipboard write from background service worker',
    });
  } catch (err) {
    console.error('offscreen作成に失敗', err);
  }
}


