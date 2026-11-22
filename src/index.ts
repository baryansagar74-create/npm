/**
 * AuraFX - Plug-and-play visual effects toolkit for the modern web.
 *
 * @license MIT
 * @package aurafx
 */

export { initAura, getAura, AuraEngine } from './core/engine';
export { DEFAULT_OPTIONS, AMBIENT_PALETTES, resolveConfig } from './core/config';
export {
  lerp,
  clamp,
  isTouchDevice,
  prefersReducedMotion,
  hexToRgba,
  injectCSS,
  removeCSS
} from './core/utils';

export { AuraCursorEffect } from './effects/cursor';
export { AuraScrollEffect } from './effects/scroll';
export { AuraAmbientEffect } from './effects/ambient';
export { AuraMagneticEffect } from './effects/magnetic';
export { AuraGlowEffect } from './effects/glow';
export { AuraRippleEffect } from './effects/ripple';
export { AuraTiltEffect } from './effects/tilt';

export type {
  AuraOptions,
  ResolvedAuraOptions,
  AuraInstance,
  AuraEffectName,
  EffectModule,
  DeepPartial,
  AuraCursorOptions,
  AuraScrollOptions,
  AuraAmbientOptions,
  AuraMagneticOptions,
  AuraGlowOptions,
  AuraRippleOptions,
  AuraTiltOptions,
  ScrollRevealEffect,
  AmbientPreset,
  AmbientIntensity
} from './types';

import { initAura } from './core/engine';
export default initAura;
