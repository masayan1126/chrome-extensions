import { DEFAULT_LAYOUT, findModel, type BrowserChrome, type Orientation } from '../shared/devices';
import { isHttpUrl } from '../shared/url';

export interface DeviceSlot {
  uid: string;
  modelId: string;
  /** 最後に表示していた URL（空なら未入力） */
  url: string;
  orientation: Orientation;
}

export type Zoom = 'fit' | number;

export interface EmulatorState {
  version: 1;
  slots: DeviceSlot[];
  zoom: Zoom;
  chrome: BrowserChrome;
  syncScroll: boolean;
  history: string[];
}

export const MAX_SLOTS = 12;
export const MAX_HISTORY = 20;
export const ZOOM_STEPS = [0.5, 0.75, 1] as const;

let counter = 0;
export function newUid(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function defaultState(url = ''): EmulatorState {
  return {
    version: 1,
    slots: DEFAULT_LAYOUT.map((modelId) => ({ uid: newUid(), modelId, url, orientation: 'portrait' })),
    zoom: 'fit',
    chrome: 'safari',
    syncScroll: false,
    history: url ? [url] : [],
  };
}

/** 保存データを検証して読み込む。壊れていれば初期状態に戻す。 */
export function sanitizeState(raw: unknown): EmulatorState {
  if (typeof raw !== 'object' || raw === null) return defaultState();
  const r = raw as Partial<Record<keyof EmulatorState, unknown>>;
  const slots = Array.isArray(r.slots)
    ? r.slots
        .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
        .filter((s) => typeof s.modelId === 'string' && findModel(s.modelId) !== undefined)
        .slice(0, MAX_SLOTS)
        .map(
          (s): DeviceSlot => ({
            uid: typeof s.uid === 'string' && s.uid ? s.uid : newUid(),
            modelId: s.modelId as string,
            url: typeof s.url === 'string' && isHttpUrl(s.url) ? s.url : '',
            orientation: s.orientation === 'landscape' ? 'landscape' : 'portrait',
          }),
        )
    : [];
  const zoom: Zoom =
    typeof r.zoom === 'number' && (ZOOM_STEPS as readonly number[]).includes(r.zoom) ? r.zoom : 'fit';
  return {
    version: 1,
    slots: slots.length ? dedupeUids(slots) : defaultState().slots,
    zoom,
    chrome: r.chrome === 'standalone' ? 'standalone' : 'safari',
    syncScroll: r.syncScroll === true,
    history: Array.isArray(r.history)
      ? r.history.filter((h): h is string => typeof h === 'string' && isHttpUrl(h)).slice(0, MAX_HISTORY)
      : [],
  };
}

function dedupeUids(slots: DeviceSlot[]): DeviceSlot[] {
  const seen = new Set<string>();
  return slots.map((s) => {
    if (!seen.has(s.uid)) {
      seen.add(s.uid);
      return s;
    }
    const uid = newUid();
    seen.add(uid);
    return { ...s, uid };
  });
}

export function pushHistory(history: string[], url: string): string[] {
  if (!isHttpUrl(url)) return history;
  return [url, ...history.filter((h) => h !== url)].slice(0, MAX_HISTORY);
}

export function addSlot(state: EmulatorState, modelId: string, url: string): EmulatorState {
  if (state.slots.length >= MAX_SLOTS || !findModel(modelId)) return state;
  return { ...state, slots: [...state.slots, { uid: newUid(), modelId, url, orientation: 'portrait' }] };
}

export function duplicateSlot(state: EmulatorState, uid: string): EmulatorState {
  const index = state.slots.findIndex((s) => s.uid === uid);
  if (index < 0 || state.slots.length >= MAX_SLOTS) return state;
  const copy = { ...state.slots[index], uid: newUid() };
  const slots = [...state.slots];
  slots.splice(index + 1, 0, copy);
  return { ...state, slots };
}

export function removeSlot(state: EmulatorState, uid: string): EmulatorState {
  return { ...state, slots: state.slots.filter((s) => s.uid !== uid) };
}

export function updateSlot(state: EmulatorState, uid: string, patch: Partial<Omit<DeviceSlot, 'uid'>>): EmulatorState {
  return { ...state, slots: state.slots.map((s) => (s.uid === uid ? { ...s, ...patch } : s)) };
}

export function moveSlot(state: EmulatorState, uid: string, delta: -1 | 1): EmulatorState {
  const index = state.slots.findIndex((s) => s.uid === uid);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= state.slots.length) return state;
  const slots = [...state.slots];
  [slots[index], slots[target]] = [slots[target], slots[index]];
  return { ...state, slots };
}

export function applyUrlToAll(state: EmulatorState, url: string): EmulatorState {
  return { ...state, slots: state.slots.map((s) => ({ ...s, url })), history: pushHistory(state.history, url) };
}

/** 倍率「画面に合わせる」：一番背の高い端末が、使える高さに収まる倍率（同じ倍率で並べて大きさを比べられるようにする） */
export function fitScale(tallestOuterHeight: number, availableHeight: number): number {
  if (tallestOuterHeight <= 0 || availableHeight <= 0) return 1;
  const scale = availableHeight / tallestOuterHeight;
  return Math.min(1, Math.max(0.3, Math.floor(scale * 100) / 100));
}
