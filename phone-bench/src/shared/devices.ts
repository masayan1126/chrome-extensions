/**
 * iPhone の機種データと、画面・表示領域の寸法計算。
 *
 * 寸法はすべて CSS ピクセル（iOS のポイント）。Safari のツールバーの高さは
 * 実機で測った値をもとにした目安で、iOS のバージョンやスクロール位置で変わる。
 */

export type DeviceForm = 'dynamic-island' | 'notch' | 'home-button';

export interface DeviceModel {
  id: string;
  name: string;
  /** 縦向きの画面幅 (pt) */
  width: number;
  /** 縦向きの画面高さ (pt) */
  height: number;
  dpr: 2 | 3;
  form: DeviceForm;
  /** 縦向きのステータスバーの高さ (pt) */
  statusBar: number;
  /** 画面の角丸 (pt) */
  cornerRadius: number;
  released: number;
}

export type Orientation = 'portrait' | 'landscape';
/** safari: Safari のアドレスバーとツールバーを表示 / standalone: ホーム画面に追加した Web アプリ */
export type BrowserChrome = 'safari' | 'standalone';

export const DEVICE_MODELS: readonly DeviceModel[] = [
  { id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', width: 440, height: 956, dpr: 3, form: 'dynamic-island', statusBar: 62, cornerRadius: 62, released: 2025 },
  { id: 'iphone-17-pro', name: 'iPhone 17 Pro', width: 402, height: 874, dpr: 3, form: 'dynamic-island', statusBar: 62, cornerRadius: 62, released: 2025 },
  { id: 'iphone-air', name: 'iPhone Air', width: 420, height: 912, dpr: 3, form: 'dynamic-island', statusBar: 62, cornerRadius: 62, released: 2025 },
  { id: 'iphone-17', name: 'iPhone 17', width: 402, height: 874, dpr: 3, form: 'dynamic-island', statusBar: 62, cornerRadius: 62, released: 2025 },
  { id: 'iphone-16e', name: 'iPhone 16e', width: 390, height: 844, dpr: 3, form: 'notch', statusBar: 47, cornerRadius: 47, released: 2025 },
  { id: 'iphone-16-plus', name: 'iPhone 16 Plus', width: 430, height: 932, dpr: 3, form: 'dynamic-island', statusBar: 59, cornerRadius: 55, released: 2024 },
  { id: 'iphone-16', name: 'iPhone 16 / 15', width: 393, height: 852, dpr: 3, form: 'dynamic-island', statusBar: 59, cornerRadius: 55, released: 2024 },
  { id: 'iphone-14', name: 'iPhone 14 / 13', width: 390, height: 844, dpr: 3, form: 'notch', statusBar: 47, cornerRadius: 47, released: 2022 },
  { id: 'iphone-13-mini', name: 'iPhone 13 mini', width: 375, height: 812, dpr: 3, form: 'notch', statusBar: 50, cornerRadius: 44, released: 2021 },
  { id: 'iphone-se-3', name: 'iPhone SE (第3世代)', width: 375, height: 667, dpr: 2, form: 'home-button', statusBar: 20, cornerRadius: 0, released: 2022 },
];

export const DEFAULT_MODEL_ID = 'iphone-17-pro';

/** 初回起動時に並べる機種（大・標準・小） */
export const DEFAULT_LAYOUT: readonly string[] = ['iphone-17-pro-max', 'iphone-17-pro', 'iphone-se-3'];

export function findModel(id: string): DeviceModel | undefined {
  return DEVICE_MODELS.find((m) => m.id === id);
}

export function getModel(id: string): DeviceModel {
  return findModel(id) ?? (findModel(DEFAULT_MODEL_ID) as DeviceModel);
}

/** Safari の下部（アドレスバー＋ツールバー＋ホームインジケーター）の高さの目安 */
function safariBottomBar(model: DeviceModel): number {
  return model.form === 'home-button' ? 94 : 134;
}

/** ホームインジケーターの領域（Face ID 機のみ） */
function homeIndicator(model: DeviceModel): number {
  return model.form === 'home-button' ? 0 : 21;
}

/** 横向きの Safari 上部（タブバー）の高さの目安 */
const SAFARI_LANDSCAPE_TOP = 50;

export interface ScreenLayout {
  /** 画面全体の幅・高さ（向きを反映済み） */
  screenWidth: number;
  screenHeight: number;
  /** Web ページの表示領域の上端（画面上端からの距離） */
  viewportTop: number;
  /** Web ページの表示領域の下端から画面下端までの距離 */
  viewportBottom: number;
  /** 横向きで Dynamic Island・ノッチを避ける左右の余白 */
  viewportLeft: number;
  viewportRight: number;
  /** Web ページが受け取るビューポート（window.innerWidth / innerHeight 相当） */
  viewportWidth: number;
  viewportHeight: number;
  showStatusBar: boolean;
}

export function computeLayout(model: DeviceModel, orientation: Orientation, chrome: BrowserChrome): ScreenLayout {
  if (orientation === 'portrait') {
    const top = model.statusBar;
    const bottom = chrome === 'safari' ? safariBottomBar(model) : 0;
    return {
      screenWidth: model.width,
      screenHeight: model.height,
      viewportTop: top,
      viewportBottom: bottom,
      viewportLeft: 0,
      viewportRight: 0,
      viewportWidth: model.width,
      viewportHeight: model.height - top - bottom,
      showStatusBar: true,
    };
  }

  // 横向きではステータスバーが隠れ、Face ID 機は左右に安全領域の余白が入る
  // （viewport-fit=cover を指定していないページの表示）。
  const top = chrome === 'safari' ? SAFARI_LANDSCAPE_TOP : 0;
  const bottom = homeIndicator(model);
  const side = model.form === 'home-button' ? 0 : model.statusBar;
  return {
    screenWidth: model.height,
    screenHeight: model.width,
    viewportTop: top,
    viewportBottom: bottom,
    viewportLeft: side,
    viewportRight: side,
    viewportWidth: model.height - side * 2,
    viewportHeight: model.width - top - bottom,
    showStatusBar: false,
  };
}

/** 端末の枠（ベゼル）の太さ。ホームボタン機は上下が厚い。 */
export function bezelInsets(model: DeviceModel, orientation: Orientation): { top: number; right: number; bottom: number; left: number } {
  const side = 14;
  if (model.form !== 'home-button') return { top: side, right: side, bottom: side, left: side };
  const thick = 78;
  return orientation === 'portrait'
    ? { top: thick, right: side, bottom: thick, left: side }
    : { top: side, right: thick, bottom: side, left: thick };
}

/** 枠を含めた端末の外形寸法 */
export function outerSize(model: DeviceModel, orientation: Orientation): { width: number; height: number } {
  const layout = computeLayout(model, orientation, 'safari');
  const b = bezelInsets(model, orientation);
  return { width: layout.screenWidth + b.left + b.right, height: layout.screenHeight + b.top + b.bottom };
}
