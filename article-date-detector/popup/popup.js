// Article Date Detector - Popup

(function () {
  'use strict';

  function i18n(key, substitutions) {
    try {
      return chrome.i18n.getMessage(key, substitutions) || key;
    } catch {
      return key;
    }
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const msg = i18n(key);
      if (msg && msg !== key) {
        el.textContent = msg;
      }
    });
  }

  const TZ_OFFSET_TO_ABBR = {
    540: 'JST', 480: 'CST', 330: 'IST', 60: 'CET', 0: 'UTC',
    '-300': 'EST', '-360': 'CST', '-420': 'MST', '-480': 'PST'
  };

  function getLocalTzAbbr() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date());
      const name = parts.find(p => p.type === 'timeZoneName')?.value;
      if (name && !name.startsWith('GMT')) return name;
    } catch {}
    const offset = new Date().getTimezoneOffset() * -1;
    if (TZ_OFFSET_TO_ABBR[offset]) return TZ_OFFSET_TO_ABBR[offset];
    const sign = offset >= 0 ? '+' : '';
    const hours = offset / 60;
    return `UTC${sign}${hours}`;
  }

  const localTzAbbr = getLocalTzAbbr();

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const utcY = d.getUTCFullYear();
    const utcM = String(d.getUTCMonth() + 1).padStart(2, '0');
    const utcD = String(d.getUTCDate()).padStart(2, '0');
    const utc = `${utcY}-${utcM}-${utcD}`;

    const locY = d.getFullYear();
    const locM = String(d.getMonth() + 1).padStart(2, '0');
    const locD = String(d.getDate()).padStart(2, '0');
    const local = `${locY}-${locM}-${locD}`;

    if (utc === local) {
      return utc;
    }
    return `${local} (${localTzAbbr}) / ${utc} (UTC)`;
  }

  function getRelativeTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 0) return '';

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    const months = Math.floor(days / 30.44);
    const years = Math.floor(days / 365.25);

    if (minutes < 1) return i18n('justNow');
    if (minutes < 60) return i18n('minutesAgo', [String(minutes)]);
    if (hours < 24) return i18n('hoursAgo', [String(hours)]);
    if (days < 31) return i18n('daysAgo', [String(days)]);
    if (months < 12) return i18n('monthsAgo', [String(months)]);
    return i18n('yearsAgo', [String(years)]);
  }

  function getFreshnessColor(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const months = (now - date) / (1000 * 60 * 60 * 24 * 30.44);
    if (months <= 1) return '#22c55e';
    if (months <= 6) return '#eab308';
    if (months <= 12) return '#f97316';
    return '#ef4444';
  }

  function getFreshnessLabel(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const months = (now - date) / (1000 * 60 * 60 * 24 * 30.44);
    if (months <= 1) return i18n('freshnessNew');
    if (months <= 6) return i18n('freshnessMedium');
    if (months <= 12) return i18n('freshnessOld');
    return i18n('freshnessVeryOld');
  }

  function createDateCard(label, dateInfo) {
    const card = document.createElement('div');
    card.className = 'date-card';
    const color = getFreshnessColor(dateInfo.date);
    card.style.setProperty('--freshness-color', color);

    const labelEl = document.createElement('div');
    labelEl.className = 'date-card-label';
    labelEl.textContent = label;

    const valueEl = document.createElement('div');
    valueEl.className = 'date-card-value';
    valueEl.textContent = formatDate(dateInfo.date);

    const relEl = document.createElement('div');
    relEl.className = 'date-card-relative';
    relEl.textContent = getRelativeTime(dateInfo.date);

    const sourceEl = document.createElement('div');
    sourceEl.className = 'date-card-source';
    sourceEl.appendChild(document.createTextNode(i18n('source') + ': '));
    const sourceBadge = document.createElement('span');
    sourceBadge.className = 'source-badge';
    sourceBadge.textContent = dateInfo.source;
    sourceEl.appendChild(sourceBadge);

    // Freshness indicator
    const freshnessEl = document.createElement('div');
    freshnessEl.className = 'freshness-indicator';
    freshnessEl.style.backgroundColor = color + '1a';
    freshnessEl.style.color = color;
    const dot = document.createElement('span');
    dot.style.cssText = `display:inline-block;width:8px;height:8px;border-radius:50%;background:${color}`;
    freshnessEl.appendChild(dot);
    freshnessEl.appendChild(document.createTextNode(getFreshnessLabel(dateInfo.date)));

    card.appendChild(labelEl);
    card.appendChild(valueEl);
    card.appendChild(relEl);
    card.appendChild(freshnessEl);
    card.appendChild(sourceEl);

    return card;
  }

  function showResults(data) {
    const loading = document.getElementById('loading');
    const noDate = document.getElementById('no-date');
    const results = document.getElementById('results');

    loading.style.display = 'none';

    if (!data.published && !data.modified) {
      noDate.style.display = 'block';
      if (!data.isArticle) {
        document.getElementById('no-date-text').textContent = i18n('notAnArticle');
      }
      return;
    }

    results.style.display = 'block';
    const primaryDates = document.getElementById('primary-dates');

    if (data.published) {
      primaryDates.appendChild(createDateCard(i18n('publishedDate'), data.published));
    }
    if (data.modified) {
      primaryDates.appendChild(createDateCard(i18n('modifiedDate'), data.modified));
    }

    // Show all detection sources
    if (data.allResults && data.allResults.length > 0) {
      const sourcesSection = document.getElementById('all-sources');
      const sourceList = document.getElementById('source-list');

      // Deduplicate display
      const seen = new Set();
      for (const r of data.allResults) {
        const key = `${r.type}-${r.source}-${r.date}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const li = document.createElement('li');
        li.className = 'source-item';

        const typeSpan = document.createElement('span');
        typeSpan.className = 'source-item-type';
        typeSpan.textContent = r.type === 'published' ? i18n('publishedDate') : i18n('modifiedDate');

        const methodSpan = document.createElement('span');
        methodSpan.className = 'source-item-method';
        methodSpan.textContent = r.source;

        li.appendChild(typeSpan);
        li.appendChild(methodSpan);
        sourceList.appendChild(li);
      }

      if (sourceList.children.length > 0) {
        sourcesSection.style.display = 'block';
      }
    }

    // Scroll button
    const scrollBtn = document.getElementById('scroll-btn');
    scrollBtn.style.display = 'flex';
    scrollBtn.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'scrollToDate' });
          window.close();
        }
      });
    });
  }

  function setupSiteToggle(tab) {
    if (!tab || !tab.url) return;

    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;

      chrome.runtime.sendMessage(
        { action: 'getSiteStatus', hostname },
        (response) => {
          if (chrome.runtime.lastError) return;
          const checkbox = document.getElementById('site-enabled');
          checkbox.checked = !response.isDisabled;

          checkbox.addEventListener('change', () => {
            chrome.runtime.sendMessage(
              { action: 'toggleSite', hostname },
              () => {
                // Reload the tab to apply changes
                chrome.tabs.reload(tab.id);
                window.close();
              }
            );
          });
        }
      );
    } catch {}
  }

  // Init
  applyI18n();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    const tab = tabs[0];
    setupSiteToggle(tab);

    chrome.tabs.sendMessage(tab.id, { action: 'getDateInfo' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('no-date').style.display = 'block';
        return;
      }
      showResults(response);
    });
  });
})();
