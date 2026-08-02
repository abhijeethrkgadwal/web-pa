/**
 * Determine whether an element is visible to the user.
 */
export function isVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element instanceof HTMLInputElement && element.type === 'hidden') {
    return false;
  }

  let current: HTMLElement | null = element;

  while (current) {
    if (current.hidden || current.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    const style = getComputedStyleSafe(current);
    if (style) {
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
    } else if (isInlineHidden(current)) {
      return false;
    }

    current = current.parentElement;
  }

  if (element.getClientRects().length === 0) {
    // jsdom often reports empty client rects; fall back to computed/inline checks only.
    if (typeof window !== 'undefined' && window.navigator?.userAgent?.includes('jsdom')) {
      return true;
    }
    return false;
  }

  return true;
}

function isInlineHidden(element: HTMLElement): boolean {
  const inline = element.getAttribute('style') ?? '';
  return /display\s*:\s*none/i.test(inline) || /visibility\s*:\s*hidden/i.test(inline);
}

function getComputedStyleSafe(element: Element): CSSStyleDeclaration | null {
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return null;
  }

  try {
    return window.getComputedStyle(element);
  } catch {
    return null;
  }
}
