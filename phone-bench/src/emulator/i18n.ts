/** chrome.i18n の薄いラッパー。キーが見つからないときはキー名を返して気づけるようにする。 */
export function t(key: string, substitutions?: string | string[]): string {
  const message = chrome.i18n?.getMessage(key, substitutions);
  return message || key;
}

/** data-i18n / data-i18n-placeholder / data-i18n-title / data-i18n-aria-label を埋める */
export function localizeDocument(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as string);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder as string));
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle as string);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel as string));
  });
}
