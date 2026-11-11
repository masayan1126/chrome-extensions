/**
 * エミュレーター画面の直下の iframe で動くブリッジ。
 * - 表示中の URL とタイトルをエミュレーター画面へ知らせる（iframe 内での移動も追う）
 * - 戻る・進む・再読み込みの指示を受ける
 * - スクロールの同期（スクロール位置を割合でやりとりする）
 */
import { BRIDGE_SOURCE, isHostMessage, type BridgeMessage } from '../shared/protocol';

type WithoutSource<T> = T extends unknown ? Omit<T, 'source'> : never;

const hostOrigin = `chrome-extension://${chrome.runtime.id}`;

function isDirectChildOfEmulator(): boolean {
  if (window === window.top || window.parent !== window.top) return false;
  const ancestors = location.ancestorOrigins;
  return !!ancestors && ancestors.length === 1 && ancestors[0] === hostOrigin;
}

if (isDirectChildOfEmulator()) {
  // iPhone のスクロールバーは表示領域の幅を使わない。パソコンのスクロールバーで幅が 15px ほど
  // 狭くならないよう、端末の画面ではスクロールバーを隠す。
  const style = document.createElement('style');
  style.textContent = '*{scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}';
  (document.head ?? document.documentElement).append(style);

  const post = (message: WithoutSource<BridgeMessage>) => {
    window.parent.postMessage({ source: BRIDGE_SOURCE, ...message }, hostOrigin);
  };

  let lastUrl = '';
  let lastTitle = '';
  // この文書で最初の知らせだけ fresh にする（エミュレーター画面が読み込みの成否を判断する）
  let fresh = true;
  const reportNav = () => {
    const url = location.href;
    const title = document.title;
    if (url === lastUrl && title === lastTitle) return;
    lastUrl = url;
    lastTitle = title;
    post({ type: 'nav', url, title, fresh });
    fresh = false;
  };

  reportNav();
  document.addEventListener('DOMContentLoaded', reportNav);
  window.addEventListener('load', reportNav);
  window.addEventListener('hashchange', reportNav);
  window.addEventListener('popstate', reportNav);
  // pushState による移動は ISOLATED ワールドから検知できないので、間隔をあけて確かめる
  window.setInterval(reportNav, 700);

  let syncScroll = false;
  let suppressUntil = 0;
  let scheduled = false;

  const scroller = () => document.scrollingElement ?? document.documentElement;

  window.addEventListener(
    'scroll',
    () => {
      if (!syncScroll || scheduled || performance.now() < suppressUntil) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        const el = scroller();
        const maxY = el.scrollHeight - window.innerHeight;
        const maxX = el.scrollWidth - window.innerWidth;
        post({ type: 'scroll', x: maxX > 0 ? window.scrollX / maxX : 0, y: maxY > 0 ? window.scrollY / maxY : 0 });
      });
    },
    { passive: true },
  );

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.origin !== hostOrigin || !isHostMessage(event.data)) return;
    const msg = event.data;
    switch (msg.type) {
      case 'back':
        history.back();
        break;
      case 'forward':
        history.forward();
        break;
      case 'reload':
        location.reload();
        break;
      case 'config':
        syncScroll = msg.syncScroll;
        break;
      case 'scroll-to': {
        const el = scroller();
        suppressUntil = performance.now() + 200;
        window.scrollTo({
          left: msg.x * Math.max(0, el.scrollWidth - window.innerWidth),
          top: msg.y * Math.max(0, el.scrollHeight - window.innerHeight),
          behavior: 'instant' as ScrollBehavior,
        });
        break;
      }
    }
  });
}
