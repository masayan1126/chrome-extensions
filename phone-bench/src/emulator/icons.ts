/** 操作ボタン用の線画アイコン（24×24 の viewBox） */
const paths = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  forward: '<path d="M9 5l7 7-7 7"/>',
  reload: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  rotate: '<rect x="3" y="8" width="13" height="13" rx="2.5"/><path d="M12 3.5a8 8 0 0 1 8.5 8"/><path d="M18 9.5l2.5 2 2-2.5"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  duplicate: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  left: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
  right: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
} as const;

export type IconName = keyof typeof paths;

export function icon(name: IconName): string {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

/** iOS のステータスバーの右側（電波・Wi‑Fi・電池） */
export const STATUS_ICONS = `
<svg class="sb-signal" viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
<svg class="sb-wifi" viewBox="0 0 16 12" aria-hidden="true"><path d="M8 11.5l2.3-2.6a3.2 3.2 0 0 0-4.6 0z"/><path d="M8 5.6a6 6 0 0 1 4.2 1.7l1.3-1.5a8 8 0 0 0-11 0l1.3 1.5A6 6 0 0 1 8 5.6z"/><path d="M8 2a9.6 9.6 0 0 1 6.7 2.7L16 3.2a11.6 11.6 0 0 0-16 0l1.3 1.5A9.6 9.6 0 0 1 8 2z"/></svg>
<svg class="sb-battery" viewBox="0 0 27 12" aria-hidden="true"><rect x="0.5" y="0.5" width="23" height="11" rx="3.2" fill="none" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="18" height="8" rx="2"/><path d="M25 4v4a2 2 0 0 0 0-4z" opacity="0.45"/></svg>`;
