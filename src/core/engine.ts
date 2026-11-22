import type {
  AuraOptions,
  ResolvedAuraOptions,
  AuraInstance,
  AuraEffectName,
  EffectModule,
  DeepPartial
} from '../types';
import { resolveConfig } from './config';
import { injectCSS, removeCSS } from './utils';
import { CORE_CSS } from '../styles/cssContent';

import { AuraCursorEffect } from '../effects/cursor';
import { AuraScrollEffect } from '../effects/scroll';
import { AuraAmbientEffect } from '../effects/ambient';
import { AuraMagneticEffect } from '../effects/magnetic';
import { AuraGlowEffect } from '../effects/glow';
import { AuraRippleEffect } from '../effects/ripple';
import { AuraTiltEffect } from '../effects/tilt';

let activeInstance: AuraEngine | null = null;

export class AuraEngine implements AuraInstance {
  public options: ResolvedAuraOptions;
  public effects: Record<AuraEffectName, EffectModule | undefined>;
  private mutationObserver: MutationObserver | null = null;
  private mutationTimeout: number | null = null;
  private styleElement: HTMLStyleElement | null = null;

  constructor(userOptions?: AuraOptions) {
    this.options = resolveConfig(userOptions);
    this.effects = {
      cursor: undefined,
      scroll: undefined,
      ambient: undefined,
      magnetic: undefined,
      glow: undefined,
      ripple: undefined,
      tilt: undefined
    };

    this.init();
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  public init(): void {
    if (!this.isSupported()) return;

    // 1. Inject Styles if enabled
    if (this.options.injectStyles) {
      this.styleElement = injectCSS(CORE_CSS, 'aurafx-injected-styles');
    }

    // 2. Initialize Core Effect Modules
    this.effects.cursor = new AuraCursorEffect(this.options.cursor);
    this.effects.scroll = new AuraScrollEffect(this.options.scroll);
    this.effects.ambient = new AuraAmbientEffect(this.options.ambient);
    this.effects.magnetic = new AuraMagneticEffect(this.options.magnetic);
    this.effects.glow = new AuraGlowEffect(this.options.glow);
    this.effects.ripple = new AuraRippleEffect(this.options.ripple);
    this.effects.tilt = new AuraTiltEffect(this.options.tilt);

    // Initialize all modules
    (Object.keys(this.effects) as AuraEffectName[]).forEach((key) => {
      this.effects[key]?.init();
    });

    // 3. Setup dynamic DOM mutation observer to auto-refresh on client-side router navigation
    this.setupMutationObserver();
  }

  private setupMutationObserver(): void {
    if (typeof MutationObserver === 'undefined' || !document.body) return;

    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldRefresh = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              // Check if node itself or child has any aura attributes
              if (
                el.hasAttribute?.('data-aura') ||
                el.hasAttribute?.('data-aura-magnetic') ||
                el.hasAttribute?.('data-aura-glow') ||
                el.hasAttribute?.('data-aura-ripple') ||
                el.hasAttribute?.('data-aura-tilt') ||
                el.querySelector?.('[data-aura], [data-aura-magnetic], [data-aura-glow], [data-aura-ripple], [data-aura-tilt]')
              ) {
                shouldRefresh = true;
                break;
              }
            }
          }
        }
        if (shouldRefresh) break;
      }

      if (shouldRefresh) {
        if (this.mutationTimeout !== null) {
          window.clearTimeout(this.mutationTimeout);
        }
        this.mutationTimeout = window.setTimeout(() => {
          this.refresh();
          this.mutationTimeout = null;
        }, 60);
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  public refresh(): void {
    if (!this.isSupported()) return;
    (Object.keys(this.effects) as AuraEffectName[]).forEach((key) => {
      this.effects[key]?.refresh?.();
    });
  }

  public enable(effect: AuraEffectName): void {
    const mod = this.effects[effect];
    if (mod) {
      mod.enable();
      this.options[effect].enabled = true;
    }
  }

  public disable(effect: AuraEffectName): void {
    const mod = this.effects[effect];
    if (mod) {
      mod.disable();
      this.options[effect].enabled = false;
    }
  }

  public toggle(effect: AuraEffectName, enabled?: boolean): void {
    const mod = this.effects[effect];
    if (!mod) return;
    const shouldEnable = typeof enabled === 'boolean' ? enabled : !mod.isEnabled();
    if (shouldEnable) {
      this.enable(effect);
    } else {
      this.disable(effect);
    }
  }

  public updateConfig(newOptions: DeepPartial<AuraOptions>): void {
    if (!newOptions || typeof newOptions !== 'object') return;

    const effectKeys = ['cursor', 'scroll', 'ambient', 'magnetic', 'glow', 'ripple', 'tilt'] as const;

    effectKeys.forEach((key) => {
      const effectConfig = newOptions[key];
      if (typeof effectConfig !== 'undefined') {
        const mod = this.effects[key];
        if (typeof effectConfig === 'boolean') {
          if (effectConfig) this.enable(key);
          else this.disable(key);
        } else if (typeof effectConfig === 'object') {
          Object.assign(this.options[key], effectConfig);
          mod?.updateConfig?.(effectConfig);
        }
      }
    });
  }

  public destroy(): void {
    if (this.mutationTimeout !== null) {
      window.clearTimeout(this.mutationTimeout);
      this.mutationTimeout = null;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    (Object.keys(this.effects) as AuraEffectName[]).forEach((key) => {
      this.effects[key]?.destroy();
      this.effects[key] = undefined;
    });

    if (this.options.injectStyles) {
      removeCSS('aurafx-injected-styles');
      this.styleElement = null;
    }

    if (activeInstance === this) {
      activeInstance = null;
    }
  }
}

/**
 * Initializes AuraFX on the current page.
 * If called multiple times, updates the active instance with the new options
 * without duplicating effects, styles, or event listeners.
 */
export function initAura(options?: AuraOptions): AuraInstance {
  if (activeInstance) {
    if (options) {
      activeInstance.updateConfig(options);
    }
    return activeInstance;
  }

  activeInstance = new AuraEngine(options);
  return activeInstance;
}

/**
 * Returns the currently active AuraFX instance, if any.
 */
export function getAura(): AuraInstance | null {
  return activeInstance;
}
