/**
 * Resolve a human-readable label for a form control.
 */
export function resolveLabel(element: Element): string | undefined {
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  if (ariaLabel) {
    return ariaLabel;
  }

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean)
      .join(' ')
      .trim();
    if (text) {
      return text;
    }
  }

  if (element instanceof HTMLElement && element.id) {
    const explicit = document.querySelector(`label[for="${escapeAttr(element.id)}"]`);
    const explicitText = explicit?.textContent?.trim();
    if (explicitText) {
      return explicitText;
    }
  }

  const wrapping = element.closest('label');
  if (wrapping) {
    const clone = wrapping.cloneNode(true) as HTMLLabelElement;
    clone.querySelectorAll('input, select, textarea, button').forEach((node) => node.remove());
    const wrappingText = clone.textContent?.trim();
    if (wrappingText) {
      return wrappingText;
    }
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const placeholder = element.placeholder?.trim();
    if (placeholder) {
      return placeholder;
    }
  }

  if (element instanceof HTMLElement) {
    const title = element.title?.trim();
    if (title) {
      return title;
    }
  }

  if (element instanceof HTMLButtonElement) {
    const buttonText = element.textContent?.trim();
    if (buttonText) {
      return buttonText;
    }
  }

  const name = element.getAttribute('name')?.trim();
  if (name) {
    return name;
  }

  return undefined;
}

function escapeAttr(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
