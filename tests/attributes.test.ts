import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initAura, getAura } from '../src/core/engine';

describe('AuraFX HTML Attributes API', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    const aura = getAura();
    if (aura) aura.destroy();
  });

  it('detects and prepares scroll reveal elements with data-aura attributes', () => {
    const el = document.createElement('div');
    el.setAttribute('data-aura', 'fade-up');
    el.setAttribute('data-aura-delay', '150');
    el.setAttribute('data-aura-duration', '900');
    el.setAttribute('data-aura-distance', '40px');
    document.body.appendChild(el);

    initAura();

    expect(el.style.getPropertyValue('--aura-distance')).toBe('40px');
    expect(el.style.transitionDuration).toBe('900ms');
    expect(el.style.transitionDelay).toBe('150ms');
  });

  it('detects and attaches magnetic behavior to [data-aura-magnetic]', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-aura-magnetic', '');
    btn.setAttribute('data-aura-magnetic-strength', '0.4');
    document.body.appendChild(btn);

    const aura = initAura();
    expect(aura.effects.magnetic?.isEnabled()).toBe(true);

    // Mock bounding rect
    btn.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      width: 100,
      height: 50,
      right: 200,
      bottom: 150,
      x: 100,
      y: 100,
      toJSON: () => {}
    });

    const pointerMove = new PointerEvent('pointermove', {
      clientX: 170,
      clientY: 130
    });
    btn.dispatchEvent(pointerMove);

    // Should update transition property
    expect(btn.style.transition).toContain('transform');
  });

  it('detects and activates interactive glow on [data-aura-glow]', () => {
    const card = document.createElement('div');
    card.setAttribute('data-aura-glow', '');
    card.setAttribute('data-aura-glow-color', '#3b82f6');
    card.setAttribute('data-aura-glow-intensity', '0.5');
    document.body.appendChild(card);

    initAura();

    expect(card.style.getPropertyValue('--aura-glow-color')).toContain('rgba');

    // Pointer enter should set opacity
    card.dispatchEvent(new PointerEvent('pointerenter'));
    expect(card.style.getPropertyValue('--aura-glow-opacity')).toBe('0.5');

    // Pointer leave should reset opacity
    card.dispatchEvent(new PointerEvent('pointerleave'));
    expect(card.style.getPropertyValue('--aura-glow-opacity')).toBe('0');
  });

  it('spawns and cleans up ripple wave on [data-aura-ripple] pointerdown', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-aura-ripple', '');
    btn.setAttribute('data-aura-ripple-color', 'rgba(255, 255, 255, 0.4)');
    document.body.appendChild(btn);

    initAura();

    btn.getBoundingClientRect = () => ({
      left: 50,
      top: 50,
      width: 120,
      height: 40,
      right: 170,
      bottom: 90,
      x: 50,
      y: 50,
      toJSON: () => {}
    });

    const event = new PointerEvent('pointerdown', {
      clientX: 80,
      clientY: 65
    });
    btn.dispatchEvent(event);

    const ripple = btn.querySelector('.aura-ripple-wave') as HTMLElement;
    expect(ripple).not.toBeNull();
    expect(ripple.style.backgroundColor).toBe('rgba(255, 255, 255, 0.4)');
    expect(ripple.style.left).toBe('30px'); // 80 - 50
    expect(ripple.style.top).toBe('15px'); // 65 - 50
  });

  it('detects and sets up tilt card with glare on [data-aura-tilt]', () => {
    const card = document.createElement('div');
    card.setAttribute('data-aura-tilt', '');
    card.setAttribute('data-aura-tilt-angle', '12');
    document.body.appendChild(card);

    initAura();

    const glare = card.querySelector('.aura-tilt-glare') as HTMLElement;
    expect(glare).not.toBeNull();

    card.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      width: 200,
      height: 200,
      right: 300,
      bottom: 300,
      x: 100,
      y: 100,
      toJSON: () => {}
    });

    card.dispatchEvent(new PointerEvent('pointerenter'));
    expect(card.style.transition).toContain('transform');
  });
});
