// ドメイン単位アノテーション集計ロジック (domainAnnotations.js) のテスト (issue #24)。
//
// 実行: `node --test web-annotator/lib/domainAnnotations.test.cjs`

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  getHostname,
  buildAnnotationList,
  filterDomainAnnotations
} = require('./domainAnnotations.js');

// --- getHostname ---

test('getHostname: 通常の URL から hostname を返す', () => {
  assert.equal(getHostname('https://example.com/page?q=1'), 'example.com');
  assert.equal(getHostname('http://example.com/'), 'example.com');
});

test('getHostname: サブドメインと www は別の hostname として区別される', () => {
  assert.equal(getHostname('https://news.example.com/a'), 'news.example.com');
  assert.equal(getHostname('https://www.example.com/a'), 'www.example.com');
  assert.notEqual(getHostname('https://www.example.com/a'), getHostname('https://example.com/a'));
});

test('getHostname: 不正な入力は null を返す', () => {
  assert.equal(getHostname('not a url'), null);
  assert.equal(getHostname(''), null);
  assert.equal(getHostname(null), null);
  assert.equal(getHostname(undefined), null);
});

// --- buildAnnotationList ---

test('buildAnnotationList: ハイライト/付箋の件数を集計する', () => {
  const data = {
    'https://a.com/1': {
      highlights: [{}, {}],
      stickyNotes: [{}],
      title: 'Page A',
      lastModified: 100
    }
  };
  assert.deepEqual(buildAnnotationList(data), [
    { url: 'https://a.com/1', title: 'Page A', highlightCount: 2, stickyNoteCount: 1, lastModified: 100 }
  ]);
});

test('buildAnnotationList: title が無ければ url をフォールバックに使う', () => {
  const data = { 'https://a.com/1': { highlights: [{}] } };
  assert.equal(buildAnnotationList(data)[0].title, 'https://a.com/1');
});

test('buildAnnotationList: highlights も stickyNotes も無いエントリは除外する', () => {
  const data = {
    'https://a.com/1': { title: 'meta only', lastModified: 1 },
    'https://a.com/2': { highlights: [{}] }
  };
  const result = buildAnnotationList(data);
  assert.equal(result.length, 1);
  assert.equal(result[0].url, 'https://a.com/2');
});

test('buildAnnotationList: 空・null 入力は空配列を返す', () => {
  assert.deepEqual(buildAnnotationList({}), []);
  assert.deepEqual(buildAnnotationList(null), []);
  assert.deepEqual(buildAnnotationList(undefined), []);
});

// --- filterDomainAnnotations ---

const SAMPLE = [
  { url: 'https://ex.com/a', highlightCount: 2, stickyNoteCount: 0, lastModified: 300 },
  { url: 'https://ex.com/b', highlightCount: 0, stickyNoteCount: 1, lastModified: 200 },
  { url: 'https://ex.com/current', highlightCount: 1, stickyNoteCount: 0, lastModified: 400 },
  { url: 'https://other.com/x', highlightCount: 5, stickyNoteCount: 0, lastModified: 500 },
  { url: 'https://ex.com/empty', highlightCount: 0, stickyNoteCount: 0, lastModified: 100 }
];

test('filterDomainAnnotations: 同一 hostname の他ページのみを降順で抽出する', () => {
  const result = filterDomainAnnotations(SAMPLE, 'https://ex.com/current');
  // other.com 除外 / current 自身除外 / empty(0件)除外、lastModified 降順
  assert.deepEqual(result.map(r => r.url), ['https://ex.com/a', 'https://ex.com/b']);
});

test('filterDomainAnnotations: currentUrl 自身は除外される', () => {
  const result = filterDomainAnnotations(SAMPLE, 'https://ex.com/a');
  assert.ok(!result.some(r => r.url === 'https://ex.com/a'));
});

test('filterDomainAnnotations: http と https は同一ドメイン扱い', () => {
  const list = [{ url: 'http://ex.com/a', highlightCount: 1, stickyNoteCount: 0, lastModified: 100 }];
  const result = filterDomainAnnotations(list, 'https://ex.com/current');
  assert.equal(result.length, 1);
});

test('filterDomainAnnotations: www 有無は別ドメイン扱い', () => {
  const list = [{ url: 'https://www.ex.com/a', highlightCount: 1, stickyNoteCount: 0, lastModified: 100 }];
  assert.deepEqual(filterDomainAnnotations(list, 'https://ex.com/current'), []);
});

test('filterDomainAnnotations: サブドメインが異なれば分離される', () => {
  const list = [
    { url: 'https://news.x.com/a', highlightCount: 1, stickyNoteCount: 0, lastModified: 100 },
    { url: 'https://blog.x.com/b', highlightCount: 1, stickyNoteCount: 0, lastModified: 200 }
  ];
  const result = filterDomainAnnotations(list, 'https://news.x.com/current');
  assert.deepEqual(result.map(r => r.url), ['https://news.x.com/a']);
});

test('filterDomainAnnotations: 無効な currentUrl は空配列を返す', () => {
  assert.deepEqual(filterDomainAnnotations(SAMPLE, 'not a url'), []);
  assert.deepEqual(filterDomainAnnotations(SAMPLE, null), []);
});

test('filterDomainAnnotations: list が空・null でも安全', () => {
  assert.deepEqual(filterDomainAnnotations([], 'https://ex.com/x'), []);
  assert.deepEqual(filterDomainAnnotations(null, 'https://ex.com/x'), []);
});
