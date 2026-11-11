import { describe, expect, it } from 'vitest';
import {
  MAX_SLOTS,
  addSlot,
  applyUrlToAll,
  defaultState,
  duplicateSlot,
  fitScale,
  moveSlot,
  pushHistory,
  removeSlot,
  sanitizeState,
  updateSlot,
} from '../src/emulator/state';

describe('defaultState', () => {
  it('3 台を並べ、渡した URL を全端末に入れる', () => {
    const s = defaultState('https://example.com/');
    expect(s.slots).toHaveLength(3);
    expect(s.slots.every((x) => x.url === 'https://example.com/')).toBe(true);
    expect(s.history).toEqual(['https://example.com/']);
  });
});

describe('sanitizeState', () => {
  it('壊れたデータは初期状態にする', () => {
    expect(sanitizeState(null).slots).toHaveLength(3);
    expect(sanitizeState('x').zoom).toBe('fit');
  });

  it('知らない機種・危険な URL・範囲外の倍率を落とす', () => {
    const s = sanitizeState({
      slots: [
        { uid: 'a', modelId: 'iphone-se-3', url: 'javascript:alert(1)', orientation: 'landscape' },
        { uid: 'b', modelId: 'pixel-9', url: 'https://a.com/' },
      ],
      zoom: 3,
      chrome: 'standalone',
      syncScroll: true,
      history: ['https://a.com/', 'chrome://x'],
    });
    expect(s.slots).toEqual([{ uid: 'a', modelId: 'iphone-se-3', url: '', orientation: 'landscape' }]);
    expect(s.zoom).toBe('fit');
    expect(s.chrome).toBe('standalone');
    expect(s.syncScroll).toBe(true);
    expect(s.history).toEqual(['https://a.com/']);
  });

  it('文字列でない URL は落とす', () => {
    const s = sanitizeState({ slots: [{ uid: 'a', modelId: 'iphone-16', url: ['https://a.com/'] }], history: [['https://a.com/']] });
    expect(s.slots[0].url).toBe('');
    expect(s.history).toEqual([]);
  });

  it('重複した uid を振り直す', () => {
    const s = sanitizeState({ slots: [{ uid: 'x', modelId: 'iphone-16' }, { uid: 'x', modelId: 'iphone-16' }] });
    expect(new Set(s.slots.map((x) => x.uid)).size).toBe(2);
  });
});

describe('端末の操作', () => {
  const base = defaultState('https://a.com/');

  it('追加は上限まで', () => {
    let s = base;
    for (let i = 0; i < 20; i++) s = addSlot(s, 'iphone-16', '');
    expect(s.slots).toHaveLength(MAX_SLOTS);
  });

  it('複製はすぐ右に入る', () => {
    const uid = base.slots[0].uid;
    const s = duplicateSlot(base, uid);
    expect(s.slots).toHaveLength(4);
    expect(s.slots[1].modelId).toBe(base.slots[0].modelId);
    expect(s.slots[1].uid).not.toBe(uid);
  });

  it('移動と削除', () => {
    const [a, b] = base.slots;
    expect(moveSlot(base, a.uid, 1).slots.slice(0, 2).map((x) => x.uid)).toEqual([b.uid, a.uid]);
    expect(moveSlot(base, a.uid, -1)).toBe(base);
    expect(removeSlot(base, a.uid).slots).toHaveLength(2);
  });

  it('個別の URL 変更と、全端末への適用', () => {
    const one = updateSlot(base, base.slots[1].uid, { url: 'http://localhost:3000/' });
    expect(one.slots.map((x) => x.url)).toEqual(['https://a.com/', 'http://localhost:3000/', 'https://a.com/']);
    const all = applyUrlToAll(one, 'https://b.com/');
    expect(all.slots.every((x) => x.url === 'https://b.com/')).toBe(true);
    expect(all.history[0]).toBe('https://b.com/');
  });
});

describe('pushHistory', () => {
  it('新しい順に並べ、重複を除き、上限で切る', () => {
    let h: string[] = [];
    for (let i = 0; i < 25; i++) h = pushHistory(h, `https://a.com/${i}`);
    h = pushHistory(h, 'https://a.com/10');
    expect(h).toHaveLength(20);
    expect(h[0]).toBe('https://a.com/10');
    expect(h.filter((x) => x === 'https://a.com/10')).toHaveLength(1);
  });
});

describe('fitScale', () => {
  it('収まる倍率を返し、0.3〜1 に収める', () => {
    expect(fitScale(1000, 600)).toBe(0.6);
    expect(fitScale(500, 900)).toBe(1);
    expect(fitScale(2000, 100)).toBe(0.3);
    expect(fitScale(0, 100)).toBe(1);
  });
});
