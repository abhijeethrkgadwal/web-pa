import type { BrowserActionResult } from '@browser-ai/contracts';

import { fail, ok } from './dom';

export interface SubmitCandidate {
  readonly selector: string;
  readonly label: string;
}

/**
 * Find a likely submit / continue / next button (never auto-clicked by callers).
 */
export function findSubmitCandidate(): SubmitCandidate | null {
  const candidates = [
    ...Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a[role="button"]')),
  ];

  const scored = candidates
    .map((element) => {
      if (!(element instanceof HTMLElement)) {
        return null;
      }
      if (!isVisible(element)) {
        return null;
      }
      const label = getLabel(element);
      const score = scoreSubmitLabel(label, element);
      if (score <= 0) {
        return null;
      }
      return {
        selector: cssPath(element),
        label: label || 'Submit',
        score,
      };
    })
    .filter((item): item is { selector: string; label: string; score: number } => Boolean(item))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  return best ? { selector: best.selector, label: best.label } : null;
}

export async function clickSubmitCandidate(
  selector?: string,
): Promise<BrowserActionResult & { readonly label?: string }> {
  const candidate = selector
    ? { selector, label: 'Submit' }
    : findSubmitCandidate();
  if (!candidate) {
    return fail('No submit/continue button found on this page');
  }

  const element = document.querySelector(candidate.selector);
  if (!(element instanceof HTMLElement)) {
    return fail(`Submit control not found: ${candidate.selector}`);
  }

  element.click();
  return { ...ok(), label: candidate.label };
}

function getLabel(element: HTMLElement): string {
  if (element instanceof HTMLInputElement) {
    return (element.value || element.getAttribute('aria-label') || '').trim();
  }
  return (element.innerText || element.getAttribute('aria-label') || '').trim();
}

function scoreSubmitLabel(label: string, element: HTMLElement): number {
  const text = label.toLowerCase();
  const type =
    element instanceof HTMLInputElement || element instanceof HTMLButtonElement
      ? element.type
      : '';

  if (type === 'submit') {
    return 100 + (text ? 10 : 0);
  }

  if (
    /\b(submit|apply|send|continue|next|save and continue|review and submit|confirm)\b/i.test(
      text,
    )
  ) {
    return 90;
  }

  if (/\b(save|done|finish)\b/i.test(text)) {
    return 60;
  }

  return 0;
}

function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function cssPath(element: Element): string {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 5) {
    let part = current.tagName.toLowerCase();
    const parentEl: Element | null = current.parentElement;
    if (parentEl) {
      const siblings = Array.from(parentEl.children).filter(
        (child): child is Element => child.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        part += `:nth-of-type(${index})`;
      }
    }
    parts.unshift(part);
    current = parentEl;
    if (current?.id) {
      parts.unshift(`#${CSS.escape(current.id)}`);
      break;
    }
  }
  return parts.join(' > ');
}
