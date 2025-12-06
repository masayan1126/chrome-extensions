// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-whiteboard') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await toggleWhiteboard(tab.id);
    }
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'toggleFromPopup' && message.tabId) {
    toggleWhiteboard(message.tabId).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: String(error) });
    });
    return true; // Keep channel open for async response
  }
  if (message.action === 'getState') {
    sendResponse({ success: true });
  }
  return true;
});

// Toggle whiteboard on a tab
async function toggleWhiteboard(tabId: number): Promise<void> {
  try {
    // Try to send message to existing content script
    await chrome.tabs.sendMessage(tabId, { action: 'toggle' });
  } catch (_error) {
    // Content script not loaded - this is expected for pages opened before extension install
    // The content script should be auto-injected by manifest content_scripts
    // If not, we need to reload the page or inject manually
    console.log('Content script not responding. Page may need refresh.');

    // Try to inject the CSS at least
    try {
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['src/content/styles.css'],
      });
    } catch (cssError) {
      console.log('Could not inject CSS:', cssError);
    }
  }
}
