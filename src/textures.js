import * as THREE from 'three';

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function textureFromCanvas(canvas, { srgb = true, repeat = [1, 1] } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function seededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createHullTextures() {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(24);

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, '#e7e9e8');
  base.addColorStop(0.42, '#d9dddc');
  base.addColorStop(1, '#c9cfd0');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Broad, soft staining gives the hull an accumulated on-orbit history.
  for (let i = 0; i < 30; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 22 + rand() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(82,91,94,${0.012 + rand() * 0.025})`);
    g.addColorStop(1, 'rgba(82,91,94,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Panel seams.
  ctx.lineWidth = 1;
  for (let x = 0; x < size; x += 54 + Math.floor(rand() * 44)) {
    ctx.strokeStyle = `rgba(49,60,65,${0.22 + rand() * 0.13})`;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, size);
    ctx.stroke();
  }
  for (let y = 0; y < size; y += 46 + Math.floor(rand() * 38)) {
    ctx.strokeStyle = `rgba(49,60,65,${0.17 + rand() * 0.11})`;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(size, y + 0.5);
    ctx.stroke();
  }

  // Alternating panel tones break up the long cylinder surfaces.
  for (let i = 0; i < 18; i++) {
    const w = 38 + rand() * 70;
    const h = 42 + rand() * 90;
    const x = rand() * (size - w);
    const y = rand() * (size - h);
    ctx.fillStyle = rand() > 0.45
      ? `rgba(255,255,255,${0.03 + rand() * 0.06})`
      : `rgba(69,78,81,${0.025 + rand() * 0.055})`;
    ctx.fillRect(x, y, w, h);
  }

  // Recessed service hatches.
  for (let i = 0; i < 8; i++) {
    const w = 36 + rand() * 54;
    const h = 20 + rand() * 34;
    const x = rand() * (size - w);
    const y = rand() * (size - h);
    ctx.fillStyle = `rgba(109,116,117,${0.07 + rand() * 0.08})`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(53,62,66,0.26)';
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = 'rgba(39,47,51,0.35)';
      ctx.beginPath();
      ctx.arc(x + 5 + k * (w - 10) / 3, y + h - 4, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Rivets and small fasteners.
  for (let i = 0; i < 520; i++) {
    ctx.fillStyle = `rgba(48,56,60,${0.08 + rand() * 0.16})`;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 0.65 + rand() * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiny technical markings.
  ctx.save();
  ctx.translate(size * 0.64, size * 0.28);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(42,54,61,0.5)';
  ctx.font = '600 10px Bahnschrift, Arial, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('TQ-01  /  PRESSURIZED SECTION', 0, 0);
  ctx.restore();

  ctx.fillStyle = 'rgba(180,132,61,0.5)';
  ctx.fillRect(size * 0.12, size * 0.74, 42, 5);
  ctx.fillStyle = 'rgba(42,54,61,0.4)';
  ctx.fillRect(size * 0.12, size * 0.755, 18, 2);

  const map = textureFromCanvas(canvas, { repeat: [2.2, 2.2] });
  const bumpCanvas = makeCanvas(size, size);
  const bctx = bumpCanvas.getContext('2d');
  bctx.drawImage(canvas, 0, 0);
  bctx.fillStyle = 'rgba(128,128,128,0.4)';
  bctx.fillRect(0, 0, size, size);
  const bump = textureFromCanvas(bumpCanvas, { srgb: false, repeat: [2.2, 2.2] });

  return { map, bump };
}

export function createFoilTextures() {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(91);

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, '#6f4a18');
  base.addColorStop(0.3, '#c6923d');
  base.addColorStop(0.55, '#8d621f');
  base.addColorStop(0.78, '#e2b35c');
  base.addColorStop(1, '#70501e');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Crumpled MLI facets.
  for (let i = 0; i < 720; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 5 + rand() * 34;
    const h = 5 + rand() * 30;
    const bright = rand();
    if (bright > 0.55) {
      ctx.fillStyle = `rgba(255,226,154,${0.02 + rand() * 0.16})`;
    } else {
      ctx.fillStyle = `rgba(48,28,7,${0.015 + rand() * 0.13})`;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + (rand() - 0.5) * h);
    ctx.lineTo(x + w * (0.4 + rand() * 0.5), y + h);
    ctx.closePath();
    ctx.fill();
  }

  for (let i = 0; i < 180; i++) {
    ctx.strokeStyle = rand() > 0.45
      ? `rgba(255,238,183,${0.04 + rand() * 0.18})`
      : `rgba(54,32,8,${0.04 + rand() * 0.14})`;
    ctx.lineWidth = 0.6 + rand() * 1.4;
    ctx.beginPath();
    const x = rand() * size;
    const y = rand() * size;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 120, y + (rand() - 0.5) * 40);
    ctx.stroke();
  }

  const map = textureFromCanvas(canvas, { repeat: [2, 2] });
  const bump = textureFromCanvas(canvas, { srgb: false, repeat: [2, 2] });

  return { map, bump };
}

export function createSolarTextures() {
  const w = 512;
  const h = 1024;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(73);

  ctx.fillStyle = '#030b18';
  ctx.fillRect(0, 0, w, h);

  const cols = 8;
  const rows = 16;
  const cw = w / cols;
  const ch = h / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw;
      const y = row * ch;
      const hue = 205 + rand() * 6;
      const light = 19 + rand() * 4;
      const grad = ctx.createLinearGradient(x, y, x + cw, y + ch);
      grad.addColorStop(0, `hsl(${hue} 72% ${light + 1.8}%)`);
      grad.addColorStop(0.5, `hsl(${hue} 76% ${light}%)`);
      grad.addColorStop(1, `hsl(${hue + 4} 68% ${light + 0.8}%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);

      // Fine current-collection fingers.
      ctx.strokeStyle = 'rgba(137,170,201,0.12)';
      ctx.lineWidth = 0.5;
      for (let k = 1; k < 6; k++) {
        ctx.beginPath();
        ctx.moveTo(x + (cw / 6) * k, y + 2);
        ctx.lineTo(x + (cw / 6) * k, y + ch - 2);
        ctx.stroke();
      }

      // A slight sheen across the cell.
      const sheen = ctx.createLinearGradient(x, y, x + cw * 0.75, y + ch);
      sheen.addColorStop(0, 'rgba(104,190,255,0)');
      sheen.addColorStop(0.5, `rgba(104,190,255,${0.025 + rand() * 0.05})`);
      sheen.addColorStop(1, 'rgba(104,190,255,0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
    }
  }

  // Silver grid and gold busbars.
  ctx.strokeStyle = 'rgba(177,197,211,0.6)';
  ctx.lineWidth = 1.2;
  for (let col = 0; col <= cols; col++) {
    ctx.beginPath();
    ctx.moveTo(col * cw, 0);
    ctx.lineTo(col * cw, h);
    ctx.stroke();
  }
  for (let row = 0; row <= rows; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * ch);
    ctx.lineTo(w, row * ch);
    ctx.stroke();
  }

  for (const col of [1, 4, 7]) {
    ctx.strokeStyle = 'rgba(211,165,82,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(col * cw, 0);
    ctx.lineTo(col * cw, h);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(225,193,123,0.7)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);

  const map = textureFromCanvas(canvas);
  const emissive = textureFromCanvas(canvas);
  return { map, emissive };
}

