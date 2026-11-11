/**
 * 拡張機能の各部分（バックグラウンド・エミュレーター画面・iframe 内のブリッジ）の間で
 * やりとりするメッセージの型。
 */

/** iOS Safari の User-Agent。Safari 26 以降は OS の版数を 18_6 に固定して送る。 */
export const IOS_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';

/** エミュレーター画面の iframe に付ける name の接頭辞。後ろに画面寸法を付ける。 */
export const FRAME_NAME_PREFIX = 'iphone-emu';

export function encodeFrameName(width: number, height: number, dpr: number, standalone: boolean): string {
  return `${FRAME_NAME_PREFIX}|${width}|${height}|${dpr}|${standalone ? 1 : 0}`;
}

export function decodeFrameName(name: string): { width: number; height: number; dpr: number; standalone: boolean } | null {
  const parts = name.split('|');
  if (parts.length !== 5 || parts[0] !== FRAME_NAME_PREFIX) return null;
  const [width, height, dpr, standalone] = parts.slice(1).map(Number);
  if (![width, height, dpr].every((n) => Number.isFinite(n) && n > 0)) return null;
  return { width, height, dpr, standalone: standalone === 1 };
}

export const BRIDGE_SOURCE = 'iphone-emu-bridge';
export const HOST_SOURCE = 'iphone-emu-host';

/** iframe 内 → エミュレーター画面 */
export type BridgeMessage =
  | { source: typeof BRIDGE_SOURCE; type: 'nav'; url: string; title: string; fresh: boolean }
  | { source: typeof BRIDGE_SOURCE; type: 'scroll'; x: number; y: number };

/** エミュレーター画面 → iframe 内 */
export type HostMessage =
  | { source: typeof HOST_SOURCE; type: 'back' | 'forward' | 'reload' }
  | { source: typeof HOST_SOURCE; type: 'scroll-to'; x: number; y: number }
  | { source: typeof HOST_SOURCE; type: 'config'; syncScroll: boolean };

/** chrome.runtime のメッセージ */
export type RuntimeMessage =
  | { type: 'emulator:register' }
  | { type: 'emulator:open-url'; url: string };

export function isBridgeMessage(data: unknown): data is BridgeMessage {
  return typeof data === 'object' && data !== null && (data as { source?: unknown }).source === BRIDGE_SOURCE;
}

export function isHostMessage(data: unknown): data is HostMessage {
  return typeof data === 'object' && data !== null && (data as { source?: unknown }).source === HOST_SOURCE;
}

export const EMULATOR_PAGE = 'emulator.html';
