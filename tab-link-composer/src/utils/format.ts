import type { OutputFormat, TabInfo } from '@/types';

export function buildLine(tab: TabInfo, format: OutputFormat): string {
  const title = tab.title ?? '';
  const url = tab.url ?? '';

  if (format.kind === 'markdown') {
    return `[${escapeMarkdown(title)}](${url})`;
  }
  if (format.kind === 'html') {
    return `<a href="${escapeHtml(url)}">${escapeHtml(title)}</a>`;
  }
  if (format.kind === 'title_newline_url') {
    return `${title}\n${url}`;
  }
  if (format.kind === 'custom') {
    return applyCustomTemplate(title, url, format.template);
  }
  return `${title} ${url}`.trim();
}

function applyCustomTemplate(title: string, url: string, template: string): string {
  return template
    .replace(/\{title\}/g, title)
    .replace(/\{url\}/g, url);
}

export function joinLines(lines: string[]): string {
  return lines.join('\n');
}

export function composeText(lines: string[], format: OutputFormat): string {
  if (format.kind === 'title_newline_url') {
    return lines.join('\n\n');
  }
  return joinLines(lines);
}

function escapeMarkdown(input: string): string {
  return input.replace(/[\\`*_{}\[\]()#+\-.!]/g, (m) => `\\${m}`);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


