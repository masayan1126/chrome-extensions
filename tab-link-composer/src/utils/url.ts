import punycode from 'punycode/';

export function maybeDecodeUrl(rawUrl: string, decodeUrl: boolean, decodePunycode: boolean): string {
  if (!rawUrl) return '';
  let result = rawUrl;
  if (decodeUrl) {
    try {
      result = decodeURIComponent(result);
    } catch {
      // keep original when malformed
    }
  }
  if (decodePunycode) {
    try {
      const urlObj = new URL(result);
      urlObj.hostname = punycode.toUnicode(urlObj.hostname);
      result = urlObj.toString();
    } catch {
      // ignore invalid URL
    }
  }
  return result;
}


