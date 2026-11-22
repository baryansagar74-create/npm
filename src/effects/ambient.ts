import type { AuraAmbientOptions, EffectModule, AmbientIntensity, AmbientPreset } from '../types';
import { AMBIENT_PALETTES } from '../core/config';
import { hexToRgba, prefersReducedMotion } from '../core/utils';

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  targetAlpha: number;
}

export class AuraAmbientEffect implements EffectModule {
  public readonly name = 'ambient' as const;
  private options: Required<AuraAmbientOptions>;
  private enabled: boolean;
  private initialized: boolean = false;

  private wrapper: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private blobs: Blob[] = [];
  private particles: AmbientParticle[] = [];
  private rafId: number | null = null;
  private width: number = 0;
  private height: number = 0;

  private onResizeBound: () => void;
  private onVisibilityChangeBound: () => void;

  constructor(options: Required<AuraAmbientOptions>) {
    this.options = { ...options };
    this.enabled = this.options.enabled;

    this.onResizeBound = this.onResize.bind(this);
    this.onVisibilityChangeBound = this.onVisibilityChange.bind(this);
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;

    this.createDOM();
    this.initScene();
    this.attachEvents();
    this.initialized = true;

    if (this.enabled) {
      this.startLoop();
    }
  }

  private resolveColors(): string[] {
    if (Array.isArray(this.options.palette)) {
      return this.options.palette.length > 0
        ? this.options.palette
        : AMBIENT_PALETTES['cyber-violet'];
    }
    const preset = this.options.palette as AmbientPreset;
    return AMBIENT_PALETTES[preset] || AMBIENT_PALETTES['cyber-violet'];
  }

  private getAlphaMultiplier(): number {
    const intensity = this.options.intensity;
    if (typeof intensity === 'number') return Math.max(0.05, Math.min(intensity, 1.0));
    switch (intensity) {
      case 'high':
        return 0.38;
      case 'medium':
        return 0.22;
      case 'low':
      default:
        return 0.12;
    }
  }

  private createDOM(): void {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'aura-ambient-wrapper';
    this.wrapper.style.zIndex = `${this.options.zIndex}`;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'aura-ambient-canvas';
    this.wrapper.appendChild(this.canvas);

    const target =
      typeof this.options.container === 'string'
        ? document.querySelector<HTMLElement>(this.options.container)
        : this.options.container || document.body;

    if (target) {
      if (target !== document.body) {
        target.style.position = 'relative';
        this.wrapper.style.position = 'absolute';
      }
      target.appendChild(this.wrapper);
    }

    this.ctx = this.canvas.getContext('2d');
    this.onResize();
  }

  private initScene(): void {
    const colors = this.resolveColors();
    const alpha = this.getAlphaMultiplier();
    this.blobs = [];
    this.particles = [];

    const numBlobs = Math.max(3, colors.length);
    for (let i = 0; i < numBlobs; i++) {
      const color = colors[i % colors.length];
      const minDimension = Math.min(this.width || 800, this.height || 600);
      const radius = minDimension * (0.35 + Math.random() * 0.25);
      const speed = (this.options.speed * 0.4 + 0.15);

      this.blobs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        radius,
        color: hexToRgba(color, alpha)
      });
    }

    if (this.options.particles) {
      for (let i = 0; i < this.options.particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3 - 0.1,
          radius: Math.random() * 1.8 + 0.6,
          alpha: Math.random() * 0.4 + 0.1,
          targetAlpha: Math.random() * 0.5 + 0.1
        });
      }
    }
  }

  private attachEvents(): void {
    window.addEventListener('resize', this.onResizeBound, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibilityChangeBound, { passive: true });
  }

  private detachEvents(): void {
    window.removeEventListener('resize', this.onResizeBound);
    document.removeEventListener('visibilitychange', this.onVisibilityChangeBound);
  }

  private onResize(): void {
    if (!this.canvas || !this.wrapper) return;
    const rect = this.wrapper.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    if (this.ctx) {
      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
    }
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
    if (!this.enabled || !this.ctx || !this.canvas) return;

    const isReduced = prefersReducedMotion();

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Save context and apply blur filter if supported
    this.ctx.save();
    if ('filter' in this.ctx) {
      this.ctx.filter = `blur(${this.options.blur}px)`;
    }

    // Render soft orbs
    for (const b of this.blobs) {
      if (!isReduced) {
        b.x += b.vx;
        b.y += b.vy;

        // Bounce gently inside padding
        if (b.x < -b.radius * 0.5 || b.x > this.width + b.radius * 0.5) b.vx *= -1;
        if (b.y < -b.radius * 0.5 || b.y > this.height + b.radius * 0.5) b.vy *= -1;
      }

      const grad = this.ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();

    // Render subtle floating particles
    if (this.options.particles && this.particles.length > 0) {
      for (const p of this.particles) {
        if (!isReduced) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = this.width;
          if (p.x > this.width) p.x = 0;
          if (p.y < 0) p.y = this.height;
          if (p.y > this.height) p.y = 0;

          // Gentle flicker
          p.alpha += (p.targetAlpha - p.alpha) * 0.02;
          if (Math.abs(p.targetAlpha - p.alpha) < 0.01) {
            p.targetAlpha = Math.random() * 0.5 + 0.1;
          }
        }

        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  public enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    if (!this.initialized) {
      this.init();
    } else {
      if (this.wrapper) this.wrapper.style.display = 'block';
      this.startLoop();
    }
  }

  public disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.stopLoop();
    if (this.wrapper) this.wrapper.style.display = 'none';
  }

  public updateConfig(newOptions: Partial<AuraAmbientOptions>): void {
    Object.assign(this.options, newOptions);
    if (typeof newOptions.enabled !== 'undefined') {
      if (newOptions.enabled) this.enable();
      else this.disable();
    }
    if (this.initialized) {
      this.initScene();
    }
  }

  public destroy(): void {
    this.stopLoop();
    this.detachEvents();
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
    this.wrapper = null;
    this.canvas = null;
    this.ctx = null;
    this.blobs = [];
    this.particles = [];
    this.initialized = false;
    this.enabled = false;
  }
}
