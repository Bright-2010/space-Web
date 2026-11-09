import * as THREE from 'three';

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function seededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function textureFromCanvas(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function softBlob(ctx, x, y, rx, ry, inner, outer, wrapWidth = 0) {
  const draw = (px) => {
    ctx.save();
    ctx.translate(px, y);
    ctx.scale(rx, ry);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.62, inner);
    gradient.addColorStop(1, outer);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  draw(x);
  if (wrapWidth) {
    if (x < rx * 2) draw(x + wrapWidth);
    if (x > wrapWidth - rx * 2) draw(x - wrapWidth);
  }
}

function drawWavyBand(ctx, width, y0, y1, color, amplitude, phase, frequency = 0.012) {
  ctx.beginPath();
  ctx.moveTo(0, y0);
  for (let x = 0; x <= width; x += 8) {
    ctx.lineTo(x, y0 + Math.sin(x * frequency + phase) * amplitude);
  }
  for (let x = width; x >= 0; x -= 8) {
    ctx.lineTo(x, y1 + Math.sin(x * frequency * 1.31 + phase + 1.4) * amplitude * 0.8);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function addGrain(ctx, width, height, random, count, alpha = 0.04) {
  for (let i = 0; i < count; i++) {
    const shade = random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${alpha * (0.3 + random() * 0.7)})`;
    ctx.fillRect(random() * width, random() * height, 1 + random() * 2, 1 + random() * 2);
  }
}

function drawCrater(ctx, x, y, radius, random, wrapWidth) {
  const draw = (px) => {
    ctx.save();
    ctx.translate(px, y);
    ctx.scale(1, 0.55 + random() * 0.45);
    const gradient = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius);
    gradient.addColorStop(0, 'rgba(18,16,15,0.5)');
    gradient.addColorStop(0.62, 'rgba(34,31,29,0.32)');
    gradient.addColorStop(0.82, 'rgba(218,211,201,0.26)');
    gradient.addColorStop(1, 'rgba(226,219,208,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,234,223,0.3)';
    ctx.lineWidth = Math.max(0.8, radius * 0.07);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.82, Math.PI * 1.05, Math.PI * 1.8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(17,14,12,0.38)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.78, Math.PI * 0.05, Math.PI * 0.9);
    ctx.stroke();
    ctx.restore();
  };
  draw(x);
  if (wrapWidth) {
    if (x < radius * 2) draw(x + wrapWidth);
    if (x > wrapWidth - radius * 2) draw(x - wrapWidth);
  }
}

function drawPolarCap(ctx, width, height, top, color = 'rgba(236,242,242,0.82)') {
  const capHeight = height * 0.075;
  const y = top ? 0 : height - capHeight;
  const gradient = ctx.createLinearGradient(0, top ? 0 : height, 0, top ? capHeight * 1.8 : height - capHeight * 1.8);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.55, color.replace(/[\d.]+\)$/u, '0.42)'));
  gradient.addColorStop(1, color.replace(/[\d.]+\)$/u, '0)'));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x <= width; x += 24) {
    const wobble = Math.sin(x * 0.035 + (top ? 1.2 : 4.1)) * capHeight * 0.22
      + Math.sin(x * 0.011) * capHeight * 0.16;
    ctx.lineTo(x, top ? capHeight * 0.7 + wobble : height - capHeight * 0.7 + wobble);
  }
  ctx.lineTo(width, y);
  ctx.closePath();
  ctx.fill();
}

function createMercuryTexture(random) {
  const width = 1536;
  const height = 768;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#5f5b56');
  base.addColorStop(0.42, '#827c75');
  base.addColorStop(0.72, '#6f6a63');
  base.addColorStop(1, '#4e4a46');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 170; i++) {
    const dark = random() > 0.52;
    softBlob(
      ctx,
      random() * width,
      random() * height,
      18 + random() * 100,
      6 + random() * 44,
      dark ? 'rgba(31,28,26,0.3)' : 'rgba(208,201,190,0.16)',
      'rgba(70,66,61,0)',
      width,
    );
  }

  for (let i = 0; i < 260; i++) {
    drawCrater(ctx, random() * width, random() * height, 3 + random() * 24, random, width);
  }

  for (let i = 0; i < 26; i++) {
    const y = random() * height;
    const x = random() * width;
    const length = 40 + random() * 220;
    ctx.strokeStyle = `rgba(45,42,39,${0.07 + random() * 0.15})`;
    ctx.lineWidth = 1 + random() * 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let t = 1; t <= 8; t++) {
      ctx.lineTo(x + length * (t / 8), y + Math.sin(t * 0.9 + i) * 8);
    }
    ctx.stroke();
  }

  addGrain(ctx, width, height, random, 6500, 0.07);
  return textureFromCanvas(canvas);
}

function createVenusTexture(random) {
  const width = 1536;
  const height = 768;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#cbb376');
  base.addColorStop(0.32, '#e8d29a');
  base.addColorStop(0.58, '#d9bd80');
  base.addColorStop(0.82, '#efddaa');
  base.addColorStop(1, '#bda367');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const bandColors = [
    'rgba(255,241,196,0.24)',
    'rgba(190,151,88,0.18)',
    'rgba(244,222,166,0.22)',
    'rgba(213,177,108,0.16)',
    'rgba(255,247,214,0.14)',
  ];
  for (let i = 0; i < 24; i++) {
    const y0 = (i / 24) * height;
    drawWavyBand(
      ctx,
      width,
      y0,
      y0 + height / 24 + 8,
      bandColors[i % bandColors.length],
      5 + random() * 13,
      random() * Math.PI * 2,
      0.006 + random() * 0.004,
    );
  }

  for (let i = 0; i < 90; i++) {
    const x = random() * width;
    const y = random() * height;
    ctx.strokeStyle = `rgba(255,245,210,${0.025 + random() * 0.07})`;
    ctx.lineWidth = 3 + random() * 14;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + 80 * (random() - 0.3),
      y + 20 * (random() - 0.5),
      x + 180 * (random() - 0.3),
      y + 40 * (random() - 0.5),
      x + 260 * (random() - 0.2),
      y + 8 * (random() - 0.5),
    );
    ctx.stroke();
  }

  softBlob(ctx, width * 0.5, 0, width * 0.7, height * 0.16, 'rgba(255,241,202,0.3)', 'rgba(255,241,202,0)', width);
  softBlob(ctx, width * 0.5, height, width * 0.7, height * 0.17, 'rgba(255,241,202,0.24)', 'rgba(255,241,202,0)', width);
  addGrain(ctx, width, height, random, 3500, 0.025);
  return textureFromCanvas(canvas);
}

function createMarsTexture(random) {
  const width = 1536;
  const height = 768;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#a94d33');
  base.addColorStop(0.35, '#c46742');
  base.addColorStop(0.62, '#b85839');
  base.addColorStop(0.82, '#cf7950');
  base.addColorStop(1, '#8f3e2b');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 34; i++) {
    const cx = random() * width;
    const cy = height * (0.22 + random() * 0.5);
    for (let j = 0; j < 7; j++) {
      softBlob(
        ctx,
        cx + (random() - 0.5) * 180,
        cy + (random() - 0.5) * 80,
        30 + random() * 110,
        14 + random() * 44,
        'rgba(70,45,38,0.24)',
        'rgba(92,52,42,0)',
        width,
      );
    }
  }

  for (let i = 0; i < 32; i++) {
    softBlob(
      ctx,
      random() * width,
      height * (0.32 + random() * 0.4),
      30 + random() * 140,
      12 + random() * 50,
      'rgba(224,145,97,0.13)',
      'rgba(224,145,97,0)',
      width,
    );
  }

  // Valles Marineris.
  ctx.strokeStyle = 'rgba(62,37,31,0.55)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(width * 0.2, height * 0.55);
  for (let i = 1; i <= 18; i++) {
    ctx.lineTo(
      width * 0.2 + (width * 0.48) * (i / 18),
      height * 0.55 + Math.sin(i * 0.8) * 10 + (random() - 0.5) * 6,
    );
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(240,176,125,0.24)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  for (let i = 0; i < 95; i++) {
    drawCrater(ctx, random() * width, random() * height, 2 + random() * 16, random, width);
  }

  drawPolarCap(ctx, width, height, true, 'rgba(246,246,242,0.88)');
  drawPolarCap(ctx, width, height, false, 'rgba(240,242,239,0.82)');
  addGrain(ctx, width, height, random, 6500, 0.06);
  return textureFromCanvas(canvas);
}

function createJupiterTexture(random) {
  const width = 1536;
  const height = 768;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#795235');
  base.addColorStop(0.28, '#c69a6d');
  base.addColorStop(0.5, '#94633f');
  base.addColorStop(0.72, '#d3ab7e');
  base.addColorStop(1, '#6e4a30');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const palette = [
    'rgba(242,218,182,0.52)',
    'rgba(123,75,45,0.46)',
    'rgba(206,164,120,0.42)',
    'rgba(92,55,33,0.38)',
    'rgba(248,231,202,0.4)',
    'rgba(144,90,55,0.44)',
    'rgba(225,193,153,0.42)',
  ];

  for (let i = 0; i < 34; i++) {
    const y0 = (i / 34) * height;
    drawWavyBand(
      ctx,
      width,
      y0,
      y0 + height / 34 + 10,
      palette[i % palette.length],
      3 + random() * 8,
      random() * Math.PI * 2,
      0.005 + random() * 0.007,
    );
  }

  for (let i = 0; i < 500; i++) {
    const y = random() * height;
    const x = random() * width;
    const length = 12 + random() * 145;
    const tone = random();
    ctx.strokeStyle = tone > 0.5
      ? `rgba(253,241,218,${0.025 + random() * 0.09})`
      : `rgba(117,79,55,${0.025 + random() * 0.08})`;
    ctx.lineWidth = 1 + random() * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + length * 0.45, y + (random() - 0.5) * 8, x + length, y + (random() - 0.5) * 3);
    ctx.stroke();
  }

  // Great Red Spot and a secondary southern storm.
  const drawStorm = (cx, cy, scale, strength) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.08);
    ctx.scale(1, 0.52);
    const radius = width * 0.095 * scale;
    const spot = ctx.createRadialGradient(0, 0, 6, 0, 0, radius);
    spot.addColorStop(0, `rgba(92,30,23,${0.92 * strength})`);
    spot.addColorStop(0.42, `rgba(143,52,34,${0.88 * strength})`);
    spot.addColorStop(0.72, `rgba(198,96,56,${0.55 * strength})`);
    spot.addColorStop(0.9, `rgba(232,166,112,${0.24 * strength})`);
    spot.addColorStop(1, 'rgba(232,166,112,0)');
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(250,219,180,${0.3 * strength})`;
    ctx.lineWidth = 3.5 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.9, radius * 0.9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(80,29,23,${0.38 * strength})`;
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.ellipse(-8 * scale, 0, radius * 0.6, radius * 0.6, 0.2, 0, Math.PI * 1.7);
    ctx.stroke();
    ctx.restore();
  };
  drawStorm(width * 0.64, height * 0.66, 1.0, 1);
  drawStorm(width * 0.18, height * 0.58, 0.55, 0.72);

  for (let i = 0; i < 9; i++) {
    softBlob(
      ctx,
      width * (0.12 + random() * 0.72),
      height * (0.22 + random() * 0.55),
      10 + random() * 26,
      6 + random() * 13,
      'rgba(250,236,213,0.35)',
      'rgba(250,236,213,0)',
      width,
    );
  }

  addGrain(ctx, width, height, random, 3800, 0.03);
  return textureFromCanvas(canvas);
}

function createSaturnTexture(random) {
  const width = 1536;
  const height = 768;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#c8ae7b');
  base.addColorStop(0.3, '#ebd9af');
  base.addColorStop(0.55, '#dac394');
  base.addColorStop(0.8, '#f0e2c1');
  base.addColorStop(1, '#bca273');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const palette = [
    'rgba(255,244,215,0.23)',
    'rgba(189,158,105,0.18)',
    'rgba(235,214,171,0.24)',
    'rgba(207,178,124,0.15)',
    'rgba(255,238,202,0.2)',
  ];

  for (let i = 0; i < 38; i++) {
    const y0 = (i / 38) * height;
    drawWavyBand(
      ctx,
      width,
      y0,
      y0 + height / 38 + 6,
      palette[i % palette.length],
      2 + random() * 4.5,
      random() * Math.PI * 2,
      0.003 + random() * 0.004,
    );
  }

  for (let i = 0; i < 220; i++) {
    const y = random() * height;
    ctx.strokeStyle = `rgba(255,245,220,${0.02 + random() * 0.055})`;
    ctx.lineWidth = 1 + random() * 2;
    ctx.beginPath();
    ctx.moveTo(random() * width, y);
    ctx.lineTo(random() * width, y + (random() - 0.5) * 3);
    ctx.stroke();
  }

  // Subtle north-polar hexagon.
  ctx.save();
  ctx.translate(width * 0.5, height * 0.055);
  ctx.strokeStyle = 'rgba(109,92,60,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(angle) * width * 0.05;
    const y = Math.sin(angle) * height * 0.026;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  addGrain(ctx, width, height, random, 2600, 0.025);
  return textureFromCanvas(canvas);
}

function createUranusTexture(random) {
  const width = 1536;
  const height = 768;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#b9ebea');
  base.addColorStop(0.28, '#91d7d7');
  base.addColorStop(0.62, '#8acfce');
  base.addColorStop(0.85, '#a9e2df');
  base.addColorStop(1, '#6fb8bb');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 14; i++) {
    const y0 = (i / 14) * height;
    drawWavyBand(
      ctx,
      width,
      y0,
      y0 + height / 14 + 4,
      i % 2 === 0 ? 'rgba(205,248,244,0.07)' : 'rgba(70,144,151,0.055)',
      2 + random() * 4,
      random() * Math.PI * 2,
      0.0025,
    );
  }

  for (let i = 0; i < 50; i++) {
    ctx.strokeStyle = `rgba(229,255,252,${0.015 + random() * 0.05})`;
    ctx.lineWidth = 1 + random() * 3;
    const x = random() * width;
    const y = random() * height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20 + random() * 80, y + (random() - 0.5) * 4);
    ctx.stroke();
  }

  softBlob(ctx, width * 0.5, height * 0.08, width * 0.45, height * 0.1, 'rgba(230,255,253,0.17)', 'rgba(230,255,253,0)', width);
  addGrain(ctx, width, height, random, 2000, 0.018);
  return textureFromCanvas(canvas);
}

function createNeptuneTexture(random) {
  const width = 1536;
  const height = 768;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#162d70');
  base.addColorStop(0.32, '#2d56b4');
  base.addColorStop(0.55, '#315fc6');
  base.addColorStop(0.76, '#254b9c');
  base.addColorStop(1, '#102456');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const palette = [
    'rgba(87,130,224,0.2)',
    'rgba(30,60,142,0.2)',
    'rgba(109,153,238,0.14)',
    'rgba(23,51,120,0.18)',
    'rgba(132,175,248,0.1)',
  ];
  for (let i = 0; i < 18; i++) {
    const y0 = (i / 18) * height;
    drawWavyBand(
      ctx,
      width,
      y0,
      y0 + height / 18 + 5,
      palette[i % palette.length],
      2 + random() * 5,
      random() * Math.PI * 2,
      0.0035,
    );
  }

  // Dark spot and companion bright clouds.
  ctx.save();
  ctx.translate(width * 0.36, height * 0.62);
  ctx.scale(1, 0.5);
  const spot = ctx.createRadialGradient(0, 0, 4, 0, 0, width * 0.055);
  spot.addColorStop(0, 'rgba(7,19,54,0.85)');
  spot.addColorStop(0.7, 'rgba(12,30,76,0.45)');
  spot.addColorStop(1, 'rgba(12,30,76,0)');
  ctx.fillStyle = spot;
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < 70; i++) {
    const x = random() * width;
    const y = height * (0.22 + random() * 0.58);
    ctx.strokeStyle = `rgba(225,239,255,${0.035 + random() * 0.1})`;
    ctx.lineWidth = 1 + random() * 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 10 + random() * 60, y + (random() - 0.5) * 3);
    ctx.stroke();
  }

  addGrain(ctx, width, height, random, 2600, 0.02);
  return textureFromCanvas(canvas);
}

const GENERATORS = {
  mercury: createMercuryTexture,
  venus: createVenusTexture,
  mars: createMarsTexture,
  jupiter: createJupiterTexture,
  saturn: createSaturnTexture,
  uranus: createUranusTexture,
  neptune: createNeptuneTexture,
};

const SEEDS = {
  mercury: 7,
  venus: 17,
  mars: 29,
  jupiter: 41,
  saturn: 53,
  uranus: 67,
  neptune: 79,
};

const cache = new Map();

export function getPlanetTexture(id) {
  if (cache.has(id)) return cache.get(id);
  const generator = GENERATORS[id];
  if (!generator) return null;
  const random = seededRandom(SEEDS[id] || 1);
  const texture = generator(random);
  cache.set(id, texture);
  return texture;
}