export function createSolarBackTexture() {
  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(7);
  ctx.fillStyle = '#c7c9c4';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(73,79,80,0.35)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(81,73,55,${0.02 + rand() * 0.08})`;
    ctx.beginPath();
    ctx.arc(rand() * 512, rand() * 512, rand() * 22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(54,62,64,0.45)';
  ctx.font = '600 11px Bahnschrift, Arial, sans-serif';
  ctx.fillText('TQ-SA / SILICON BLANKET', 18, 500);
  return textureFromCanvas(canvas, { repeat: [2, 2] });
}

export function createRadiatorTexture() {
  const w = 512;
  const h = 512;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e9ecea';
  ctx.fillRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, 'rgba(255,255,255,0.5)');
  grad.addColorStop(0.55, 'rgba(160,169,170,0.08)');
  grad.addColorStop(1, 'rgba(82,92,96,0.13)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(103,113,116,0.35)';
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 13) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }
  for (let x = 0; x < w; x += 128) {
    ctx.strokeStyle = 'rgba(83,94,98,0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(62,74,78,0.7)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.fillStyle = 'rgba(40,111,140,0.55)';
  ctx.fillRect(18, 18, 68, 10);
  return textureFromCanvas(canvas, { repeat: [1, 1] });
}

export function createGlowTexture(color = 'rgba(255,255,255,1)') {
  const canvas = makeCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, color);
  g.addColorStop(0.1, color);
  g.addColorStop(0.3, color.replace(/[\d.]+\)$/u, '0.48)'));
  g.addColorStop(0.62, color.replace(/[\d.]+\)$/u, '0.09)'));
  g.addColorStop(1, color.replace(/[\d.]+\)$/u, '0)'));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return textureFromCanvas(canvas);
}

export function createDecalTexture({
  title,
  subtitle = '',
  accent = '#d9dde0',
  subtitleColor = 'rgba(225,235,238,0.62)',
  lineColor = 'rgba(220,232,236,0.38)',
  titleSize = 140,
  flag = false,
} = {}) {
  const w = 1024;
  const h = 320;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const titleBaseline = 40 + titleSize * 0.85;
  const subtitleBaseline = titleBaseline + 50;
  const lineY = subtitleBaseline + 34;

  if (flag) {
    const flagY = Math.max(42, titleBaseline - 110);
    ctx.fillStyle = '#b32419';
    ctx.fillRect(44, flagY, 118, 76);
    ctx.fillStyle = '#f2c94c';
    const star = (cx, cy, r) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 === 0 ? r : r * 0.42;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    };
    star(83, flagY + 24, 17);
    star(121, flagY + 11, 6);
    star(136, flagY + 30, 6);
    star(128, flagY + 52, 6);
    star(107, flagY + 60, 6);
  }

  const textX = flag ? 194 : 44;
  ctx.fillStyle = accent;
  ctx.font = `300 ${titleSize}px "Noto Sans SC", "Microsoft YaHei UI", sans-serif`;
  ctx.fillText(title, textX, titleBaseline);
  if (subtitle) {
    ctx.fillStyle = subtitleColor;
    ctx.font = '500 25px Bahnschrift, Arial, sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText(subtitle, textX + 4, subtitleBaseline);
  }
  ctx.fillStyle = lineColor;
  ctx.fillRect(textX + 4, lineY, 420, 2);

  return textureFromCanvas(canvas);
}

export function createEnvTexture() {
  const w = 1024;
  const h = 512;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#010205');
  sky.addColorStop(0.4, '#040a14');
  sky.addColorStop(0.58, '#07111b');
  sky.addColorStop(0.72, '#0a2736');
  sky.addColorStop(0.82, '#0b3446');
  sky.addColorStop(1, '#020509');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const glow = (x, y, radius, inner, outer) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, inner);
    g.addColorStop(0.3, inner.replace(/[\d.]+\)$/u, '0.7)'));
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };

  // A warm key source just outside the field of view.
  glow(120, 180, 170, 'rgba(255,236,201,1)', 'rgba(255,190,120,0)');
  glow(120, 180, 50, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');

  // Earthshine spilling up from the planet.
  glow(610, 560, 420, 'rgba(38,104,164,0.85)', 'rgba(6,25,55,0)');
  glow(390, 520, 300, 'rgba(20,62,108,0.72)', 'rgba(6,25,55,0)');

  // Cold fill from camera right.
  glow(900, 310, 240, 'rgba(40,75,104,0.35)', 'rgba(4,10,18,0)');

  return textureFromCanvas(canvas);
}
