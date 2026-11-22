import type { AuraRippleOptions, EffectModule } from '../types';
import { safeQueryAll, getNumericAttribute, getStringAttribute } from '../core/utils';

interface BoundElement {
  el: HTMLElement;
  onPointerDown: (e: PointerEvent) => void;
}

export class AuraRippleEffect implements EffectModule {
  public readonly name = 'ripple' as const;
  private options: Required<AuraRippleOptions>;
  private enabled: boolean;
  private initialized: boolean = false;
  private boundElements: BoundElement[] = [];

  constructor(options: Required<AuraRippleOptions>) {
    this.options = { ...options };
    this.enabled = this.options.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;

    this.bindAll();
    this.initialized = true;
  }

  public refresh(): void {
    if (!this.initialized) {
      this.init();
      return;
    }
    this.unbindAll();
    this.bindAll();
  }

  private bindAll(): void {
    if (!this.enabled) return;

    const elements = safeQueryAll<HTMLElement>(this.options.selector);

    elements.forEach((el) => {
      const onPointerDown = (e: PointerEvent) => {
        if (!this.enabled) return;

        const color = getStringAttribute(el, 'data-aura-ripple-color', this.options.color);
        const duration = getNumericAttribute(el, 'data-aura-ripple-duration', this.options.duration);

        const rect = el.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const size = Math.max(rect.width, rect.height) * 2;

        const ripple = document.createElement('span');
        ripple.className = 'aura-ripple-wave';
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${clickX}px`;
        ripple.style.top = `${clickY}px`;
        ripple.style.backgroundColor = color;
        ripple.style.animationDuration = `${duration}ms`;

        el.appendChild(ripple);

        const cleanup = () => {
          if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
          }
        };

        ripple.addEventListener('animationend', cleanup, { once: true });
        setTimeout(cleanup, duration + 100);
      };

      el.addEventListener('pointerdown', onPointerDown, { passive: true });
      this.boundElements.push({ el, onPointerDown });
    });
  }

  private unbindAll(): void {
    this.boundElements.forEach((b) => {
      b.el.removeEventListener('pointerdown', b.onPointerDown);
    });
    this.boundElements = [];
  }

  public enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    if (!this.initialized) {
      this.init();
    } else {
      this.bindAll();
    }
  }

  public disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.unbindAll();
  }

  public updateConfig(newOptions: Partial<AuraRippleOptions>): void {
    Object.assign(this.options, newOptions);
    if (typeof newOptions.enabled !== 'undefined') {
      if (newOptions.enabled) this.enable();
      else this.disable();
    } else if (this.enabled) {
      this.refresh();
    }
  }

  public destroy(): void {
    this.unbindAll();
    this.initialized = false;
    this.enabled = false;
  }
}
