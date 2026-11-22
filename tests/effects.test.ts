import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuraCursorEffect } from '../src/effects/cursor';
import { AuraAmbientEffect } from '../src/effects/ambient';
import { DEFAULT_OPTIONS } from '../src/core/config';

describe('AuraFX Individual Effect Modules', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('AuraCursorEffect', () => {
    it('creates cursor elements when initialized', () => {
      const cursor = new AuraCursorEffect(DEFAULT_OPTIONS.cursor);
      cursor.init();

      const container = document.querySelector('.aura-cursor-container');
      const dot = document.querySelector('.aura-cursor-dot');
      const ring = document.querySelector('.aura-cursor-ring');
      const glow = document.querySelector('.aura-cursor-glow');

      expect(container).not.toBeNull();
      expect(dot).not.toBeNull();
      expect(ring).not.toBeNull();
      expect(glow).not.toBeNull();

      cursor.destroy();
      expect(document.querySelector('.aura-cursor-container')).toBeNull();
    });

    it('updates config dynamically', () => {
      const cursor = new AuraCursorEffect(DEFAULT_OPTIONS.cursor);
      cursor.init();

      const dot = document.querySelector('.aura-cursor-dot') as HTMLElement;
      expect(dot.style.backgroundColor).toBe('rgb(139, 92, 246)'); // #8b5cf6

      cursor.updateConfig({ color: '#ff0000' });
      expect(dot.style.backgroundColor).toBe('rgb(255, 0, 0)');

      cursor.destroy();
    });

    it('hides and shows via enable and disable', () => {
      const cursor = new AuraCursorEffect(DEFAULT_OPTIONS.cursor);
      cursor.init();

      const container = document.querySelector('.aura-cursor-container') as HTMLElement;
      expect(container.style.display).not.toBe('none');

      cursor.disable();
      expect(container.style.display).toBe('none');

      cursor.enable();
      expect(container.style.display).toBe('block');

      cursor.destroy();
    });
  });

  describe('AuraAmbientEffect', () => {
    it('creates canvas and wrapper when initialized', () => {
      // Mock getContext for jsdom
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        createRadialGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn()
        }),
        resetTransform: vi.fn(),
        scale: vi.fn()
      });

      const ambient = new AuraAmbientEffect(DEFAULT_OPTIONS.ambient);
      ambient.init();

      const wrapper = document.querySelector('.aura-ambient-wrapper');
      const canvas = document.querySelector('.aura-ambient-canvas');

      expect(wrapper).not.toBeNull();
      expect(canvas).not.toBeNull();

      ambient.destroy();
      expect(document.querySelector('.aura-ambient-wrapper')).toBeNull();
    });
  });
});
