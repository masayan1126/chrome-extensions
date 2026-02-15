// Article Date Detector - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ disabledSites: [] }, (data) => {
    if (!data.disabledSites) {
      chrome.storage.sync.set({ disabledSites: [] });
    }
  });
});

// Listen for date detection results from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'dateDetected' && sender.tab) {
    const tabId = sender.tab.id;
    if (message.data) {
      // Set badge with freshness color and short time
      chrome.action.setBadgeText({ tabId, text: message.data.text });
      chrome.action.setBadgeBackgroundColor({ tabId, color: message.data.color });
      chrome.action.setBadgeTextColor({ tabId, color: '#ffffff' });
    } else {
      // Clear badge for non-article pages
      chrome.action.setBadgeText({ tabId, text: '' });
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'toggleSite') {
    const hostname = message.hostname;
    chrome.storage.sync.get({ disabledSites: [] }, (data) => {
      const sites = data.disabledSites;
      const index = sites.indexOf(hostname);
      if (index === -1) {
        sites.push(hostname);
      } else {
        sites.splice(index, 1);
      }
      chrome.storage.sync.set({ disabledSites: sites }, () => {
        sendResponse({ disabledSites: sites });
      });
    });
    return true;
  }

  if (message.action === 'getSiteStatus') {
    chrome.storage.sync.get({ disabledSites: [] }, (data) => {
      sendResponse({
        isDisabled: data.disabledSites.includes(message.hostname)
      });
    });
    return true;
  }
});
