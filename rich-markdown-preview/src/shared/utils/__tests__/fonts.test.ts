import { describe, it, expect } from 'vitest';
import { getFontOption, fontOptions } from '../fonts';

describe('getFontOption', () => {
  it('有効な ID "system" に対して正しいフォントオプションを返す', () => {
    const option = getFontOption('system');
    expect(option.id).toBe('system');
    expect(option.name).toBe('システムデフォルト');
  });

  it('有効な ID "noto-sans-jp" に対して正しいフォントオプションを返す', () => {
    const option = getFontOption('noto-sans-jp');
    expect(option.id).toBe('noto-sans-jp');
    expect(option.name).toBe('Noto Sans JP');
    expect(option.googleFont).toBeDefined();
  });

  it('有効な ID "m-plus-rounded" に対して正しいフォントオプションを返す', () => {
    const option = getFontOption('m-plus-rounded');
    expect(option.id).toBe('m-plus-rounded');
  });

  it('無効な ID はフォールバック (先頭のオプション) を返す', () => {
    // @ts-expect-error - 意図的に無効なIDを渡す
    const option = getFontOption('invalid-font');
    expect(option).toEqual(fontOptions[0]);
  });
});

describe('fontOptions', () => {
  it('6 つのエントリがある', () => {
    expect(fontOptions).toHaveLength(6);
  });

  it('すべてのエントリに id, name, fontFamily がある', () => {
    for (const option of fontOptions) {
      expect(option.id).toBeDefined();
      expect(option.name).toBeDefined();
      expect(option.fontFamily).toBeDefined();
    }
  });

  it('system 以外のすべてに googleFont プロパティがある', () => {
    const nonSystemOptions = fontOptions.filter((f) => f.id !== 'system');
    expect(nonSystemOptions.length).toBe(5);
    for (const option of nonSystemOptions) {
      expect(option.googleFont).toBeDefined();
      expect(typeof option.googleFont).toBe('string');
    }
  });

  it('system フォントには googleFont がない', () => {
    const systemOption = fontOptions.find((f) => f.id === 'system');
    expect(systemOption).toBeDefined();
    expect(systemOption!.googleFont).toBeUndefined();
  });
});
