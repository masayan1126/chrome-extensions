import {
  DEVICE_MODELS,
  bezelInsets,
  computeLayout,
  getModel,
  outerSize,
  type BrowserChrome,
} from '../shared/devices';
import { HOST_SOURCE, encodeFrameName, type HostMessage } from '../shared/protocol';
import { displayHost, normalizeUrl } from '../shared/url';
import { t } from './i18n';
import { STATUS_ICONS, icon, type IconName } from './icons';
import type { DeviceSlot } from './state';

export interface SlotCallbacks {
  onNavigate(uid: string, url: string): void;
  onInvalidUrl(reason: string): void;
  onModelChange(uid: string, modelId: string): void;
  onRotate(uid: string): void;
  onDuplicate(uid: string): void;
  onRemove(uid: string): void;
  onMove(uid: string, delta: -1 | 1): void;
  onOpenInTab(url: string): void;
}

export interface RenderContext {
  scale: number;
  chrome: BrowserChrome;
  index: number;
  count: number;
}

const SANDBOX = [
  'allow-scripts',
  'allow-same-origin',
  'allow-forms',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-modals',
  'allow-downloads',
  'allow-pointer-lock',
  'allow-presentation',
  'allow-storage-access-by-user-activation',
].join(' ');

// カメラ・マイク・位置情報などは許可が拡張機能のオリジンに記録され、以後どのサイトにも引き継がれるため委譲しない
const ALLOW = 'fullscreen; autoplay; clipboard-write';

/** ページを読み込めなかったと判断するまでの待ち時間（ブリッジから応答がないとき） */
const LOAD_FAILURE_GRACE_MS = 1500;

function button(name: IconName, labelKey: string, className = 'icon-btn'): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.innerHTML = icon(name);
  b.setAttribute('aria-label', t(labelKey));
  b.title = t(labelKey);
  return b;
}

export class SlotView {
  readonly el: HTMLElement;
  private slot: DeviceSlot;
  private readonly modelSelect: HTMLSelectElement;
  private readonly urlInput: HTMLInputElement;
  private readonly stage: HTMLElement;
  private readonly phone: HTMLElement;
  private readonly screen: HTMLElement;
  private readonly statusBar: HTMLElement;
  private readonly safariBar: HTMLElement;
  private readonly safariHost: HTMLElement;
  private readonly safariLock: HTMLElement;
  private readonly empty: HTMLElement;
  private readonly failure: HTMLElement;
  private readonly dimension: HTMLElement;
  private readonly moveLeft: HTMLButtonElement;
  private readonly moveRight: HTMLButtonElement;
  private frame: HTMLIFrameElement | null = null;
  private loadedUrl = '';
  /** 前回の load 以降に、iframe 内のブリッジから知らせが届いたか */
  private navSeen = false;
  /** 表示中のページでブリッジが動いているか（再読み込みの方法を決める） */
  private bridgeReady = false;
  private failureTimer = 0;
  private context: RenderContext | null = null;

