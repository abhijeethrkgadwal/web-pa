export function createSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const path: string[] = [];

  let current: HTMLElement | null = element;

  while (current && current.tagName.toLowerCase() !== 'body') {
    let selector = current.tagName.toLowerCase();

    if (current.classList.length > 0) {
      selector +=
        '.' + [...current.classList].slice(0, 2).map(CSS.escape).join('.');
    }

    const parent = current.parentElement;

    if (parent) {
      const siblings = [...parent.children].filter(
        (c) => c.tagName === current.tagName,
      );

      if (siblings.length > 1) {
        selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
    }

    path.unshift(selector);

    current = parent;
  }

  return path.join(' > ');
}
