import { describe, expect, it } from 'vitest';
import { buildRulesForTab, nextRuleId, ruleIdsForTab } from '../src/background/rules';
import { IOS_SAFARI_UA, decodeFrameName, encodeFrameName } from '../src/shared/protocol';

describe('buildRulesForTab', () => {
  const rules = buildRulesForTab(42, 7, 'abcdefghijklmnopabcdefghijklmnop');

  it('対象のタブだけに効く', () => {
    expect(rules.map((r) => r.id)).toEqual([7, 8, 9]);
    expect(rules.every((r) => r.condition.tabIds?.length === 1 && r.condition.tabIds[0] === 42)).toBe(true);
  });

  it('トップレベルの通信は書き換えない', () => {
    for (const r of rules) expect(r.condition.resourceTypes).not.toContain('main_frame');
  });

  it('User-Agent を iOS Safari にする', () => {
    expect(rules[0].action.requestHeaders?.[0]).toEqual({ header: 'user-agent', operation: 'set', value: IOS_SAFARI_UA });
  });

  it('埋め込みを拒むヘッダーは iframe の応答からだけ外す', () => {
    for (const r of rules.slice(1)) {
      expect(r.condition.resourceTypes).toEqual(['sub_frame']);
      expect(r.action.responseHeaders?.map((h) => h.header)).toEqual(['x-frame-options', 'content-security-policy']);
    }
  });

  it('外すのは拡張機能が読み込ませた iframe と、その中の同じサイトへの移動だけ', () => {
    expect(rules[1].condition.initiatorDomains).toEqual(['abcdefghijklmnopabcdefghijklmnop']);
    expect(rules[2].condition.domainType).toBe('firstParty');
    expect(rules[2].condition.initiatorDomains).toBeUndefined();
  });

  it('タブごとのルール ID を見つけ、次の ID を決める', () => {
    const other = buildRulesForTab(99, 10, 'abcdefghijklmnopabcdefghijklmnop');
    const all = [...rules, ...other];
    expect(ruleIdsForTab(all, 42)).toEqual([7, 8, 9]);
    expect(nextRuleId(all)).toBe(13);
    expect(nextRuleId([])).toBe(1);
  });
});

describe('frame name', () => {
  it('寸法を往復できる', () => {
    expect(decodeFrameName(encodeFrameName(402, 678, 3, true))).toEqual({ width: 402, height: 678, dpr: 3, standalone: true });
  });
  it('ほかの name は無視する', () => {
    expect(decodeFrameName('')).toBeNull();
    expect(decodeFrameName('iphone-emu|a|b|c|0')).toBeNull();
    expect(decodeFrameName('other|1|2|3|0')).toBeNull();
  });
});
