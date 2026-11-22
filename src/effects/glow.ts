import type { AuraGlowOptions, EffectModule } from '../types';
import { safeQueryAll, getNumericAttribute, getStringAttribute, hexToRgba, isTouchDevice } from '../core/utils';

interface BoundElement {
  el: HTMLElement;
  color: string;
  intensity: number;
  radius: number;
  onPointerMove: (e: PointerEvent) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

export class AuraGlowEffect implements EffectModule {
  public readonly name = 'glow' as const;
  private options: Required<AuraGlowOptions>;
  private enabled: boolean;
  private initialized: boolean = false;
  private boundElements: BoundElement[] = [];

  constructor(options: Required<AuraGlowOptions>) {
    this.options = { ...options };
    this.enabled = this.options.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    if (isTouchDevice()) return;

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
      const color = getStringAttribute(el, 'data-aura-glow-color', this.options.color);
      const intensity = getNumericAttribute(el, 'data-aura-glow-intensity', this.options.intensity);
      const radius = getNumericAttribute(el, 'data-aura-glow-radius', this.options.radius);

      const rgbaColor = hexToRgba(color, intensity);
      el.style.setProperty('--aura-glow-color', rgbaColor);
      el.style.setProperty('--aura-glow-radius', `${radius}px`);

      let rafId: number | null = null;
      let mouseX = 0;
      let mouseY = 0;

      const updatePosition = () => {
        el.style.setProperty('--aura-glow-x', `${mouseX}px`);
        el.style.setProperty('--aura-glow-y', `${mouseY}px`);
        rafId = null;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!this.enabled) return;
        const rect = el.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;

        if (rafId === null) {
          rafId = requestAnimationFrame(updatePosition);
        }
      };

      const onPointerEnter = () => {
        if (!this.enabled) return;
        el.style.setProperty('--aura-glow-opacity', `${intensity}`);
      };

      const onPointerLeave = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        el.style.setProperty('--aura-glow-opacity', '0');
      };

      el.addEventListener('pointermove', onPointerMove, { passive: true });
      el.addEventListener('pointerenter', onPointerEnter, { passive: true });
      el.addEventListener('pointerleave', onPointerLeave, { passive: true });

      this.boundElements.push({
        el,
        color,
        intensity,
        radius,
        onPointerMove,
        onPointerEnter,
        onPointerLeave
      });
    });
  }

  private unbindAll(): void {
    this.boundElements.forEach((b) => {
      b.el.removeEventListener('pointermove', b.onPointerMove);
      b.el.removeEventListener('pointerenter', b.onPointerEnter);
      b.el.removeEventListener('pointerleave', b.onPointerLeave);
      b.el.style.removeProperty('--aura-glow-opacity');
      b.el.style.removeProperty('--aura-glow-x');
      b.el.style.removeProperty('--aura-glow-y');
      b.el.style.removeProperty('--aura-glow-color');
      b.el.style.removeProperty('--aura-glow-radius');
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

  public updateConfig(newOptions: Partial<AuraGlowOptions>): void {
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
