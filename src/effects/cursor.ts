import type { AuraCursorOptions, EffectModule } from '../types';
import { lerp, isTouchDevice, hexToRgba, prefersReducedMotion } from '../core/utils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  el: HTMLDivElement;
}

export class AuraCursorEffect implements EffectModule {
  public readonly name = 'cursor' as const;
  private options: Required<AuraCursorOptions>;
  private enabled: boolean;
  private initialized: boolean = false;

  private container: HTMLDivElement | null = null;
  private dotEl: HTMLDivElement | null = null;
  private ringEl: HTMLDivElement | null = null;
  private glowEl: HTMLDivElement | null = null;
  private spotlightEl: HTMLDivElement | null = null;
  private trailElements: HTMLDivElement[] = [];
  private trailPositions: { x: number; y: number }[] = [];
  private particles: Particle[] = [];

  private targetX: number = -100;
  private targetY: number = -100;
  private currentX: number = -100;
  private currentY: number = -100;
  private ringX: number = -100;
  private ringY: number = -100;
  private isVisible: boolean = false;
  private isHovering: boolean = false;

  private rafId: number | null = null;
  private lastParticleSpawn: number = 0;

  // Bound event handlers
  private onMouseMoveBound: (e: MouseEvent) => void;
  private onMouseLeaveBound: () => void;
  private onMouseEnterBound: () => void;
  private onVisibilityChangeBound: () => void;

  constructor(options: Required<AuraCursorOptions>) {
    this.options = { ...options };
    this.enabled = this.options.enabled;

    this.onMouseMoveBound = this.onMouseMove.bind(this);
    this.onMouseLeaveBound = this.onMouseLeave.bind(this);
    this.onMouseEnterBound = this.onMouseEnter.bind(this);
    this.onVisibilityChangeBound = this.onVisibilityChange.bind(this);
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;

    if (this.options.disableOnTouch && isTouchDevice()) {
      return;
    }
    if (prefersReducedMotion()) {
      return;
    }

    this.createDOM();
    this.attachEvents();
    this.initialized = true;

    if (this.enabled) {
      this.startLoop();
    }
  }

  private createDOM(): void {
    this.container = document.createElement('div');
    this.container.className = 'aura-cursor-container';

    // Spotlight
    if (this.options.spotlight) {
      this.spotlightEl = document.createElement('div');
      this.spotlightEl.className = 'aura-cursor-spotlight';
      this.spotlightEl.style.width = `${this.options.spotlightRadius * 2}px`;
      this.spotlightEl.style.height = `${this.options.spotlightRadius * 2}px`;
      this.spotlightEl.style.backgroundColor = hexToRgba(this.options.color, this.options.spotlightOpacity);
      this.container.appendChild(this.spotlightEl);
    }

    // Glow
    if (this.options.glow) {
      this.glowEl = document.createElement('div');
      this.glowEl.className = 'aura-cursor-glow';
      this.glowEl.style.width = `${this.options.glowRadius}px`;
      this.glowEl.style.height = `${this.options.glowRadius}px`;
      this.glowEl.style.backgroundColor = this.options.glowColor;
      this.container.appendChild(this.glowEl);
    }

    // Trail dots
    if (this.options.trail && this.options.trailLength > 0) {
      this.trailElements = [];
      this.trailPositions = [];
      for (let i = 0; i < this.options.trailLength; i++) {
        const dot = document.createElement('div');
        dot.className = 'aura-cursor-trail-dot';
        const ratio = 1 - i / this.options.trailLength;
        const size = Math.max(2, this.options.dotSize * ratio);
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.backgroundColor = hexToRgba(this.options.color, ratio * 0.45);
        this.container.appendChild(dot);
        this.trailElements.push(dot);
        this.trailPositions.push({ x: -100, y: -100 });
      }
    }

    // Outer Ring
    this.ringEl = document.createElement('div');
    this.ringEl.className = 'aura-cursor-ring';
    this.ringEl.style.width = `${this.options.ringSize}px`;
    this.ringEl.style.height = `${this.options.ringSize}px`;
    this.ringEl.style.borderColor = this.options.ringColor;
    this.container.appendChild(this.ringEl);

    // Center Dot
    this.dotEl = document.createElement('div');
    this.dotEl.className = 'aura-cursor-dot';
    this.dotEl.style.width = `${this.options.dotSize}px`;
    this.dotEl.style.height = `${this.options.dotSize}px`;
    this.dotEl.style.backgroundColor = this.options.color;
    this.container.appendChild(this.dotEl);

    document.body.appendChild(this.container);
  }

  private attachEvents(): void {
    window.addEventListener('mousemove', this.onMouseMoveBound, { passive: true });
    document.addEventListener('mouseleave', this.onMouseLeaveBound, { passive: true });
    document.addEventListener('mouseenter', this.onMouseEnterBound, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibilityChangeBound, { passive: true });
  }

  private detachEvents(): void {
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    document.removeEventListener('mouseleave', this.onMouseLeaveBound);
    document.removeEventListener('mouseenter', this.onMouseEnterBound);
    document.removeEventListener('visibilitychange', this.onVisibilityChangeBound);
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.enabled) return;

