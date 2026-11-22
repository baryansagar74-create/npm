import { describe, it, expect } from 'vitest';
import { resolveConfig, DEFAULT_OPTIONS, AMBIENT_PALETTES } from '../src/core/config';

describe('AuraFX Configuration System', () => {
  it('returns default options when undefined or empty options are passed', () => {
    const config1 = resolveConfig();
    const config2 = resolveConfig({});

    expect(config1.cursor.enabled).toBe(true);
    expect(config1.cursor.color).toBe(DEFAULT_OPTIONS.cursor.color);
    expect(config1.scroll.enabled).toBe(true);
    expect(config1.ambient.enabled).toBe(false);
    expect(config1.magnetic.enabled).toBe(true);
    expect(config1.glow.enabled).toBe(true);
    expect(config1.ripple.enabled).toBe(true);
    expect(config1.tilt.enabled).toBe(true);
    expect(config1.injectStyles).toBe(true);
    expect(config2.cursor.enabled).toBe(true);
  });

  it('handles boolean shorthand for effects correctly', () => {
    const config = resolveConfig({
      cursor: false,
      ambient: true,
      magnetic: false
    });

    expect(config.cursor.enabled).toBe(false);
    expect(config.ambient.enabled).toBe(true);
    expect(config.magnetic.enabled).toBe(false);
    // Other defaults remain intact
    expect(config.cursor.color).toBe(DEFAULT_OPTIONS.cursor.color);
    expect(config.ambient.palette).toBe(DEFAULT_OPTIONS.ambient.palette);
  });

  it('handles partial configuration objects gracefully', () => {
    const config = resolveConfig({
      cursor: {
        color: '#ff0055',
        trailLength: 20
      },
      tilt: {
        maxAngle: 15
      }
    });

    expect(config.cursor.enabled).toBe(true);
    expect(config.cursor.color).toBe('#ff0055');
    expect(config.cursor.trailLength).toBe(20);
    expect(config.cursor.dotSize).toBe(DEFAULT_OPTIONS.cursor.dotSize);
    expect(config.tilt.maxAngle).toBe(15);
    expect(config.tilt.perspective).toBe(DEFAULT_OPTIONS.tilt.perspective);
  });

  it('handles invalid configuration types without throwing', () => {
    // @ts-expect-error test invalid inputs
    const configNull = resolveConfig(null);
    // @ts-expect-error test invalid inputs
    const configString = resolveConfig('invalid');
    // @ts-expect-error test invalid inputs
    const configNumber = resolveConfig(42);

    expect(configNull.cursor.enabled).toBe(true);
    expect(configString.cursor.enabled).toBe(true);
    expect(configNumber.cursor.enabled).toBe(true);
  });

  it('provides all expected ambient presets', () => {
    expect(AMBIENT_PALETTES['cyber-violet']).toBeDefined();
    expect(AMBIENT_PALETTES['aurora']).toBeDefined();
    expect(AMBIENT_PALETTES['deep-space']).toBeDefined();
    expect(AMBIENT_PALETTES['sunset']).toBeDefined();
    expect(AMBIENT_PALETTES['cosmic']).toBeDefined();
    expect(AMBIENT_PALETTES['cyber-violet'].length).toBeGreaterThan(2);
  });
});
