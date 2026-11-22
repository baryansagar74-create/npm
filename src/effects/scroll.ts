import type { AuraScrollOptions, EffectModule, ScrollRevealEffect } from '../types';
import { safeQueryAll, getNumericAttribute, getStringAttribute, prefersReducedMotion } from '../core/utils';

export class AuraScrollEffect implements EffectModule {
  public readonly name = 'scroll' as const;
  private options: Required<AuraScrollOptions>;
  private enabled: boolean;
  private initialized: boolean = false;
  private observer: IntersectionObserver | null = null;
  private observedElements = new Set<HTMLElement>();

  constructor(options: Required<AuraScrollOptions>) {
    this.options = { ...options };
    this.enabled = this.options.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;

    if (!('IntersectionObserver' in window)) {
      // Apply attributes and reveal everything immediately if IntersectionObserver is unsupported
      this.applyAllStyles();
      this.revealAll();
      this.initialized = true;
      return;
    }

    this.createObserver();
    this.observeAll();
    this.initialized = true;
  }

  private createObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (!this.enabled) return;

        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          const onceAttr = el.getAttribute('data-aura-once');
          const isOnce = onceAttr !== null ? onceAttr !== 'false' : this.options.once;

          if (entry.isIntersecting) {
            el.classList.add('aura-revealed');
            if (isOnce && this.observer) {
              this.observer.unobserve(el);
              this.observedElements.delete(el);
            }
          } else if (!isOnce) {
            el.classList.remove('aura-revealed');
          }
        });
      },
      {
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin
      }
    );
  }

  public refresh(): void {
    if (!this.initialized) {
      this.init();
      return;
    }
    this.observeAll();
  }

  private applyStyleToElement(el: HTMLElement): void {
    const effect = (getStringAttribute(el, 'data-aura', this.options.defaultEffect) ||
      this.options.defaultEffect) as ScrollRevealEffect;
    const duration = getNumericAttribute(el, 'data-aura-duration', this.options.duration);
    const delay = getNumericAttribute(el, 'data-aura-delay', this.options.delay);
    const distance = getStringAttribute(el, 'data-aura-distance', this.options.distance);

    const parentStagger = el.parentElement?.getAttribute('data-aura-stagger');
    let finalDelay = delay;
    if (parentStagger) {
      const staggerMs = parseFloat(parentStagger) || this.options.stagger;
      const siblings = Array.from(el.parentElement?.querySelectorAll('[data-aura]') || []);
      const siblingIndex = siblings.indexOf(el);
      if (siblingIndex > 0) {
        finalDelay += siblingIndex * staggerMs;
      }
    }

    el.style.setProperty('--aura-distance', distance);
    el.style.transitionDuration = `${duration}ms`;
    if (finalDelay > 0) {
      el.style.transitionDelay = `${finalDelay}ms`;
    }

    if (!el.getAttribute('data-aura')) {
      el.setAttribute('data-aura', effect);
    }
  }

  private applyAllStyles(): void {
    const elements = safeQueryAll<HTMLElement>('[data-aura]');
    elements.forEach((el) => this.applyStyleToElement(el));
  }

  private observeAll(): void {
    if (!this.observer) return;

    const elements = safeQueryAll<HTMLElement>('[data-aura]');
    const isReduced = prefersReducedMotion();

    elements.forEach((el) => {
      this.applyStyleToElement(el);

      if (isReduced) {
        el.classList.add('aura-revealed');
        return;
      }

      if (this.observedElements.has(el)) return;

      this.observer!.observe(el);
      this.observedElements.add(el);
    });
  }

  private revealAll(): void {
    const elements = safeQueryAll<HTMLElement>('[data-aura]');
    elements.forEach((el) => el.classList.add('aura-revealed'));
  }

  public enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    if (!this.initialized) {
      this.init();
    } else {
      this.refresh();
    }
  }

  public disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.revealAll();
    if (this.observer) {
      this.observer.disconnect();
    }
    this.observedElements.clear();
  }

  public updateConfig(newOptions: Partial<AuraScrollOptions>): void {
    Object.assign(this.options, newOptions);
    if (typeof newOptions.enabled !== 'undefined') {
      if (newOptions.enabled) this.enable();
      else this.disable();
    } else if (this.enabled) {
      this.createObserver();
      this.observedElements.clear();
      this.observeAll();
    }
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.observedElements.clear();
    this.revealAll();
    this.initialized = false;
    this.enabled = false;
  }
}
