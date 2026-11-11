import { DEVICE_MODELS, DEFAULT_MODEL_ID, getModel, outerSize } from '../shared/devices';
import { HOST_SOURCE, isBridgeMessage, type RuntimeMessage } from '../shared/protocol';
import { isHttpUrl, normalizeUrl } from '../shared/url';
import { localizeDocument, t } from './i18n';
import { icon } from './icons';
import { SlotView } from './slot-view';
import {
  MAX_SLOTS,
  addSlot,
  applyUrlToAll,
  duplicateSlot,
  fitScale,
  moveSlot,
  pushHistory,
  removeSlot,
  sanitizeState,
  defaultState,
  updateSlot,
  type EmulatorState,
  type Zoom,
} from './state';

const STORAGE_KEY = 'emulatorState';
/** 端末の上下にある操作行・寸法表示・余白の高さの合計（倍率「画面に合わせる」の計算用） */
const SLOT_CHROME_HEIGHT = 236;

const $ = <T extends HTMLElement>(selector: string) => document.querySelector(selector) as T;

const bench = $('#bench');
const globalForm = $<HTMLFormElement>('#global-url-form');
const globalInput = $<HTMLInputElement>('#global-url');
const addButton = $<HTMLButtonElement>('#add-device');
const addMenu = $('#add-menu');
const zoomSelect = $<HTMLSelectElement>('#zoom');
const zoomReadout = $('#zoom-readout');
const syncToggle = $<HTMLInputElement>('#sync-scroll');
const reloadAllButton = $<HTMLButtonElement>('#reload-all');
const chromeRadios = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="chrome"]'));
const historyList = $('#url-history');
const toast = $('#toast');
const emptyBench = $('#empty-bench');

let state: EmulatorState = defaultState();
const views = new Map<string, SlotView>();

// ---- 保存 ----
let saveTimer = 0;
function save(): void {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    void chrome.storage.local.set({ [STORAGE_KEY]: state });
  }, 300);
}

function setState(next: EmulatorState, options: { render?: boolean } = {}): void {
  state = next;
  save();
  if (options.render !== false) render();
}

// ---- 通知 ----
let toastTimer = 0;
function showToast(message: string): void {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function invalidUrlMessage(reason: string): string {
  return reason === 'unsupported' ? t('errorUnsupportedUrl') : t('errorInvalidUrl');
}

// ---- 描画 ----
function currentScale(): number {
  if (state.zoom !== 'fit') return state.zoom;
  const tallest = Math.max(0, ...state.slots.map((s) => outerSize(getModel(s.modelId), s.orientation).height));
  const toolbar = document.querySelector('.toolbar')?.getBoundingClientRect().height ?? 72;
  const available = window.innerHeight - toolbar - SLOT_CHROME_HEIGHT;
  return fitScale(tallest, available);
}

function render(): void {
  const scale = currentScale();
  zoomReadout.textContent = `${Math.round(scale * 100)}%`;

  const alive = new Set(state.slots.map((s) => s.uid));
  for (const [uid, view] of views) {
    if (!alive.has(uid)) {
      view.el.remove();
      views.delete(uid);
    }
  }
  state.slots.forEach((slot, index) => {
    let view = views.get(slot.uid);
    if (!view) {
      view = new SlotView(slot, slotCallbacks);
      views.set(slot.uid, view);
      // 並べ替えは CSS の order で行う（iframe を DOM 上で動かすと読み込み直しになるため）
      bench.append(view.el);
    }
    view.update(slot, { scale, chrome: state.chrome, index, count: state.slots.length });
  });

  emptyBench.hidden = state.slots.length > 0;
  addButton.disabled = state.slots.length >= MAX_SLOTS;
  zoomSelect.value = state.zoom === 'fit' ? 'fit' : String(state.zoom);
  syncToggle.checked = state.syncScroll;
  chromeRadios.forEach((r) => (r.checked = r.value === state.chrome));
  renderHistory();
}

function renderHistory(): void {
  historyList.replaceChildren(
    ...state.history.map((url) => {
      const option = document.createElement('option');
      option.value = url;
      return option;
    }),
  );
}

const slotCallbacks = {
  onNavigate(uid: string, url: string) {
    if (state.slots.find((s) => s.uid === uid)?.url === url) {
      views.get(uid)?.reload(true);
      return;
    }
    const next = updateSlot(state, uid, { url });
    setState({ ...next, history: pushHistory(next.history, url) });
  },
  onInvalidUrl(reason: string) {
    showToast(invalidUrlMessage(reason));
  },
  onModelChange(uid: string, modelId: string) {
    setState(updateSlot(state, uid, { modelId }));
  },
  onRotate(uid: string) {
    const slot = state.slots.find((s) => s.uid === uid);
    if (!slot) return;
    setState(updateSlot(state, uid, { orientation: slot.orientation === 'portrait' ? 'landscape' : 'portrait' }));
  },
  onDuplicate(uid: string) {
    if (state.slots.length >= MAX_SLOTS) {
      showToast(t('errorMaxDevices', String(MAX_SLOTS)));
      return;
    }
    setState(duplicateSlot(state, uid));
  },
  onRemove(uid: string) {
    setState(removeSlot(state, uid));
  },
  onMove(uid: string, delta: -1 | 1) {
    setState(moveSlot(state, uid, delta));
  },
  onOpenInTab(url: string) {
    void chrome.tabs.create({ url });
  },
};

// ---- 全体の操作 ----
function openUrlEverywhere(url: string): void {
  globalInput.value = url;
  if (state.slots.length === 0) {
    setState({ ...defaultState(url), zoom: state.zoom, chrome: state.chrome, syncScroll: state.syncScroll, history: pushHistory(state.history, url) });
    return;
  }
  setState(applyUrlToAll(state, url));
}

globalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = normalizeUrl(globalInput.value);
  if (!result.ok) {
    if (result.reason !== 'empty') showToast(invalidUrlMessage(result.reason));
    globalInput.focus();
    return;
  }
  openUrlEverywhere(result.url);
});

