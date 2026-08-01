function clean(text?: string | null): string {
  return (text ?? '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
}

export function getLabel(element: HTMLElement): string {
  // 1. label[for]
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);

    if (label?.textContent) {
      return clean(label.textContent);
    }
  }

  // 2. Parent label
  const parentLabel = element.closest('label');

  if (parentLabel?.textContent) {
    return clean(parentLabel.textContent);
  }

  // 3. aria-label
  const aria = element.getAttribute('aria-label');

  if (aria) {
    return clean(aria);
  }

  // 4. aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');

  if (labelledBy) {
    const ids = labelledBy.split(' ');

    const text = ids
      .map((id) => document.getElementById(id)?.textContent)
      .filter(Boolean)
      .join(' ');

    if (text) {
      return clean(text);
    }
  }

  // 5. placeholder
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    if (element.placeholder) {
      return clean(element.placeholder);
    }
  }

  // 6. title
  const title = element.getAttribute('title');

  if (title) {
    return clean(title);
  }

  // 7. nearest previous sibling text
  let prev = element.previousElementSibling;

  while (prev) {
    const txt = clean(prev.textContent);

    if (txt.length > 0) {
      return txt;
    }

    prev = prev.previousElementSibling;
  }

  // 8. name

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    if (element.name) {
      return clean(element.name);
    }
  }

  // 9. id

  if (element.id) {
    return clean(element.id);
  }

  return 'Unknown Field';
}
