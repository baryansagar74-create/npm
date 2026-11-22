import type { AuraMagneticOptions, EffectModule } from '../types';
import { safeQueryAll, getNumericAttribute, clamp, prefersReducedMotion, isTouchDevice } from '../core/utils';

interface BoundElement {
  el: HTMLElement;
  strength: number;
  maxDistance: number;
  scale: number;
  duration: number;
  originalTransform: string;
  originalTransition: string;
  onPointerMove: (e: PointerEvent) => void;
  onPointerLeave: () => void;
}

export class AuraMagneticEffect implements EffectModule {
  public readonly name = 'magnetic' as const;
  private options: Required<AuraMagneticOptions>;
  private enabled: boolean;
  private initialized: boolean = false;
  private boundElements: BoundElement[] = [];

  constructor(options: Required<AuraMagneticOptions>) {
    this.options = { ...options };
    this.enabled = this.options.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    if (isTouchDevice() || prefersReducedMotion()) return;

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
      const strength = getNumericAttribute(el, 'data-aura-magnetic-strength', this.options.strength);
      const maxDistance = getNumericAttribute(el, 'data-aura-magnetic-distance', this.options.maxDistance);
      const scale = getNumericAttribute(el, 'data-aura-magnetic-scale', this.options.scale);
      const duration = getNumericAttribute(el, 'data-aura-magnetic-duration', this.options.duration);

      const originalTransform = el.style.transform;
      const originalTransition = el.style.transition;

      let rafId: number | null = null;
      let targetX = 0;
      let targetY = 0;

      const updateTransform = () => {
        el.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)${scale !== 1.0 ? ` scale(${scale})` : ''}`;
        rafId = null;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!this.enabled) return;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) * strength;
        const deltaY = (e.clientY - centerY) * strength;

        targetX = clamp(deltaX, -maxDistance, maxDistance);
        targetY = clamp(deltaY, -maxDistance, maxDistance);

        el.style.transition = 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)';
        if (rafId === null) {
          rafId = requestAnimationFrame(updateTransform);
        }
      };

      const onPointerLeave = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        el.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        el.style.transform = originalTransform || 'translate3d(0, 0, 0)';
      };

      el.addEventListener('pointermove', onPointerMove, { passive: true });
      el.addEventListener('pointerleave', onPointerLeave, { passive: true });

      this.boundElements.push({
        el,
        strength,
        maxDistance,
        scale,
        duration,
        originalTransform,
        originalTransition,
        onPointerMove,
        onPointerLeave
      });
    });
  }

  private unbindAll(): void {
    this.boundElements.forEach((b) => {
      b.el.removeEventListener('pointermove', b.onPointerMove);
      b.el.removeEventListener('pointerleave', b.onPointerLeave);
      b.el.style.transform = b.originalTransform;
      b.el.style.transition = b.originalTransition;
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

  public updateConfig(newOptions: Partial<AuraMagneticOptions>): void {
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
