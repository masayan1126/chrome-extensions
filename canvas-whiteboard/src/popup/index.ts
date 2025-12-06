function initI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const message = chrome.i18n.getMessage(key);
      if (message) {
        el.textContent = message;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initI18n();

  const toggleBtn = document.getElementById('toggleBtn');
  toggleBtn?.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url) {
        // Check if it's a valid URL (not chrome://, etc.)
        if (
          tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('about:')
        ) {
          alert('Cannot run on this page. Please try on a regular website.');
          window.close();
          return;
        }

        // Send message to content script
        chrome.tabs.sendMessage(tab.id, { action: 'toggle' }, (response) => {
          if (chrome.runtime.lastError) {
            // Content script not loaded - ask user to refresh
            alert('Please refresh the page and try again.');
          }
          window.close();
        });
      }
    } catch (error) {
      console.error('Error toggling whiteboard:', error);
      window.close();
    }
  });
});
