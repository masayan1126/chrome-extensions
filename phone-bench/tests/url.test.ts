import { describe, expect, it } from 'vitest';
import { displayHost, isHttpUrl, isLocalHost, normalizeUrl } from '../src/shared/url';

describe('normalizeUrl', () => {
  it.each([
    ['localhost:3000', 'http://localhost:3000/'],
    ['localhost:5173/about?x=1', 'http://localhost:5173/about?x=1'],
    ['127.0.0.1:8080', 'http://127.0.0.1:8080/'],
    ['192.168.1.20:3000', 'http://192.168.1.20:3000/'],
    ['myapp.test', 'http://myapp.test/'],
    ['example.com', 'https://example.com/'],
    ['www.example.com/path', 'https://www.example.com/path'],
    ['  https://example.com/a  ', 'https://example.com/a'],
    ['HTTP://Example.com', 'http://example.com/'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeUrl(input)).toEqual({ ok: true, url: expected });
  });

  it('空の入力は empty', () => {
    expect(normalizeUrl('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it.each(['javascript:alert(1)', 'file:///Users/a.html', 'chrome://settings', 'ftp://example.com', 'data:text/html,hi'])(
    '%s は表示できない',
    (input) => {
      expect(normalizeUrl(input)).toEqual({ ok: false, reason: 'unsupported' });
    },
  );

  it('空白を含むホストは不正', () => {
    expect(normalizeUrl('foo bar.com')).toEqual({ ok: false, reason: 'invalid' });
  });
});

describe('isLocalHost', () => {
  it.each(['localhost', 'app.localhost', 'mac.local', '10.0.0.5', '172.20.1.1', '[::1]', 'devbox'])('%s はローカル', (h) => {
    expect(isLocalHost(h)).toBe(true);
  });
  it.each(['example.com', '8.8.8.8', '172.32.0.1'])('%s はローカルではない', (h) => {
    expect(isLocalHost(h)).toBe(false);
  });
});

describe('displayHost / isHttpUrl', () => {
  it('www を省き、ポートを残す', () => {
    expect(displayHost('https://www.example.com/a')).toBe('example.com');
    expect(displayHost('http://localhost:3000/')).toBe('localhost:3000');
    expect(displayHost('not a url')).toBe('');
  });
  it('http(s) だけを受け付ける', () => {
    expect(isHttpUrl('https://a.com')).toBe(true);
    expect(isHttpUrl('chrome://newtab')).toBe(false);
    expect(isHttpUrl(undefined)).toBe(false);
  });
});
