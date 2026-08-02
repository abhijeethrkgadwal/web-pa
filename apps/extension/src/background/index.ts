console.info('[Browser AI] background service worker ready');

chrome.runtime.onInstalled.addListener(() => {
  console.info('[Browser AI] extension installed');
});

void chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: false })
  .catch((error: unknown) => {
    console.warn('[Browser AI] side panel behavior not set', error);
  });
