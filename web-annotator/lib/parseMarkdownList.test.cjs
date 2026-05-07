// テキスト一括インポートの分割ロジック (parseMarkdownList) のリグレッションテスト。
//
// 実行: `node --test web-annotator/lib/parseMarkdownList.test.cjs`
//
// 注意: parseMarkdownList のソースは popup/popup.js と content.js に二重実装されている
//       （popup と content script は別 context のため module 共有不可）。
//       本テストは popup.js 側を正本として require している。
//       content.js を変更したら必ず popup.js にも同じ差分を入れて、本テストを実行すること。

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseMarkdownList } = require('../popup/popup.js');

test('箇条書きマーカー始まりの行は読点で分割しない（バグ #16 のリグレッション）', () => {
  const input = '- 人、AI、システムが連携する。';
  assert.deepEqual(parseMarkdownList(input), ['人、AI、システムが連携する。']);
});

test('箇条書き + 自然文（句点あり）も 1 項目として扱う', () => {
  const input = '- AIによる生成物を理解し、意図をもって選択・検証する。';
  assert.deepEqual(parseMarkdownList(input), [
    'AIによる生成物を理解し、意図をもって選択・検証する。'
  ]);
});

test('マーカーなし & 句点なしの全角リストは従来通り読点で分割', () => {
  const input = 'りんご、みかん、ぶどう';
  assert.deepEqual(parseMarkdownList(input), ['りんご', 'みかん', 'ぶどう']);
});

test('マーカーなし & 句点なしの半角カンマリストも従来通り分割', () => {
  const input = 'りんご, みかん';
  assert.deepEqual(parseMarkdownList(input), ['りんご', 'みかん']);
});

test('コードブロック内は無視される', () => {
  const input = '```\nfoo, bar\n```';
  assert.deepEqual(parseMarkdownList(input), []);
});

test('Markdown 見出しは無視される', () => {
  const input = '## タイトル\n- 本文の項目';
  assert.deepEqual(parseMarkdownList(input), ['本文の項目']);
});

test('チェックボックス記法 [x] は剥がした上で読点分割しない', () => {
  const input = '- [x] 人、AI、システムが連携する。';
  assert.deepEqual(parseMarkdownList(input), ['人、AI、システムが連携する。']);
});

test('複数行混在: 箇条書き自然文 + べた書きリスト', () => {
  const input = [
    '- AIによる生成物を理解し、意図をもって選択・検証できることが重要になります。',
    '- 人、AI、そして既存のシステムが連携する最適なワークフローを設計する力。',
    'りんご、みかん、ぶどう'
  ].join('\n');
  assert.deepEqual(parseMarkdownList(input), [
    'AIによる生成物を理解し、意図をもって選択・検証できることが重要になります。',
    '人、AI、そして既存のシステムが連携する最適なワークフローを設計する力。',
    'りんご',
    'みかん',
    'ぶどう'
  ]);
});

test('英文の文末記号 (. ! ?) を含む行も自然文として読点分割しない', () => {
  // 半角カンマと半角ピリオドの組み合わせ
  const input = 'Apple, banana, cherry.';
  assert.deepEqual(parseMarkdownList(input), ['Apple, banana, cherry.']);
});

test('空文字や非文字列は空配列を返す', () => {
  assert.deepEqual(parseMarkdownList(''), []);
  assert.deepEqual(parseMarkdownList(null), []);
  assert.deepEqual(parseMarkdownList(undefined), []);
  assert.deepEqual(parseMarkdownList(123), []);
});
