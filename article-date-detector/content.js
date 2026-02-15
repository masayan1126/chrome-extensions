(function () {
  'use strict';

  if (window.__articleDateDetectorLoaded) return;
  window.__articleDateDetectorLoaded = true;

  const PREFIX = 'article-date-detector-';
  const FRESHNESS = {
    NEW: { color: '#22c55e', maxMonths: 1 },
    MEDIUM: { color: '#eab308', maxMonths: 6 },
    OLD: { color: '#f97316', maxMonths: 12 },
    VERY_OLD: { color: '#ef4444', maxMonths: Infinity }
  };
  const AUTO_COLLAPSE_MS = 5000;

  let badgeElement = null;
  let detectedData = null;

  // ---- i18n helper ----
  function i18n(key, substitutions) {
    try {
      return chrome.i18n.getMessage(key, substitutions) || key;
    } catch {
      return key;
    }
  }

  // ---- Date parsing ----
  function parseDate(str) {
    if (!str || typeof str !== 'string') return null;
    str = str.trim();

    // ISO 8601
    const isoMatch = str.match(/^\d{4}-\d{2}-\d{2}(T[\d:.]+)?(Z|[+-]\d{2}:?\d{2})?$/);
    if (isoMatch) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d;
    }

    // Japanese format: 2024年1月15日
    const jaMatch = str.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (jaMatch) {
      const d = new Date(parseInt(jaMatch[1]), parseInt(jaMatch[2]) - 1, parseInt(jaMatch[3]));
      if (!isNaN(d.getTime())) return d;
    }

    // Common formats: "Jan 15, 2024", "15 Jan 2024", "January 15, 2024"
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      // Guard against very old/future dates from random strings
      const year = d.getFullYear();
      if (year >= 1990 && year <= new Date().getFullYear() + 1) return d;
    }

    // Numeric formats: "2024/01/15", "01/15/2024", "15.01.2024"
    const numMatch = str.match(/(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
    if (numMatch) {
      const d2 = new Date(parseInt(numMatch[1]), parseInt(numMatch[2]) - 1, parseInt(numMatch[3]));
      if (!isNaN(d2.getTime())) return d2;
    }

    return null;
  }

  // ---- Relative time ----
  function getRelativeTime(date) {
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

  function getShortRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 0) return '0m';

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    const months = Math.floor(days / 30.44);
    const years = Math.floor(days / 365.25);

    if (minutes < 60) return minutes + 'm';
    if (hours < 24) return hours + 'h';
    if (days < 31) return days + 'd';
    if (months < 12) return months + 'mo';
    return years + 'y';
  }

  // ---- Freshness ----
  function getFreshnessLevel(date) {
    const now = new Date();
    const months = (now - date) / (1000 * 60 * 60 * 24 * 30.44);
    if (months <= FRESHNESS.NEW.maxMonths) return FRESHNESS.NEW;
    if (months <= FRESHNESS.MEDIUM.maxMonths) return FRESHNESS.MEDIUM;
    if (months <= FRESHNESS.OLD.maxMonths) return FRESHNESS.OLD;
    return FRESHNESS.VERY_OLD;
  }

  // ---- Article page detection ----
  function isArticlePage() {
    // Check for article-like elements
    if (document.querySelector('article, [role="article"]')) return true;
    // Check for structured data that indicates an article
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of ldScripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const type = item['@type'];
          if (['Article', 'NewsArticle', 'BlogPosting', 'TechArticle', 'ScholarlyArticle', 'WebPage', 'Report'].includes(type)) {
            return true;
          }
          if (item['@graph']) {
            for (const g of item['@graph']) {
              if (['Article', 'NewsArticle', 'BlogPosting', 'TechArticle', 'ScholarlyArticle', 'WebPage', 'Report'].includes(g['@type'])) {
                return true;
              }
            }
          }
        }
      } catch {}
    }
    // Check for Open Graph article type
    if (document.querySelector('meta[property="og:type"][content="article"]')) return true;
    // Check for common article meta tags
    if (document.querySelector('meta[property="article:published_time"], meta[name="datePublished"], meta[name="publish_date"]')) return true;
    // Check for time elements with datetime
    if (document.querySelector('time[datetime]')) return true;
    // Check for common blog/article class patterns
    if (document.querySelector('.post-content, .article-content, .entry-content, .blog-post, .post-body, .hentry')) return true;

    return false;
  }

  // ---- Date detection engine ----
  function detectFromJsonLd() {
    const results = [];
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          extractJsonLdDates(item, results);
          if (item['@graph']) {
            for (const g of item['@graph']) {
              extractJsonLdDates(g, results);
            }
          }
        }
      } catch {}
    }
    return results;
  }

  function extractJsonLdDates(item, results) {
    const articleTypes = ['Article', 'NewsArticle', 'BlogPosting', 'TechArticle', 'ScholarlyArticle', 'WebPage', 'Report', 'SocialMediaPosting'];
    const type = item['@type'];
    if (!type || (!articleTypes.includes(type) && !articleTypes.some(t => Array.isArray(type) && type.includes(t)))) return;

    if (item.datePublished) {
      const d = parseDate(item.datePublished);
      if (d) results.push({ type: 'published', date: d, source: 'JSON-LD', raw: item.datePublished });
    }
    if (item.dateModified) {
      const d = parseDate(item.dateModified);
      if (d) results.push({ type: 'modified', date: d, source: 'JSON-LD', raw: item.dateModified });
    }
    if (item.dateCreated) {
      const d = parseDate(item.dateCreated);
      if (d) results.push({ type: 'published', date: d, source: 'JSON-LD', raw: item.dateCreated });
    }
  }

  function detectFromOpenGraph() {
    const results = [];
    const published = document.querySelector('meta[property="article:published_time"]');
    if (published) {
      const d = parseDate(published.getAttribute('content'));
      if (d) results.push({ type: 'published', date: d, source: 'Open Graph', raw: published.getAttribute('content') });
    }
    const modified = document.querySelector('meta[property="article:modified_time"]');
    if (modified) {
      const d = parseDate(modified.getAttribute('content'));
      if (d) results.push({ type: 'modified', date: d, source: 'Open Graph', raw: modified.getAttribute('content') });
    }
    return results;
  }

  function detectFromMetaTags() {
    const results = [];
    const publishedSelectors = [
      'meta[name="datePublished"]',
      'meta[name="publish_date"]',
      'meta[name="date"]',
      'meta[name="DC.date.issued"]',
      'meta[name="DC.date.created"]',
      'meta[name="dcterms.created"]',
      'meta[name="sailthru.date"]',
      'meta[name="article.published"]',
      'meta[name="parsely-pub-date"]',
      'meta[name="cXenseParse:recs:publishtime"]',
      'meta[property="datePublished"]',
      'meta[itemprop="datePublished"]'
    ];
    const modifiedSelectors = [
      'meta[name="dateModified"]',
      'meta[name="last-modified"]',
      'meta[name="DC.date.modified"]',
      'meta[name="dcterms.modified"]',
      'meta[name="article.updated"]',
      'meta[property="dateModified"]',
      'meta[itemprop="dateModified"]'
    ];

    for (const sel of publishedSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const d = parseDate(el.getAttribute('content'));
        if (d) {
          results.push({ type: 'published', date: d, source: 'Meta Tag', raw: el.getAttribute('content'), selector: sel });
          break;
        }
      }
    }

    for (const sel of modifiedSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const d = parseDate(el.getAttribute('content'));
        if (d) {
          results.push({ type: 'modified', date: d, source: 'Meta Tag', raw: el.getAttribute('content'), selector: sel });
          break;
        }
      }
    }
    return results;
  }

  function detectFromTimeElements() {
    const results = [];
    const timeEls = document.querySelectorAll('time[datetime]');

    for (const el of timeEls) {
      const dt = el.getAttribute('datetime');
      const d = parseDate(dt);
      if (!d) continue;

      // Determine type from context
      let type = 'published';
      const parent = el.closest('[class], [itemprop]');
      const classStr = (el.className + ' ' + (parent ? parent.className : '')).toLowerCase();
      const itemprop = el.getAttribute('itemprop') || (parent ? parent.getAttribute('itemprop') : '') || '';

      if (itemprop.toLowerCase().includes('modified') || itemprop.toLowerCase().includes('updated') ||
          classStr.includes('modif') || classStr.includes('updat')) {
        type = 'modified';
      }

      results.push({ type, date: d, source: 'time element', raw: dt, element: el });
    }
    return results;
  }

  function detectFromMicrodata() {
    const results = [];
    const publishedEl = document.querySelector('[itemprop="datePublished"]:not(meta):not(time)');
    if (publishedEl) {
      const content = publishedEl.getAttribute('content') || publishedEl.getAttribute('datetime') || publishedEl.textContent;
      const d = parseDate(content);
      if (d) results.push({ type: 'published', date: d, source: 'Microdata', raw: content, element: publishedEl });
    }
    const modifiedEl = document.querySelector('[itemprop="dateModified"]:not(meta):not(time)');
    if (modifiedEl) {
      const content = modifiedEl.getAttribute('content') || modifiedEl.getAttribute('datetime') || modifiedEl.textContent;
      const d = parseDate(content);
      if (d) results.push({ type: 'modified', date: d, source: 'Microdata', raw: content, element: modifiedEl });
    }
    return results;
  }

  function detectFromCssHeuristics() {
    const results = [];
    const publishedClassPatterns = [
      '.published-date', '.publish-date', '.post-date', '.entry-date',
      '.article-date', '.date-published', '.blog-date', '.story-date',
      '.byline-date', '.posted-on', '.post-meta time', '.meta-date',
      '.article__date', '.post__date', '.entry-meta time',
      '[class*="publish"][class*="date"]',
      '[class*="post"][class*="date"]',
      '[class*="article"][class*="date"]'
    ];
    const modifiedClassPatterns = [
      '.updated-date', '.modified-date', '.last-updated',
      '[class*="update"][class*="date"]',
      '[class*="modif"][class*="date"]'
    ];

    for (const sel of publishedClassPatterns) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent.trim();
          const d = parseDate(text);
          if (d) {
            results.push({ type: 'published', date: d, source: 'CSS heuristic', raw: text, element: el, selector: sel });
            break;
          }
        }
      } catch {}
    }

    for (const sel of modifiedClassPatterns) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent.trim();
          const d = parseDate(text);
          if (d) {
            results.push({ type: 'modified', date: d, source: 'CSS heuristic', raw: text, element: el, selector: sel });
            break;
          }
        }
      } catch {}
    }
    return results;
  }

  function detectDates() {
    const allResults = [];
    const detectors = [
      detectFromJsonLd,
      detectFromOpenGraph,
      detectFromMetaTags,
      detectFromTimeElements,
      detectFromMicrodata,
      detectFromCssHeuristics
    ];

    for (const detect of detectors) {
      try {
        const results = detect();
        allResults.push(...results);
      } catch {}
    }

    // Deduplicate: keep highest priority source for each type
    const published = [];
    const modified = [];
    for (const r of allResults) {
      if (r.type === 'published') published.push(r);
      else modified.push(r);
    }

    return {
      published: published[0] || null,
      modified: modified[0] || null,
      allResults
    };
  }

  // ---- Format date ----
  const TZ_OFFSET_TO_ABBR = {
    540: 'JST', 480: 'CST', 330: 'IST', 60: 'CET', 0: 'UTC',
    '-300': 'EST', '-360': 'CST', '-420': 'MST', '-480': 'PST'
  };

  function getLocalTzAbbr() {
    // Try IANA timezone name first (e.g. "Asia/Tokyo" → "JST")
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date());
      const name = parts.find(p => p.type === 'timeZoneName')?.value;
      // If we got a clean abbreviation (not "GMT+X"), use it
      if (name && !name.startsWith('GMT')) return name;
    } catch {}
    // Fallback: map UTC offset to known abbreviation
    const offset = new Date().getTimezoneOffset() * -1;
    if (TZ_OFFSET_TO_ABBR[offset]) return TZ_OFFSET_TO_ABBR[offset];
    // Last resort: show as UTC±N
    const sign = offset >= 0 ? '+' : '';
    const hours = offset / 60;
    return `UTC${sign}${hours}`;
  }

  const localTzAbbr = getLocalTzAbbr();

  function formatDateUTC(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDateLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDate(date) {
    const utc = formatDateUTC(date);
    const local = formatDateLocal(date);
    if (utc === local) {
      return utc;
    }
    return `${local} (${localTzAbbr}) / ${utc} (UTC)`;
  }

  // ---- Floating badge UI ----
  function createBadge(data) {
    if (badgeElement) badgeElement.remove();

    const primaryDate = data.published || data.modified;
    if (!primaryDate) return;

    const freshness = getFreshnessLevel(primaryDate.date);
    const container = document.createElement('div');
    container.id = PREFIX + 'badge';
    container.className = PREFIX + 'container';

    // Expanded content
    const expanded = document.createElement('div');
    expanded.className = PREFIX + 'expanded';

    // Header row
    const header = document.createElement('div');
    header.className = PREFIX + 'header';

    const dot = document.createElement('span');
    dot.className = PREFIX + 'dot';
    dot.style.backgroundColor = freshness.color;
    header.appendChild(dot);

    const info = document.createElement('div');
    info.className = PREFIX + 'info';

    if (data.published) {
      const pubLine = document.createElement('div');
      pubLine.className = PREFIX + 'date-line';
      pubLine.textContent = `${i18n('publishedDate')}: ${formatDate(data.published.date)} (${getRelativeTime(data.published.date)})`;
      info.appendChild(pubLine);
    }
    if (data.modified) {
      const modLine = document.createElement('div');
      modLine.className = PREFIX + 'date-line ' + PREFIX + 'modified';
      modLine.textContent = `${i18n('modifiedDate')}: ${formatDate(data.modified.date)} (${getRelativeTime(data.modified.date)})`;
      info.appendChild(modLine);
    }

    header.appendChild(info);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = PREFIX + 'actions';

    // Scroll to date element button
    const scrollTarget = data.published?.element || data.modified?.element;
    if (scrollTarget) {
      const scrollBtn = document.createElement('button');
      scrollBtn.className = PREFIX + 'btn';
      scrollBtn.textContent = '\u2197';
      scrollBtn.title = i18n('scrollToDate');
      scrollBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        scrollTarget.style.outline = '2px solid ' + freshness.color;
        setTimeout(() => { scrollTarget.style.outline = ''; }, 3000);
      });
      actions.appendChild(scrollBtn);
    }

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = PREFIX + 'btn';
    closeBtn.textContent = '\u00d7';
    closeBtn.title = i18n('closeBadge');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      container.remove();
      badgeElement = null;
    });
    actions.appendChild(closeBtn);

    header.appendChild(actions);
    expanded.appendChild(header);

    // Collapsed content
    const collapsed = document.createElement('div');
    collapsed.className = PREFIX + 'collapsed';

    const colDot = document.createElement('span');
    colDot.className = PREFIX + 'dot';
    colDot.style.backgroundColor = freshness.color;
    collapsed.appendChild(colDot);

    const colTime = document.createElement('span');
    colTime.className = PREFIX + 'col-time';
    colTime.textContent = getShortRelativeTime(primaryDate.date);
    collapsed.appendChild(colTime);

    container.appendChild(expanded);
    container.appendChild(collapsed);

    // Expand/collapse interaction
    let isExpanded = true;
    let autoCollapseTimer = null;

    function setExpanded(val) {
      isExpanded = val;
      expanded.style.display = val ? 'flex' : 'none';
      collapsed.style.display = val ? 'none' : 'flex';
      container.classList.toggle(PREFIX + 'is-collapsed', !val);
    }

    collapsed.addEventListener('click', () => {
      setExpanded(true);
      clearTimeout(autoCollapseTimer);
      autoCollapseTimer = setTimeout(() => setExpanded(false), AUTO_COLLAPSE_MS);
    });

    container.addEventListener('mouseenter', () => {
      if (!isExpanded) {
        setExpanded(true);
      }
      clearTimeout(autoCollapseTimer);
    });

    container.addEventListener('mouseleave', () => {
      autoCollapseTimer = setTimeout(() => setExpanded(false), 1500);
    });

    // Auto-collapse after initial display
    setExpanded(true);
    autoCollapseTimer = setTimeout(() => setExpanded(false), AUTO_COLLAPSE_MS);

    // Set freshness color as border
    container.style.setProperty('--' + PREFIX + 'color', freshness.color);

    document.body.appendChild(container);
    badgeElement = container;
  }

  // ---- Communication with background/popup ----
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'getDateInfo') {
        sendResponse(detectedData ? {
          published: detectedData.published ? {
            date: detectedData.published.date.toISOString(),
            source: detectedData.published.source,
            raw: detectedData.published.raw
          } : null,
          modified: detectedData.modified ? {
            date: detectedData.modified.date.toISOString(),
            source: detectedData.modified.source,
            raw: detectedData.modified.raw
          } : null,
          allResults: detectedData.allResults.map(r => ({
            type: r.type,
            date: r.date.toISOString(),
            source: r.source,
            raw: r.raw
          })),
          isArticle: true
        } : { published: null, modified: null, allResults: [], isArticle: isArticlePage() });
        return true;
      }
      if (message.action === 'scrollToDate') {
        const target = detectedData?.published?.element || detectedData?.modified?.element;
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const color = getFreshnessLevel((detectedData.published || detectedData.modified).date).color;
          target.style.outline = '2px solid ' + color;
          setTimeout(() => { target.style.outline = ''; }, 3000);
        }
        sendResponse({ success: !!target });
        return true;
      }
    });
  }

  // ---- Notify background of detected dates ----
  function notifyBackground(data) {
    const primary = data.published || data.modified;
    if (!primary) {
      chrome.runtime.sendMessage({ action: 'dateDetected', data: null }).catch(() => {});
      return;
    }
    const freshness = getFreshnessLevel(primary.date);
    const shortTime = getShortRelativeTime(primary.date);
    chrome.runtime.sendMessage({
      action: 'dateDetected',
      data: {
        color: freshness.color,
        text: shortTime
      }
    }).catch(() => {});
  }

  // ---- Initialization ----
  function init() {
    // Check if disabled for this site
    const hostname = window.location.hostname;
    chrome.storage.sync.get({ disabledSites: [] }, (settings) => {
      if (settings.disabledSites.includes(hostname)) return;

      if (!isArticlePage()) {
        chrome.runtime.sendMessage({ action: 'dateDetected', data: null }).catch(() => {});
        return;
      }

      detectedData = detectDates();
      notifyBackground(detectedData);

      if (detectedData.published || detectedData.modified) {
        createBadge(detectedData);
      }
    });
  }

  setupMessageListener();

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