  constructor(slot: DeviceSlot, private readonly callbacks: SlotCallbacks) {
    this.slot = slot;
    this.el = document.createElement('article');
    this.el.className = 'slot';

    // 1行目：機種の選択と削除
    const head = document.createElement('div');
    head.className = 'slot-head';
    this.modelSelect = document.createElement('select');
    this.modelSelect.className = 'model-select';
    this.modelSelect.setAttribute('aria-label', t('modelLabel'));
    for (const model of DEVICE_MODELS) {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      this.modelSelect.append(option);
    }
    this.modelSelect.addEventListener('change', () => callbacks.onModelChange(this.slot.uid, this.modelSelect.value));
    const removeBtn = button('close', 'actionRemove', 'icon-btn icon-btn--quiet');
    removeBtn.addEventListener('click', () => callbacks.onRemove(this.slot.uid));
    head.append(this.modelSelect, removeBtn);

    // 2行目：この端末の URL
    const form = document.createElement('form');
    form.className = 'slot-url';
    this.urlInput = document.createElement('input');
    this.urlInput.type = 'text';
    this.urlInput.inputMode = 'url';
    this.urlInput.autocomplete = 'off';
    this.urlInput.spellcheck = false;
    this.urlInput.setAttribute('list', 'url-history');
    this.urlInput.placeholder = t('slotUrlPlaceholder');
    this.urlInput.setAttribute('aria-label', t('slotUrlLabel'));
    form.append(this.urlInput);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submitUrl(this.urlInput.value);
    });

    // 3行目：操作
    const actions = document.createElement('div');
    actions.className = 'slot-actions';
    const back = button('back', 'actionBack');
    back.addEventListener('click', () => this.post({ source: HOST_SOURCE, type: 'back' }));
    const forward = button('forward', 'actionForward');
    forward.addEventListener('click', () => this.post({ source: HOST_SOURCE, type: 'forward' }));
    const reload = button('reload', 'actionReload');
    reload.addEventListener('click', () => this.reload());
    const rotate = button('rotate', 'actionRotate');
    rotate.addEventListener('click', () => callbacks.onRotate(this.slot.uid));
    const external = button('external', 'actionOpenInTab');
    external.addEventListener('click', () => {
      if (this.slot.url) callbacks.onOpenInTab(this.slot.url);
    });
    const duplicate = button('duplicate', 'actionDuplicate');
    duplicate.addEventListener('click', () => callbacks.onDuplicate(this.slot.uid));
    this.moveLeft = button('left', 'actionMoveLeft');
    this.moveLeft.addEventListener('click', () => callbacks.onMove(this.slot.uid, -1));
    this.moveRight = button('right', 'actionMoveRight');
    this.moveRight.addEventListener('click', () => callbacks.onMove(this.slot.uid, 1));
    const groupNav = document.createElement('div');
    groupNav.className = 'action-group';
    groupNav.append(back, forward, reload);
    const groupDevice = document.createElement('div');
    groupDevice.className = 'action-group';
    groupDevice.append(rotate, external, duplicate);
    const groupOrder = document.createElement('div');
    groupOrder.className = 'action-group';
    groupOrder.append(this.moveLeft, this.moveRight);
    actions.append(groupNav, groupDevice, groupOrder);

    // 端末本体
    this.stage = document.createElement('div');
    this.stage.className = 'stage';
    this.phone = document.createElement('div');
    this.phone.className = 'phone';
    this.screen = document.createElement('div');
    this.screen.className = 'screen';

    this.statusBar = document.createElement('div');
    this.statusBar.className = 'status-bar';
    this.statusBar.innerHTML = `<span class="sb-time">9:41</span><span class="sb-icons">${STATUS_ICONS}</span>`;

    this.safariBar = document.createElement('div');
    this.safariBar.className = 'safari-bar';
    const pill = document.createElement('div');
    pill.className = 'safari-pill';
    this.safariLock = document.createElement('span');
    this.safariLock.className = 'safari-lock';
    this.safariLock.innerHTML = icon('lock');
    this.safariHost = document.createElement('span');
    this.safariHost.className = 'safari-host';
    pill.append(this.safariLock, this.safariHost);
    this.safariBar.append(pill);

    this.empty = document.createElement('div');
    this.empty.className = 'screen-empty';
    const emptyTitle = document.createElement('p');
    emptyTitle.className = 'screen-empty-title';
    emptyTitle.textContent = t('emptyTitle');
    const emptyHint = document.createElement('p');
    emptyHint.className = 'screen-empty-hint';
    emptyHint.textContent = t('emptyHint');
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const preset of ['localhost:3000', 'localhost:5173', 'localhost:8080']) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = preset;
      chip.addEventListener('click', () => this.submitUrl(preset));
      chips.append(chip);
    }
    this.empty.append(emptyTitle, emptyHint, chips);

    this.failure = document.createElement('div');
    this.failure.className = 'screen-failure';
    this.failure.hidden = true;
    const failureTitle = document.createElement('p');
    failureTitle.className = 'screen-empty-title';
    failureTitle.textContent = t('failureTitle');
    const failureHint = document.createElement('p');
    failureHint.className = 'screen-empty-hint';
    failureHint.textContent = t('failureHint');
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'chip';
    retry.textContent = t('failureRetry');
    retry.addEventListener('click', () => this.reload(true));
    this.failure.append(failureTitle, failureHint, retry);

    const homeIndicator = document.createElement('div');
    homeIndicator.className = 'home-indicator';
    const cutout = document.createElement('div');
    cutout.className = 'cutout';
    this.screen.append(this.statusBar, this.empty, this.failure, this.safariBar, homeIndicator, cutout);

    const homeButton = document.createElement('div');
    homeButton.className = 'home-button';
    this.phone.append(this.screen, homeButton);
    this.stage.append(this.phone);

    this.dimension = document.createElement('div');
    this.dimension.className = 'dimension';

    this.el.append(head, form, actions, this.stage, this.dimension);
  }

  get uid(): string {
    return this.slot.uid;
  }

  get frameWindow(): Window | null {
    return this.frame?.contentWindow ?? null;
  }

  private submitUrl(value: string): void {
    const result = normalizeUrl(value);
    if (!result.ok) {
      if (result.reason !== 'empty') this.callbacks.onInvalidUrl(result.reason);
      return;
    }
    this.callbacks.onNavigate(this.slot.uid, result.url);
  }

  /** 状態の変化を反映する。URL が変わったときだけ iframe を読み込み直す。 */
  update(slot: DeviceSlot, context: RenderContext): void {
    const urlChanged = slot.url !== this.slot.url || !this.frame;
    this.slot = slot;
    this.context = context;
    const model = getModel(slot.modelId);
    const layout = computeLayout(model, slot.orientation, context.chrome);
    const bezel = bezelInsets(model, slot.orientation);
    const outer = outerSize(model, slot.orientation);

    if (this.modelSelect.value !== model.id) this.modelSelect.value = model.id;
    if (document.activeElement !== this.urlInput) this.urlInput.value = slot.url;
    this.el.style.order = String(context.index);
    this.moveLeft.disabled = context.index === 0;
    this.moveRight.disabled = context.index === context.count - 1;

    this.el.dataset.form = model.form;
    this.el.dataset.orientation = slot.orientation;
    this.el.dataset.chrome = context.chrome;

    const scaledWidth = Math.round(outer.width * context.scale);
    const scaledHeight = Math.round(outer.height * context.scale);
    this.stage.style.width = `${scaledWidth}px`;
    this.stage.style.height = `${scaledHeight}px`;
    this.el.style.setProperty('--slot-width', `${scaledWidth}px`);

    const s = this.phone.style;
    s.width = `${outer.width}px`;
    s.height = `${outer.height}px`;
    s.padding = `${bezel.top}px ${bezel.right}px ${bezel.bottom}px ${bezel.left}px`;
    // 100% のときは transform を付けない。Chrome は transform で縮めた枠の中の別オリジンの iframe で、
    // backdrop-filter（すりガラス）の描画が崩れることがあり、等倍なら正しく描ける。
    s.transform = context.scale === 1 ? 'none' : `scale(${context.scale})`;
    s.setProperty('--corner', `${model.cornerRadius}px`);

    const sc = this.screen.style;
    sc.width = `${layout.screenWidth}px`;
    sc.height = `${layout.screenHeight}px`;
    sc.setProperty('--vp-top', `${layout.viewportTop}px`);
    sc.setProperty('--vp-bottom', `${layout.viewportBottom}px`);
    sc.setProperty('--vp-left', `${layout.viewportLeft}px`);
    sc.setProperty('--vp-right', `${layout.viewportRight}px`);
    sc.setProperty('--status-height', `${model.statusBar}px`);
    this.statusBar.hidden = !layout.showStatusBar;
    this.safariBar.hidden = context.chrome !== 'safari';

    this.dimension.innerHTML = '';
    const ruler = document.createElement('div');
    ruler.className = 'ruler';
    ruler.style.width = `${Math.round(layout.screenWidth * context.scale)}px`;
    const main = document.createElement('p');
    main.className = 'dimension-main';
    main.textContent = `${layout.screenWidth} × ${layout.screenHeight}`;
    const sub = document.createElement('p');
    sub.className = 'dimension-sub';
    sub.textContent = t('viewportSize', [String(layout.viewportWidth), String(layout.viewportHeight), String(model.dpr)]);
    this.dimension.append(ruler, main, sub);

    // iOS の screen.width / height は向きによらず縦向きの値
    const name = encodeFrameName(model.width, model.height, model.dpr, context.chrome === 'standalone');
    let reloadFrame = urlChanged;
    if (this.frame && this.frame.name !== name) {
      // 機種や表示モードが変わったら、別の端末として iframe を作り直す
      this.frame.remove();
      this.frame = null;
      this.loadedUrl = '';
      reloadFrame = true;
    }

    if (reloadFrame) this.load(slot.url, name);
    this.updateSafariBar(slot.url);
  }

  private load(url: string, name: string): void {
    window.clearTimeout(this.failureTimer);
    this.failure.hidden = true;
    if (!url) {
      this.frame?.remove();
      this.frame = null;
      this.loadedUrl = '';
      this.empty.hidden = false;
      return;
    }
    this.empty.hidden = true;
    if (url === this.loadedUrl && this.frame) return;
    if (!this.frame) {
      this.frame = document.createElement('iframe');
      this.frame.className = 'viewport';
      this.frame.setAttribute('sandbox', SANDBOX);
      this.frame.setAttribute('allow', ALLOW);
      this.frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      this.frame.title = t('frameTitle');
      this.frame.addEventListener('load', () => this.onFrameLoad());
      // name と src は iframe を DOM に入れる前に付ける。name は入れた後に変えても中のページへ届かず、
      // src が空のまま入れると about:blank の load が先に起きて、読み込み失敗と誤って判断するため。
      this.frame.name = name;
      this.navSeen = false;
      this.bridgeReady = false;
      this.loadedUrl = url;
      this.frame.src = url;
      this.screen.insertBefore(this.frame, this.empty);
      return;
    }
    this.navSeen = false;
    this.bridgeReady = false;
    this.loadedUrl = url;
    this.frame.src = url;
  }

  private onFrameLoad(): void {
    window.clearTimeout(this.failureTimer);
    if (this.navSeen) {
      this.navSeen = false;
      return;
    }
    // 新しい文書からの知らせがまだない。来なければブリッジのない画面（エラー画面など）
    this.bridgeReady = false;
    // 接続できなかったページ（Chrome のエラー画面）ではブリッジが動かないので、知らせが来ない
    this.failureTimer = window.setTimeout(() => {
      if (!this.navSeen && this.frame) {
        this.bridgeReady = false;
        this.failure.hidden = false;
      }
      this.navSeen = false;
    }, LOAD_FAILURE_GRACE_MS);
  }

  /** iframe 内のブリッジから、表示中のページの知らせを受けたとき */
  onBridgeNav(url: string, fresh: boolean): void {
    if (fresh) {
      this.navSeen = true;
      this.bridgeReady = true;
    }
    window.clearTimeout(this.failureTimer);
    this.failure.hidden = true;
    this.loadedUrl = url;
    this.slot = { ...this.slot, url };
    if (document.activeElement !== this.urlInput) this.urlInput.value = url;
    this.updateSafariBar(url);
  }

  private updateSafariBar(url: string): void {
    this.safariHost.textContent = url ? displayHost(url) : t('safariPlaceholder');
    this.safariLock.hidden = !url.startsWith('https:');
  }

  reload(force = false): void {
    if (!this.frame || !this.slot.url) return;
    this.failure.hidden = true;
    if (this.bridgeReady && !force) {
      this.post({ source: HOST_SOURCE, type: 'reload' });
      return;
    }
    this.navSeen = false;
    this.bridgeReady = false;
    this.loadedUrl = this.slot.url;
    this.frame.src = this.slot.url;
  }

  post(message: HostMessage): void {
    this.frame?.contentWindow?.postMessage(message, '*');
  }

  /** 拡大率と表示モードだけを変えて再描画する */
  refresh(context: Partial<RenderContext>): void {
    if (!this.context) return;
    this.update(this.slot, { ...this.context, ...context });
  }
}
