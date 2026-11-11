import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT, DEVICE_MODELS, computeLayout, getModel, outerSize } from '../src/shared/devices';

describe('DEVICE_MODELS', () => {
  it('ID が重複しない', () => {
    const ids = DEVICE_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('初期配置の機種がすべて存在する', () => {
    for (const id of DEFAULT_LAYOUT) expect(DEVICE_MODELS.some((m) => m.id === id)).toBe(true);
  });
  it('知らない ID は既定の機種にする', () => {
    expect(getModel('unknown').id).toBe('iphone-17-pro');
  });
});

describe('computeLayout', () => {
  const pro = getModel('iphone-17-pro');
  const se = getModel('iphone-se-3');

  it('縦向きの Safari ではステータスバーとツールバーを除いた高さになる', () => {
    const l = computeLayout(pro, 'portrait', 'safari');
    expect(l.viewportWidth).toBe(402);
    expect(l.viewportHeight).toBe(874 - 62 - 134);
    expect(l.showStatusBar).toBe(true);
  });

  it('ホーム画面アプリではツールバーの分だけ高くなる', () => {
    const safari = computeLayout(pro, 'portrait', 'safari');
    const app = computeLayout(pro, 'portrait', 'standalone');
    expect(app.viewportHeight - safari.viewportHeight).toBe(134);
  });

  it('横向きでは幅と高さが入れ替わり、ステータスバーが隠れる', () => {
    const l = computeLayout(pro, 'landscape', 'safari');
    expect(l.screenWidth).toBe(874);
    expect(l.screenHeight).toBe(402);
    expect(l.viewportWidth).toBe(874 - 62 * 2);
    expect(l.viewportLeft).toBe(62);
    expect(l.showStatusBar).toBe(false);
    expect(computeLayout(se, 'landscape', 'safari').viewportWidth).toBe(667);
  });

  it('すべての機種で表示領域が正の値になる', () => {
    for (const m of DEVICE_MODELS)
      for (const o of ['portrait', 'landscape'] as const)
        for (const c of ['safari', 'standalone'] as const) {
          const l = computeLayout(m, o, c);
          expect(l.viewportHeight).toBeGreaterThan(200);
          expect(l.viewportTop + l.viewportHeight + l.viewportBottom).toBe(l.screenHeight);
          expect(l.viewportLeft + l.viewportWidth + l.viewportRight).toBe(l.screenWidth);
        }
  });

  it('SE は上下の枠が厚い', () => {
    expect(outerSize(se, 'portrait')).toEqual({ width: 375 + 28, height: 667 + 156 });
    expect(outerSize(se, 'landscape')).toEqual({ width: 667 + 156, height: 375 + 28 });
  });
});
