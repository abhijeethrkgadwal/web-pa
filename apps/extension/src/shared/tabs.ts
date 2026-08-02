export async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    throw new Error('No active tab found');
  }

  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    throw new Error('Open a normal webpage (http/https/file), then try again');
  }

  return tab;
}

export async function injectContentScript(tabId: number): Promise<void> {
  const manifest = chrome.runtime.getManifest();
  const files = manifest.content_scripts?.[0]?.js;

  if (!files?.length) {
    throw new Error('Content script is missing from the extension manifest');
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files,
  });
}

export function formatConnectionError(tabUrl: string | undefined, error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const isMissingReceiver =
    /Receiving end does not exist/i.test(raw) || /Could not establish connection/i.test(raw);

  if (!isMissingReceiver) {
    return raw;
  }

  if (tabUrl?.startsWith('file://')) {
    return [
      'Content script is not running on this local file.',
      '1) chrome://extensions → Browser AI → enable “Allow access to file URLs”',
      '2) Reload the extension',
      '3) Refresh this page, then try again',
      'Or open the fixture over http: pnpm serve:fixtures → http://localhost:4173/job-application.html',
    ].join('\n');
  }

  return [
    'Content script is not running on this page.',
    'Reload the extension, refresh the page, then try again.',
  ].join('\n');
}

export async function sendToActiveTab<T>(
  payload: Record<string, unknown>,
): Promise<T> {
  const tab = await getActiveTab();
  const tabId = tab.id!;

  try {
    return (await chrome.tabs.sendMessage(tabId, payload)) as T;
  } catch {
    try {
      await injectContentScript(tabId);
      return (await chrome.tabs.sendMessage(tabId, payload)) as T;
    } catch (retryError) {
      throw new Error(formatConnectionError(tab.url, retryError));
    }
  }
}
