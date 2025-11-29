export const EXTENSION_NAME = 'Copy Tab Title & URL';

export const STORAGE_KEYS = {
  format: 'format',
  decodeUrl: 'decodeUrl',
  decodePunycode: 'decodePunycode',
  customTemplates: 'customTemplates',
} as const;

export const OFFSCREEN_DOCUMENT_PATH = 'src/offscreen/index.html';

// Preset custom templates for popular tools
export const PRESET_TEMPLATES = {
  notion: '- [{title}]({url})',
  obsidian: '- [[{url}|{title}]]',
  slack: '<{url}|{title}>',
  discord: '[{title}]({url})',
  csv: '"{title}","{url}"',
  json: '{"title": "{title}", "url": "{url}"}',
  org: '[[{url}][{title}]]',
  confluence: '[{title}|{url}]',
} as const;


