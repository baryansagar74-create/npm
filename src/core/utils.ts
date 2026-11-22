/**
 * Utility functions for AuraFX
 */

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia === 'function') {
    const coarse = window.matchMedia('(pointer: coarse)');
    const fine = window.matchMedia('(pointer: fine)');
    return Boolean(coarse?.matches && !fine?.matches);
  }
  return false;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  const res = window.matchMedia('(prefers-reduced-motion: reduce)');
  return Boolean(res?.matches);
}

export function safeQueryAll<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document
): T[] {
  try {
    return Array.from(root.querySelectorAll<T>(selector));
  } catch (e) {
    console.warn(`[AuraFX] Invalid selector "${selector}":`, e);
    return [];
  }
}

export function injectCSS(css: string, id: string = 'aurafx-injected-styles'): HTMLStyleElement | null {
  if (typeof document === 'undefined') return null;
  const existing = document.getElementById(id) as HTMLStyleElement | null;
  if (existing) {
    existing.textContent = css;
    return existing;
  }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

export function removeCSS(id: string = 'aurafx-injected-styles'): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(id);
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }
}

export function hexToRgba(hex: string, alpha: number = 1): string {
  if (!hex || typeof hex !== 'string') return `rgba(139, 92, 246, ${alpha})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const clean = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getNumericAttribute(
  el: Element,
  attr: string,
  fallback: number
): number {
  const val = el.getAttribute(attr);
  if (val === null || val.trim() === '') return fallback;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}

export function getStringAttribute(
  el: Element,
  attr: string,
  fallback: string
): string {
  const val = el.getAttribute(attr);
  return val !== null && val.trim() !== '' ? val.trim() : fallback;
}
