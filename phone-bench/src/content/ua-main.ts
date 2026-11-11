/**
 * MAIN ワールドで動き、エミュレーター画面に埋め込まれたページから見える
 * navigator / screen の値を iPhone の Safari に合わせる。
 *
 * MAIN ワールドでは chrome.runtime が使えないので、自分の拡張機能 ID は
 * スクリプトの URL（エラーのスタック）から読み取り、最上位のフレームが
 * 自分のエミュレーター画面のときだけ書き換える。
 */
import { IOS_SAFARI_UA, decodeFrameName } from '../shared/protocol';

function ownExtensionOrigin(): string | null {
  const match = /chrome-extension:\/\/([a-p]{32})\//.exec(new Error().stack ?? '');
  return match ? `chrome-extension://${match[1]}` : null;
}

function isInsideEmulator(): boolean {
  if (window === window.top) return false;
  const ancestors = location.ancestorOrigins;
  if (!ancestors || ancestors.length === 0) return false;
  const topOrigin = ancestors[ancestors.length - 1];
  const own = ownExtensionOrigin();
  if (own) return topOrigin === own;
  // ID を読み取れない環境では、直下の iframe に付けた名前で判定する。
  return topOrigin.startsWith('chrome-extension://') && decodeFrameName(window.name) !== null;
}

function defineGetter(target: object, key: string, value: unknown): void {
  try {
    Object.defineProperty(target, key, { get: () => value, configurable: true });
  } catch {
    // 書き換えられないプロパティはそのままにする
  }
}

if (isInsideEmulator()) {
  const nav = Navigator.prototype;
  defineGetter(nav, 'userAgent', IOS_SAFARI_UA);
  defineGetter(nav, 'appVersion', IOS_SAFARI_UA.replace(/^Mozilla\//, ''));
  defineGetter(nav, 'platform', 'iPhone');
  defineGetter(nav, 'vendor', 'Apple Computer, Inc.');
  defineGetter(nav, 'maxTouchPoints', 5);
  // Safari には User-Agent Client Hints がない
  defineGetter(nav, 'userAgentData', undefined);

  // 'ontouchstart' in window でタッチ端末かを判定するコードに合わせる
  if (!('ontouchstart' in window)) {
    try {
      (window as unknown as Record<string, unknown>).ontouchstart = null;
    } catch {
      // 無視
    }
  }

  const size = decodeFrameName(window.name);
  if (size && window.parent === window.top) {
    defineGetter(nav, 'standalone', size.standalone);
    const scr = Screen.prototype;
    defineGetter(scr, 'width', size.width);
    defineGetter(scr, 'height', size.height);
    defineGetter(scr, 'availWidth', size.width);
    defineGetter(scr, 'availHeight', size.height);
  }
}
