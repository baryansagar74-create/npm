/**
 * AuraFX - Type Definitions
 * Plug-and-play visual effects toolkit for the modern web.
 */

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AuraEffectName =
  | 'cursor'
  | 'scroll'
  | 'ambient'
  | 'magnetic'
  | 'glow'
  | 'ripple'
  | 'tilt';

export type ScrollRevealEffect =
  | 'fade-up'
  | 'fade-down'
  | 'fade-in'
  | 'slide-left'
  | 'slide-right'
  | 'scale-in'
  | 'blur';

export type AmbientPreset =
  | 'aurora'
  | 'deep-space'
  | 'cyber-violet'
  | 'sunset'
  | 'cosmic';

export type AmbientIntensity = 'low' | 'medium' | 'high' | number;

export interface AuraCursorOptions {
  enabled?: boolean;
  color?: string;
  ringColor?: string;
  glowColor?: string;
  dotSize?: number;
  ringSize?: number;
  trail?: boolean;
  trailLength?: number;
  particles?: boolean;
  particleColor?: string;
  glow?: boolean;
  glowRadius?: number;
  spotlight?: boolean;
  spotlightRadius?: number;
  spotlightOpacity?: number;
  lerp?: number;
  disableOnTouch?: boolean;
  hoverSelector?: string;
}

export interface AuraScrollOptions {
  enabled?: boolean;
  defaultEffect?: ScrollRevealEffect;
  duration?: number;
  delay?: number;
  distance?: string;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  stagger?: number;
}

export interface AuraAmbientOptions {
  enabled?: boolean;
  intensity?: AmbientIntensity;
  palette?: AmbientPreset | string[];
  speed?: number;
  blur?: number;
  particles?: boolean;
  particleCount?: number;
  container?: HTMLElement | string | null;
  zIndex?: number;
}

export interface AuraMagneticOptions {
  enabled?: boolean;
  strength?: number;
  maxDistance?: number;
  scale?: number;
  duration?: number;
  selector?: string;
}

export interface AuraGlowOptions {
  enabled?: boolean;
  color?: string;
  intensity?: number;
  radius?: number;
  borderGlow?: boolean;
  selector?: string;
}

export interface AuraRippleOptions {
  enabled?: boolean;
  color?: string;
  duration?: number;
  selector?: string;
}

export interface AuraTiltOptions {
  enabled?: boolean;
  maxAngle?: number;
  perspective?: number;
  scale?: number;
  glare?: boolean;
  glareOpacity?: number;
  speed?: number;
  selector?: string;
}

export interface AuraOptions {
  cursor?: boolean | AuraCursorOptions;
  scroll?: boolean | AuraScrollOptions;
  ambient?: boolean | AuraAmbientOptions;
  magnetic?: boolean | AuraMagneticOptions;
  glow?: boolean | AuraGlowOptions;
  ripple?: boolean | AuraRippleOptions;
  tilt?: boolean | AuraTiltOptions;
  injectStyles?: boolean;
  reducedMotion?: 'respect' | 'ignore';
}

export interface ResolvedAuraOptions {
  cursor: Required<AuraCursorOptions>;
  scroll: Required<AuraScrollOptions>;
  ambient: Required<AuraAmbientOptions>;
  magnetic: Required<AuraMagneticOptions>;
  glow: Required<AuraGlowOptions>;
  ripple: Required<AuraRippleOptions>;
  tilt: Required<AuraTiltOptions>;
  injectStyles: boolean;
  reducedMotion: 'respect' | 'ignore';
}

export interface EffectModule {
  name: AuraEffectName;
  init: () => void;
  destroy: () => void;
  enable: () => void;
  disable: () => void;
  refresh?: () => void;
  updateConfig?: (options: any) => void;
  isEnabled: () => boolean;
}

export interface AuraInstance {
  options: ResolvedAuraOptions;
  destroy: () => void;
  refresh: () => void;
  enable: (effect: AuraEffectName) => void;
  disable: (effect: AuraEffectName) => void;
  toggle: (effect: AuraEffectName, enabled?: boolean) => void;
  updateConfig: (newOptions: DeepPartial<AuraOptions>) => void;
  isSupported: () => boolean;
  effects: Record<AuraEffectName, EffectModule | undefined>;
}
