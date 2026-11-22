import { initAura, AmbientPreset } from '../src/index';

// 1. Initialize AuraFX with premium defaults
const aura = initAura({
  cursor: {
    enabled: true,
    color: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.2)',
    trail: true,
    trailLength: 12,
    particles: false
  },
  scroll: {
    enabled: true,
    duration: 700,
    threshold: 0.15
  },
  ambient: {
    enabled: false,
    intensity: 'low',
    palette: 'cyber-violet'
  },
  magnetic: {
    enabled: true,
    strength: 0.28
  },
  glow: {
    enabled: true,
    color: '#8b5cf6',
    intensity: 0.35,
    radius: 260
  },
  ripple: {
    enabled: true,
    color: 'rgba(255, 255, 255, 0.35)',
    duration: 600
  },
  tilt: {
    enabled: true,
    maxAngle: 8,
    perspective: 1000
  }
});

// 2. Setup Copy Install Command
const copyInstallBtn = document.getElementById('copy-install-btn');
const copyInstallText = document.getElementById('copy-install-text');
if (copyInstallBtn && copyInstallText) {
  copyInstallBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('npm install aurafx');
      copyInstallText.textContent = 'Copied!';
      setTimeout(() => {
        copyInstallText.textContent = 'Copy';
      }, 2000);
    } catch {
      copyInstallText.textContent = 'Copied!';
    }
  });
}

// 3. Setup Generic Code Snippet Copy Buttons
document.querySelectorAll<HTMLButtonElement>('.copy-snippet').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const code = btn.getAttribute('data-code');
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    } catch {
      btn.textContent = 'Copied!';
    }
  });
});

// 4. Playground Live Controls
const toggleCursor = document.getElementById('toggle-cursor') as HTMLInputElement | null;
const toggleParticles = document.getElementById('toggle-particles') as HTMLInputElement | null;
const toggleAmbient = document.getElementById('toggle-ambient') as HTMLInputElement | null;
const toggleMagnetic = document.getElementById('toggle-magnetic') as HTMLInputElement | null;
const toggleGlow = document.getElementById('toggle-glow') as HTMLInputElement | null;
const toggleRipple = document.getElementById('toggle-ripple') as HTMLInputElement | null;
const toggleTilt = document.getElementById('toggle-tilt') as HTMLInputElement | null;

toggleCursor?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  aura.toggle('cursor', checked);
});

toggleParticles?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  aura.updateConfig({ cursor: { particles: checked } });
});

toggleAmbient?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  aura.toggle('ambient', checked);
});

toggleMagnetic?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  aura.toggle('magnetic', checked);
});

toggleGlow?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  aura.toggle('glow', checked);
});

toggleRipple?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  aura.toggle('ripple', checked);
});

toggleTilt?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  aura.toggle('tilt', checked);
});

// Card Toggle Ambient Helper Button
const cardToggleAmbientBtn = document.getElementById('card-toggle-ambient');
cardToggleAmbientBtn?.addEventListener('click', () => {
  const isEnabled = aura.effects.ambient?.isEnabled() ?? false;
  aura.toggle('ambient', !isEnabled);
  if (toggleAmbient) {
    toggleAmbient.checked = !isEnabled;
  }
});

// Magnetic Strength Slider
const sliderMagnetic = document.getElementById('slider-magnetic') as HTMLInputElement | null;
const valMagnetic = document.getElementById('val-magnetic');
sliderMagnetic?.addEventListener('input', (e) => {
  const val = parseFloat((e.target as HTMLInputElement).value);
  if (valMagnetic) valMagnetic.textContent = val.toFixed(2);
  aura.updateConfig({ magnetic: { strength: val } });
});

// Tilt Angle Slider
const sliderTilt = document.getElementById('slider-tilt') as HTMLInputElement | null;
const valTilt = document.getElementById('val-tilt');
sliderTilt?.addEventListener('input', (e) => {
  const val = parseInt((e.target as HTMLInputElement).value, 10);
  if (valTilt) valTilt.textContent = `${val}°`;
  aura.updateConfig({ tilt: { maxAngle: val } });
});

// Ambient Palette Buttons
const paletteBtns = document.querySelectorAll<HTMLButtonElement>('.palette-btn');
paletteBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    paletteBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const palette = btn.getAttribute('data-palette') as AmbientPreset;
    aura.updateConfig({ ambient: { palette } });
    if (!aura.effects.ambient?.isEnabled()) {
      aura.enable('ambient');
      if (toggleAmbient) toggleAmbient.checked = true;
    }
  });
});

// Scroll Reveal Replay Button
const retriggerScrollBtn = document.getElementById('retrigger-scroll-btn');
retriggerScrollBtn?.addEventListener('click', () => {
  const preview = document.querySelector('[data-aura="blur"]');
  if (preview) {
    preview.classList.remove('aura-revealed');
    setTimeout(() => {
      preview.classList.add('aura-revealed');
    }, 150);
  }
});