function buildAddMenu(): void {
  const list = document.createElement('ul');
  list.className = 'add-menu-list';
  for (const model of DEVICE_MODELS) {
    const item = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'add-menu-item';
    const name = document.createElement('span');
    name.textContent = model.name;
    const size = document.createElement('span');
    size.className = 'add-menu-size';
    size.textContent = `${model.width} × ${model.height}`;
    b.append(name, size);
    b.addEventListener('click', () => {
      addMenu.hidePopover();
      const url = state.slots.at(-1)?.url ?? '';
      setState(addSlot(state, model.id, url));
      requestAnimationFrame(() => views.get(state.slots.at(-1)?.uid ?? '')?.el.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' }));
    });
    item.append(b);
    list.append(item);
  }
  addMenu.append(list);
}

zoomSelect.addEventListener('change', () => {
  const value = zoomSelect.value;
  const zoom: Zoom = value === 'fit' ? 'fit' : Number(value);
  setState({ ...state, zoom });
});

chromeRadios.forEach((radio) =>
  radio.addEventListener('change', () => {
    if (radio.checked) setState({ ...state, chrome: radio.value === 'standalone' ? 'standalone' : 'safari' });
  }),
);

syncToggle.addEventListener('change', () => {
  setState({ ...state, syncScroll: syncToggle.checked }, { render: false });
  broadcastConfig();
});

reloadAllButton.addEventListener('click', () => views.forEach((v) => v.reload()));

function broadcastConfig(): void {
  views.forEach((v) => v.post({ source: HOST_SOURCE, type: 'config', syncScroll: state.syncScroll }));
}

let resizeTimer = 0;
window.addEventListener('resize', () => {
  if (state.zoom !== 'fit') return;
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(render, 120);
});

// ---- iframe 内のブリッジからの知らせ ----
function viewForSource(source: MessageEventSource | null): SlotView | undefined {
  if (!source) return undefined;
  for (const view of views.values()) if (view.frameWindow === source) return view;
  return undefined;
}

window.addEventListener('message', (event) => {
  if (!isBridgeMessage(event.data)) return;
  const view = viewForSource(event.source);
  if (!view) return;
  const msg = event.data;
  if (msg.type === 'nav') {
    if (!isHttpUrl(msg.url)) return;
    view.onBridgeNav(msg.url, msg.fresh === true);
    view.post({ source: HOST_SOURCE, type: 'config', syncScroll: state.syncScroll });
    // iframe 内で移動した URL を記録する（iframe は読み込み直さない）
    setState(updateSlot(state, view.uid, { url: msg.url }), { render: false });
    return;
  }
  if (msg.type === 'scroll' && state.syncScroll) {
    views.forEach((other) => {
      if (other !== view) other.post({ source: HOST_SOURCE, type: 'scroll-to', x: msg.x, y: msg.y });
    });
  }
});

// ---- バックグラウンドからの指示（ツールバーのボタンや右クリックメニュー） ----
chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
  if (message?.type === 'emulator:open-url' && isHttpUrl(message.url)) openUrlEverywhere(message.url);
  return false;
});

// ---- 起動 ----
async function registerWithBackground(): Promise<void> {
  try {
    const response = (await chrome.runtime.sendMessage({ type: 'emulator:register' } satisfies RuntimeMessage)) as
      | { ok: boolean }
      | undefined;
    if (!response?.ok) showToast(t('errorRegister'));
  } catch {
    showToast(t('errorRegister'));
  }
}

async function init(): Promise<void> {
  localizeDocument();
  document.title = t('pageTitle');
  addButton.insertAdjacentHTML('afterbegin', icon('plus'));
  reloadAllButton.insertAdjacentHTML('afterbegin', icon('reload'));
  buildAddMenu();

  // 端末の通信を iPhone として扱うルールを先に登録してから iframe を読み込む
  const [stored] = await Promise.all([chrome.storage.local.get(STORAGE_KEY), registerWithBackground()]);
  const hasStored = stored[STORAGE_KEY] !== undefined;
  state = hasStored ? sanitizeState(stored[STORAGE_KEY]) : defaultState();

  const params = new URLSearchParams(location.search);
  const launchUrl = params.get('url');
  if (launchUrl && isHttpUrl(launchUrl)) {
    state = applyUrlToAll(state, launchUrl);
    globalInput.value = launchUrl;
    history.replaceState(null, '', location.pathname);
    save();
  } else if (!hasStored) {
    save();
  }
  if (!state.slots.length) state = addSlot(state, DEFAULT_MODEL_ID, '');
  render();
}

void init();
