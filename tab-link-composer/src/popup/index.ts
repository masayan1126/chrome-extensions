function qs(id: string): HTMLElement {
  return document.getElementById(id)!;
}

// Initialize i18n
function initI18n(): void {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = chrome.i18n.getMessage(key);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && el instanceof HTMLInputElement) {
      el.placeholder = chrome.i18n.getMessage(key);
    }
  });

  document.querySelectorAll('optgroup[data-i18n-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-label');
    if (key && el instanceof HTMLOptGroupElement) {
      el.label = chrome.i18n.getMessage(key);
    }
  });
}

initI18n();

const scopeEl = qs('scope') as HTMLSelectElement;
const formatEl = qs('format') as HTMLSelectElement;
const copyBtn = qs('copy') as HTMLButtonElement;
const groupRow = qs('groupRow') as HTMLDivElement;
const groupSelect = qs('groupSelect') as HTMLSelectElement;
const resultEl = qs('result') as HTMLDivElement;
const customTemplateRow = qs('customTemplateRow') as HTMLDivElement;
const customTemplateInput = qs('customTemplate') as HTMLInputElement;

scopeEl.addEventListener('change', async () => {
  const v = scopeEl.value;
  if (v === 'pickGroup') {
    groupRow.style.display = '';
    await populateGroups();
  } else {
    groupRow.style.display = 'none';
    groupSelect.innerHTML = '';
  }
});

formatEl.addEventListener('change', () => {
  if (formatEl.value === 'custom') {
    customTemplateRow.style.display = '';
    customTemplateInput.focus();
  } else {
    customTemplateRow.style.display = 'none';
  }
});

// Initialize default scope to "pickGroup" and load groups on startup
(async function initializeScopeDefaults(): Promise<void> {
  scopeEl.value = 'pickGroup';
  groupRow.style.display = '';
  await populateGroups();
})();

async function populateGroups(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const groups = new Map<number, string>();
  for (const t of tabs) {
    if (t.groupId && t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      try {
        const g = await chrome.tabGroups.get(t.groupId);
        groups.set(g.id, g.title ?? `Group ${g.id}`);
      } catch {
        // ignore
      }
    }
  }
  groupSelect.innerHTML = '';
  for (const [id, title] of groups) {
    const opt = document.createElement('option');
    opt.value = String(id);
    opt.textContent = title;
    groupSelect.appendChild(opt);
  }
}

copyBtn.addEventListener('click', async () => {
  const formatValue = formatEl.value;
  const scopeValue = scopeEl.value as 'currentWindow' | 'all' | 'currentGroup' | 'pickGroup';

  // Import PRESET_TEMPLATES
  const PRESET_TEMPLATES: Record<string, string> = {
    notion: '- [{title}]({url})',
    obsidian: '- [[{url}|{title}]]',
    slack: '<{url}|{title}>',
    discord: '[{title}]({url})',
    csv: '"{title}","{url}"',
    org: '[[{url}][{title}]]',
    confluence: '[{title}|{url}]',
  };

  let format;
  if (formatValue === 'markdown') {
    format = { kind: 'markdown' as const };
  } else if (formatValue === 'html') {
    format = { kind: 'html' as const };
  } else if (formatValue === 'title_newline_url') {
    format = { kind: 'title_newline_url' as const };
  } else if (formatValue === 'plain') {
    format = { kind: 'plain' as const };
  } else if (formatValue === 'url_only') {
    format = { kind: 'url_only' as const };
  } else if (formatValue === 'custom') {
    const template = customTemplateInput.value.trim();
    if (!template) {
      resultEl.style.display = '';
      resultEl.style.color = '#dc2626';
      resultEl.textContent = chrome.i18n.getMessage('errorNoTemplate');
      return;
    }
    format = { kind: 'custom' as const, template };
  } else if (formatValue in PRESET_TEMPLATES) {
    format = { kind: 'custom' as const, template: PRESET_TEMPLATES[formatValue] };
  } else {
    format = { kind: 'plain' as const };
  }

  const scope =
    scopeValue === 'all' ? { kind: 'all' as const } :
    scopeValue === 'currentGroup' ? { kind: 'group' as const, groupId: await getCurrentTabGroupId() } :
    scopeValue === 'pickGroup' ? { kind: 'group' as const, groupId: Number(groupSelect.value) } :
    { kind: 'currentWindow' as const };

  const res = await chrome.runtime.sendMessage({
    type: 'COPY_REQUEST',
    payload: {
      scope,
      format,
      decodeUrl: true,
      decodePunycode: false,
    }
  });
  const text: string = res?.text ?? '';
  try {
    await navigator.clipboard.writeText(text);
    resultEl.style.display = '';
    resultEl.style.color = '#89A68B';
    resultEl.textContent = chrome.i18n.getMessage('successMessage', [String(res?.count ?? 0)]);
    setTimeout(() => window.close(), 600);
  } catch {
    resultEl.style.display = '';
    resultEl.style.color = '#dc2626';
    resultEl.textContent = chrome.i18n.getMessage('errorCopyFailed');
  }
});

async function getCurrentTabGroupId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.groupId || tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
    return chrome.tabGroups.TAB_GROUP_ID_NONE;
  }
  return tab.groupId;
}


