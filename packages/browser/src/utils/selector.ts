/**
 * Build a stable CSS selector for a DOM element.
 */
export function buildSelector(element: Element): string {
  if (element instanceof HTMLElement && element.id) {
    const idSelector = `#${cssEscape(element.id)}`;
    if (isUnique(idSelector)) {
      return idSelector;
    }
  }

  const testId = element.getAttribute('data-testid')?.trim();
  if (testId) {
    const testSelector = `[data-testid="${escapeAttr(testId)}"]`;
    if (isUnique(testSelector)) {
      return testSelector;
    }
  }

  const name = element.getAttribute('name')?.trim();
  if (name) {
    const tag = element.tagName.toLowerCase();
    const nameSelector = `${tag}[name="${escapeAttr(name)}"]`;
    if (isUnique(nameSelector)) {
      return nameSelector;
    }
  }

  return buildCssPath(element);
}

function buildCssPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.documentElement) {
    if (current instanceof HTMLElement && current.id) {
      parts.unshift(`#${cssEscape(current.id)}`);
      break;
    }

    const tag = current.tagName.toLowerCase();
    const parentElement: Element | null = current.parentElement;

    if (!parentElement) {
      parts.unshift(tag);
      break;
    }

    const siblings = Array.from(parentElement.children).filter(
      (child: Element) => child.tagName === current!.tagName,
    );

    if (siblings.length === 1) {
      parts.unshift(tag);
    } else {
      const index = siblings.indexOf(current) + 1;
      parts.unshift(`${tag}:nth-of-type(${index})`);
    }

    current = parentElement;
  }

  return parts.join(' > ');
}

function isUnique(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
}

function escapeAttr(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
