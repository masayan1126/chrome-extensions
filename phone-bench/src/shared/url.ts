/**
 * 入力された文字列を、iframe に読み込める http(s) の URL へ整える。
 * 「localhost:3000」のようなスキーム省略は、ローカル開発のホストなら http、それ以外は https を補う。
 */

export type NormalizeResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'empty' | 'unsupported' | 'invalid' };

const HTTP_SCHEME = /^https?:\/\//i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
const OPAQUE_SCHEMES = /^(javascript|data|blob|about|mailto|tel|file|chrome|chrome-extension|edge|view-source):/i;

export function isLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host.endsWith('.local') || host.endsWith('.test') || host.endsWith('.internal')) return true;
  if (host === '::1' || host === '0.0.0.0') return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
  }
  // ドットを含まないホスト名（社内のマシン名など）
  return !host.includes('.') && !host.includes(':');
}

export function normalizeUrl(input: string): NormalizeResult {
  const raw = input.trim();
  if (!raw) return { ok: false, reason: 'empty' };

  let candidate: string;
  if (HTTP_SCHEME.test(raw)) {
    candidate = raw;
  } else if (ANY_SCHEME.test(raw) || OPAQUE_SCHEMES.test(raw)) {
    return { ok: false, reason: 'unsupported' };
  } else {
    const hostPart = raw.split(/[/?#]/, 1)[0];
    if (!hostPart || /\s/.test(hostPart)) return { ok: false, reason: 'invalid' };
    let hostname: string;
    try {
      hostname = new URL(`http://${hostPart}`).hostname;
    } catch {
      return { ok: false, reason: 'invalid' };
    }
    candidate = `${isLocalHost(hostname) ? 'http' : 'https'}://${raw}`;
  }

  try {
    const url = new URL(candidate);
    if (!url.hostname) return { ok: false, reason: 'invalid' };
    return { ok: true, url: url.href };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

/** Safari のアドレスバー風に、ホスト名だけを短く表示する */
export function displayHost(url: string): string {
  try {
    const { hostname, port } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    return port ? `${host}:${port}` : host;
  } catch {
    return '';
  }
}

export function isHttpUrl(url: string | undefined | null): url is string {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
