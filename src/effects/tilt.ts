import type { AuraTiltOptions, EffectModule } from '../types';
import { safeQueryAll, getNumericAttribute, prefersReducedMotion, isTouchDevice } from '../core/utils';

interface BoundElement {
  el: HTMLElement;
  glareEl: HTMLElement | null;
  maxAngle: number;
  perspective: number;
  scale: number;
  speed: number;
  originalTransform: string;
  originalTransition: string;
  onPointerMove: (e: PointerEvent) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

export class AuraTiltEffect implements EffectModule {
  public readonly name = 'tilt' as const;
  private options: Required<AuraTiltOptions>;
  private enabled: boolean;
  private initialized: boolean = false;
  private boundElements: BoundElement[] = [];

  constructor(options: Required<AuraTiltOptions>) {
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
      const maxAngle = getNumericAttribute(el, 'data-aura-tilt-angle', this.options.maxAngle);
      const scale = getNumericAttribute(el, 'data-aura-tilt-scale', this.options.scale);
      const speed = getNumericAttribute(el, 'data-aura-tilt-speed', this.options.speed);
      const perspective = getNumericAttribute(el, 'data-aura-tilt-perspective', this.options.perspective);
      const glareAttr = el.getAttribute('data-aura-tilt-glare');
      const hasGlare = glareAttr !== null ? glareAttr !== 'false' : this.options.glare;

      let glareEl: HTMLElement | null = null;
      if (hasGlare) {
        glareEl = el.querySelector('.aura-tilt-glare');
        if (!glareEl) {
          glareEl = document.createElement('div');
          glareEl.className = 'aura-tilt-glare';
          glareEl.style.setProperty('--aura-glare-opacity', `${this.options.glareOpacity}`);
          el.appendChild(glareEl);
        }
      }

      const originalTransform = el.style.transform;
      const originalTransition = el.style.transition;

      let rafId: number | null = null;
      let rotX = 0;
      let rotY = 0;
      let glareX = 50;
      let glareY = 50;

      const updateTransform = () => {
        el.style.transform = `perspective(${perspective}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${scale}, ${scale}, ${scale})`;
        if (glareEl) {
          glareEl.style.setProperty('--aura-glare-x', `${glareX}%`);
          glareEl.style.setProperty('--aura-glare-y', `${glareY}%`);
        }
        rafId = null;
      };

      const onPointerEnter = () => {
        el.style.transition = `transform ${speed * 0.25}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!this.enabled) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const normX = (x / rect.width) * 2 - 1; // -1 to 1
        const normY = (y / rect.height) * 2 - 1; // -1 to 1

        rotX = -normY * maxAngle;
        rotY = normX * maxAngle;

        glareX = (x / rect.width) * 100;
        glareY = (y / rect.height) * 100;

        el.style.transition = 'transform 0.08s ease-out';
        if (rafId === null) {
          rafId = requestAnimationFrame(updateTransform);
        }
      };

      const onPointerLeave = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        el.style.transition = `transform ${speed}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      };

      el.addEventListener('pointerenter', onPointerEnter, { passive: true });
      el.addEventListener('pointermove', onPointerMove, { passive: true });
      el.addEventListener('pointerleave', onPointerLeave, { passive: true });

      this.boundElements.push({
        el,
        glareEl,
        maxAngle,
        perspective,
        scale,
        speed,
        originalTransform,
        originalTransition,
        onPointerMove,
        onPointerEnter,
        onPointerLeave
      });
    });
  }

  private unbindAll(): void {
    this.boundElements.forEach((b) => {
      b.el.removeEventListener('pointerenter', b.onPointerEnter);
      b.el.removeEventListener('pointermove', b.onPointerMove);
      b.el.removeEventListener('pointerleave', b.onPointerLeave);
      b.el.style.transform = b.originalTransform;
      b.el.style.transition = b.originalTransition;
      if (b.glareEl && b.glareEl.parentNode) {
        b.glareEl.parentNode.removeChild(b.glareEl);
      }
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

  public updateConfig(newOptions: Partial<AuraTiltOptions>): void {
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
