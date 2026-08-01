export function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);

  if (style.display === 'none') return false;

  if (style.visibility === 'hidden') return false;

  if (style.opacity === '0') return false;

  if (element.hasAttribute('hidden')) return false;

  const rect = element.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    return false;
  }

  return true;
}
