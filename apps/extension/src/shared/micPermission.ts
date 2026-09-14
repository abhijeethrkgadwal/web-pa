/**
 * Open the extension page where Chrome can show a real mic permission prompt.
 * Side panel prompts are often auto-dismissed ("Permission dismissed").
 */
export function openMicrophonePermissionPage(): void {
  const url = chrome.runtime.getURL('src/mic-permission/index.html');
  void chrome.tabs.create({ url });
}

export function isMicPermissionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const name = 'name' in error ? String((error as { name?: string }).name) : '';

  return (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    message.includes('permission dismissed') ||
    message.includes('permission denied') ||
    message.includes('notallowederror') ||
    message.includes('access denied')
  );
}

export function micPermissionHelpMessage(): string {
  return 'Microphone permission was dismissed. A tab was opened — click “Allow microphone”, then return here and press Mic again.';
}
