# AuraFX

A modular visual effects engine for web interfaces.

## Features

- **Aura Cursor**: Smooth trailing pointer with optional glow and particles.
- **Scroll Reveal**: Viewport-triggered element reveals powered by `IntersectionObserver`.
- **Ambient Background**: Subtle moving gradients and orbs on canvas.
- **Magnetic Elements**: Interactive pointer attraction with spring resets.
- **Interactive Glow**: Mouse-tracking radial highlights using CSS custom variables.
- **Click Ripple**: Coordinate-based material ripples.
- **Tilt Cards**: 3D card perspective tilt with dynamic reflection.

## Installation

```bash
npm install aurafx
```

## Quick Start

```typescript
import { initAura } from 'aurafx';

// Initialize with sensible defaults
const aura = initAura();
```

## HTML Attribute Usage

You can attach effects directly using data attributes:

```html
<!-- Scroll animation -->
<div data-aura="fade-up" data-aura-duration="800">
  Reveals on scroll
</div>

<!-- Magnetic, glowing, ripple button -->
<button data-aura-magnetic data-aura-glow data-aura-ripple>
  Interactive Button
</button>

<!-- 3D Card tilt -->
<div data-aura-tilt data-aura-tilt-angle="10">
  Tilt Card
</div>
```

## Programmatic Controls

```typescript
// Enable or disable individual effects
aura.enable('ambient');
aura.disable('cursor');

// Dynamically update configuration
aura.updateConfig({
  cursor: { color: '#06b6d4' },
  tilt: { maxAngle: 12 }
});

// Teardown and DOM cleanup
aura.destroy();
```

## Development

```bash
npm install
npm test
npm run build
```