    if (!this.isVisible) {
      this.isVisible = true;
      if (this.currentX === -100) {
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        this.ringX = e.clientX;
        this.ringY = e.clientY;
        for (const pos of this.trailPositions) {
          pos.x = e.clientX;
          pos.y = e.clientY;
        }
      }
      this.container?.classList.remove('aura-cursor-hidden');
    }

    this.targetX = e.clientX;
    this.targetY = e.clientY;

    // Check hover
    const target = e.target as Element | null;
    if (target && this.options.hoverSelector) {
      const match = target.closest(this.options.hoverSelector);
      if (match && !this.isHovering) {
        this.isHovering = true;
        this.container?.classList.add('aura-cursor-hover');
      } else if (!match && this.isHovering) {
        this.isHovering = false;
        this.container?.classList.remove('aura-cursor-hover');
      }
    }

    // Spawn particle if enabled
    if (this.options.particles) {
      const now = performance.now();
      if (now - this.lastParticleSpawn > 35) {
        this.spawnParticle(e.clientX, e.clientY);
        this.lastParticleSpawn = now;
      }
    }
  }

  private spawnParticle(x: number, y: number): void {
    if (!this.container || this.particles.length > 25) return;
    const el = document.createElement('div');
    el.className = 'aura-cursor-particle';
    const size = Math.random() * 4 + 2;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.backgroundColor = this.options.particleColor;
    this.container.appendChild(el);

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.5 + 0.3;

    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 0.2,
      size,
      alpha: 0.8,
      color: this.options.particleColor,
      el
    });
  }

  private onMouseLeave(): void {
    this.isVisible = false;
    this.container?.classList.add('aura-cursor-hidden');
  }

  private onMouseEnter(): void {
    this.isVisible = true;
    this.container?.classList.remove('aura-cursor-hidden');
  }

  private onVisibilityChange(): void {
    if (document.hidden) {
      this.stopLoop();
    } else if (this.enabled) {
      this.startLoop();
    }
  }

  private startLoop(): void {
    if (this.rafId !== null) return;
    const render = () => {
      this.update();
      this.rafId = requestAnimationFrame(render);
    };
    this.rafId = requestAnimationFrame(render);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private update(): void {
    if (!this.enabled || !this.isVisible) return;

    // Smooth lerp for main dot and outer ring
    this.currentX = lerp(this.currentX, this.targetX, 0.45);
    this.currentY = lerp(this.currentY, this.targetY, 0.45);

    const ringLerp = this.options.lerp;
    this.ringX = lerp(this.ringX, this.targetX, ringLerp);
    this.ringY = lerp(this.ringY, this.targetY, ringLerp);

    if (this.dotEl) {
      this.dotEl.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0) translate(-50%, -50%)`;
    }

    if (this.ringEl) {
      this.ringEl.style.transform = `translate3d(${this.ringX}px, ${this.ringY}px, 0) translate(-50%, -50%)`;
    }

    if (this.glowEl) {
      this.glowEl.style.transform = `translate3d(${this.ringX}px, ${this.ringY}px, 0) translate(-50%, -50%)`;
    }

    if (this.spotlightEl) {
      this.spotlightEl.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0) translate(-50%, -50%)`;
    }

    // Update trail
    if (this.trailElements.length > 0) {
      let prevX = this.ringX;
      let prevY = this.ringY;

      for (let i = 0; i < this.trailElements.length; i++) {
        const pos = this.trailPositions[i];
        pos.x = lerp(pos.x, prevX, 0.38);
        pos.y = lerp(pos.y, prevY, 0.38);

        this.trailElements[i].style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
        prevX = pos.x;
        prevY = pos.y;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.025;

      if (p.alpha <= 0) {
        if (p.el.parentNode) {
          p.el.parentNode.removeChild(p.el);
        }
        this.particles.splice(i, 1);
      } else {
        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
        p.el.style.opacity = `${p.alpha}`;
      }
    }
  }

  public enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    if (!this.initialized) {
      this.init();
    } else {
      if (this.container) {
        this.container.style.display = 'block';
      }
      this.startLoop();
    }
  }

  public disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.stopLoop();
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  public updateConfig(newOptions: Partial<AuraCursorOptions>): void {
    Object.assign(this.options, newOptions);
    if (typeof newOptions.enabled !== 'undefined') {
      if (newOptions.enabled) this.enable();
      else this.disable();
    }
    // Re-apply visual options to DOM
    if (this.dotEl && newOptions.color) {
      this.dotEl.style.backgroundColor = newOptions.color;
    }
    if (this.ringEl && (newOptions.ringColor || newOptions.color)) {
      this.ringEl.style.borderColor = newOptions.ringColor || hexToRgba(newOptions.color!, 0.45);
    }
    if (this.glowEl && (newOptions.glowColor || newOptions.color)) {
      this.glowEl.style.backgroundColor = newOptions.glowColor || hexToRgba(newOptions.color!, 0.18);
    }
  }

  public destroy(): void {
    this.stopLoop();
    this.detachEvents();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.dotEl = null;
    this.ringEl = null;
    this.glowEl = null;
    this.spotlightEl = null;
    this.trailElements = [];
    this.trailPositions = [];
    this.particles = [];
    this.initialized = false;
    this.enabled = false;
  }
}
