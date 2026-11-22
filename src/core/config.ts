import type {
  AuraOptions,
  ResolvedAuraOptions,
  AmbientPreset
} from '../types';

export const AMBIENT_PALETTES: Record<AmbientPreset, string[]> = {
  'cyber-violet': ['#7928ca', '#4338ca', '#06b6d4', '#ec4899'],
  'aurora': ['#10b981', '#06b6d4', '#3b82f6', '#6366f1'],
  'deep-space': ['#1e1b4b', '#312e81', '#4c1d95', '#0f172a'],
  'sunset': ['#f43f5e', '#fb923c', '#eab308', '#ec4899'],
  'cosmic': ['#8b5cf6', '#3b82f6', '#ec4899', '#6366f1']
};

export const DEFAULT_OPTIONS: ResolvedAuraOptions = {
  cursor: {
    enabled: true,
    color: '#8b5cf6',
    ringColor: 'rgba(139, 92, 246, 0.45)',
    glowColor: 'rgba(139, 92, 246, 0.18)',
    dotSize: 7,
    ringSize: 34,
    trail: true,
    trailLength: 12,
    particles: false,
    particleColor: '#a855f7',
    glow: true,
    glowRadius: 260,
    spotlight: false,
    spotlightRadius: 400,
    spotlightOpacity: 0.08,
    lerp: 0.18,
    disableOnTouch: true,
    hoverSelector:
      'a, button, [data-aura-magnetic], [data-aura-tilt], [data-aura-ripple], [data-aura-glow], input, select, textarea, [role="button"], label'
  },
  scroll: {
    enabled: true,
    defaultEffect: 'fade-up',
    duration: 700,
    delay: 0,
    distance: '28px',
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px',
    once: true,
    stagger: 80
  },
  ambient: {
    enabled: false,
    intensity: 'low',
    palette: 'cyber-violet',
    speed: 0.4,
    blur: 90,
    particles: true,
    particleCount: 22,
    container: null,
    zIndex: -1
  },
  magnetic: {
    enabled: true,
    strength: 0.28,
    maxDistance: 32,
    scale: 1.0,
    duration: 350,
    selector: '[data-aura-magnetic]'
  },
  glow: {
    enabled: true,
    color: '#8b5cf6',
    intensity: 0.35,
    radius: 260,
    borderGlow: true,
    selector: '[data-aura-glow]'
  },
  ripple: {
    enabled: true,
    color: 'rgba(255, 255, 255, 0.35)',
    duration: 600,
    selector: '[data-aura-ripple]'
  },
  tilt: {
    enabled: true,
    maxAngle: 8,
    perspective: 1000,
    scale: 1.02,
    glare: true,
    glareOpacity: 0.22,
    speed: 400,
    selector: '[data-aura-tilt]'
  },
  injectStyles: true,
  reducedMotion: 'respect'
};

/**
 * Deep merges user options with default options, gracefully handling
 * boolean shorthands (e.g. `cursor: false` or `ambient: true`).
 */
export function resolveConfig(userOptions?: AuraOptions): ResolvedAuraOptions {
  if (!userOptions || typeof userOptions !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
  }

  const result: ResolvedAuraOptions = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));

  // Top-level boolean/flags
  if (typeof userOptions.injectStyles === 'boolean') {
    result.injectStyles = userOptions.injectStyles;
  }
  if (userOptions.reducedMotion === 'ignore' || userOptions.reducedMotion === 'respect') {
    result.reducedMotion = userOptions.reducedMotion;
  }

  const effectKeys = ['cursor', 'scroll', 'ambient', 'magnetic', 'glow', 'ripple', 'tilt'] as const;

  for (const key of effectKeys) {
    const val = userOptions[key];
    if (typeof val === 'boolean') {
      result[key].enabled = val;
    } else if (val && typeof val === 'object') {
      Object.assign(result[key], val);
      if (typeof (val as any).enabled === 'undefined') {
        result[key].enabled = true;
      }
    }
  }

  return result;
}