// 5. Configuration Generator
const cfgCursorColor = document.getElementById('cfg-cursor-color') as HTMLInputElement | null;
const cfgTrailLen = document.getElementById('cfg-trail-len') as HTMLInputElement | null;
const cfgScrollDuration = document.getElementById('cfg-scroll-duration') as HTMLInputElement | null;
const cfgTiltAngle = document.getElementById('cfg-tilt-angle') as HTMLInputElement | null;
const cfgMagneticStrength = document.getElementById('cfg-magnetic-strength') as HTMLInputElement | null;

const cfgColorVal = document.getElementById('cfg-color-val');
const cfgTrailVal = document.getElementById('cfg-trail-val');
const cfgDurationVal = document.getElementById('cfg-duration-val');
const cfgAngleVal = document.getElementById('cfg-angle-val');
const cfgStrengthVal = document.getElementById('cfg-strength-val');

const configCodeOutput = document.getElementById('config-code-output');

function updateConfigCode(): void {
  const color = cfgCursorColor?.value || '#8b5cf6';
  const trail = parseInt(cfgTrailLen?.value || '12', 10);
  const duration = parseInt(cfgScrollDuration?.value || '700', 10);
  const angle = parseInt(cfgTiltAngle?.value || '8', 10);
  const strength = parseFloat(cfgMagneticStrength?.value || '0.28');

  if (cfgColorVal) cfgColorVal.textContent = color;
  if (cfgTrailVal) cfgTrailVal.textContent = `${trail}`;
  if (cfgDurationVal) cfgDurationVal.textContent = `${duration}ms`;
  if (cfgAngleVal) cfgAngleVal.textContent = `${angle}°`;
  if (cfgStrengthVal) cfgStrengthVal.textContent = strength.toFixed(2);

  const code = `import { initAura } from "aurafx";

const aura = initAura({
  cursor: {
    enabled: true,
    color: "${color}",
    trail: true,
    trailLength: ${trail}
  },
  scroll: {
    enabled: true,
    duration: ${duration},
    threshold: 0.15
  },
  magnetic: {
    enabled: true,
    strength: ${strength}
  },
  tilt: {
    enabled: true,
    maxAngle: ${angle}
  },
  glow: {
    enabled: true,
    color: "${color}"
  },
  ripple: {
    enabled: true
  }
});`;

  if (configCodeOutput) {
    configCodeOutput.textContent = code;
  }
}

[cfgCursorColor, cfgTrailLen, cfgScrollDuration, cfgTiltAngle, cfgMagneticStrength].forEach((input) => {
  input?.addEventListener('input', updateConfigCode);
});
updateConfigCode();

// Copy Config Button
const copyConfigBtn = document.getElementById('copy-config-btn');
copyConfigBtn?.addEventListener('click', async () => {
  if (!configCodeOutput?.textContent) return;
  try {
    await navigator.clipboard.writeText(configCodeOutput.textContent);
    const orig = copyConfigBtn.innerHTML;
    copyConfigBtn.innerHTML = '<span>Copied!</span>';
    setTimeout(() => {
      copyConfigBtn.innerHTML = orig;
    }, 2000);
  } catch {
    copyConfigBtn.innerHTML = '<span>Copied!</span>';
  }
});

// Apply Live Config Button
const applyLiveConfigBtn = document.getElementById('apply-live-config-btn');
applyLiveConfigBtn?.addEventListener('click', () => {
  const color = cfgCursorColor?.value || '#8b5cf6';
  const trail = parseInt(cfgTrailLen?.value || '12', 10);
  const duration = parseInt(cfgScrollDuration?.value || '700', 10);
  const angle = parseInt(cfgTiltAngle?.value || '8', 10);
  const strength = parseFloat(cfgMagneticStrength?.value || '0.28');

  aura.updateConfig({
    cursor: { color, trailLength: trail },
    scroll: { duration },
    tilt: { maxAngle: angle },
    magnetic: { strength },
    glow: { color }
  });

  const orig = applyLiveConfigBtn.innerHTML;
  applyLiveConfigBtn.innerHTML = '<span>Applied!</span>';
  setTimeout(() => {
    applyLiveConfigBtn.innerHTML = orig;
  }, 1800);
});

// 6. Documentation Tabs
const docsTabs = document.querySelectorAll<HTMLButtonElement>('.docs-tab');
const docsPanels = document.querySelectorAll<HTMLElement>('.docs-panel');

docsTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const targetId = tab.getAttribute('data-tab');
    if (!targetId) return;

    docsTabs.forEach((t) => t.classList.remove('active'));
    docsPanels.forEach((p) => p.classList.remove('active'));

    tab.classList.add('active');
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }
  });
});
