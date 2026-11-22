import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initAura, getAura, AuraEngine } from '../src/core/engine';

describe('AuraEngine Lifecycle', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    const style = document.getElementById('aurafx-injected-styles');
    if (style) style.remove();
  });

  afterEach(() => {
    const instance = getAura();
    if (instance) {
      instance.destroy();
    }
    vi.restoreAllMocks();
  });

  it('initializes the engine successfully', () => {
    const aura = initAura();
    expect(aura).toBeDefined();
    expect(getAura()).toBe(aura);

    // Checks that styles are injected
    const styleEl = document.getElementById('aurafx-injected-styles');
    expect(styleEl).not.toBeNull();
    expect(styleEl?.textContent).toContain('.aura-cursor-container');
  });

  it('does not duplicate instances on multiple init calls', () => {
    const aura1 = initAura({ cursor: { color: '#8b5cf6' } });
    const aura2 = initAura({ cursor: { color: '#06b6d4' } });

    expect(aura1).toBe(aura2);
    expect(aura1.options.cursor.color).toBe('#06b6d4');

    // Only one style element should exist
    const styles = document.querySelectorAll('#aurafx-injected-styles');
    expect(styles.length).toBe(1);
  });

  it('destroys all DOM elements, styles, and instances cleanly', () => {
    const aura = initAura();
    expect(document.getElementById('aurafx-injected-styles')).not.toBeNull();
    expect(document.querySelector('.aura-cursor-container')).not.toBeNull();

    aura.destroy();

    expect(getAura()).toBeNull();
    expect(document.getElementById('aurafx-injected-styles')).toBeNull();
    expect(document.querySelector('.aura-cursor-container')).toBeNull();
  });

  it('toggles effects on and off via enable() and disable()', () => {
    const aura = initAura();

    expect(aura.effects.cursor?.isEnabled()).toBe(true);

    aura.disable('cursor');
    expect(aura.effects.cursor?.isEnabled()).toBe(false);
    expect(aura.options.cursor.enabled).toBe(false);

    aura.enable('cursor');
    expect(aura.effects.cursor?.isEnabled()).toBe(true);
    expect(aura.options.cursor.enabled).toBe(true);
  });

  it('supports toggle() helper method', () => {
    const aura = initAura();

    aura.toggle('magnetic', false);
    expect(aura.effects.magnetic?.isEnabled()).toBe(false);

    aura.toggle('magnetic', true);
    expect(aura.effects.magnetic?.isEnabled()).toBe(true);

    aura.toggle('magnetic');
    expect(aura.effects.magnetic?.isEnabled()).toBe(false);
  });

  it('refreshes without crashing when new elements are present', () => {
    const aura = initAura();

    const newBtn = document.createElement('button');
    newBtn.setAttribute('data-aura-ripple', '');
    newBtn.setAttribute('data-aura-magnetic', '');
    document.body.appendChild(newBtn);

    expect(() => aura.refresh()).not.toThrow();
  });
});
