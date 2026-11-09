import * as THREE from 'three';
import { createGlowTexture } from './textures.js';

export const earthVertexShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vObjectNormal;

  void main() {
    vObjectNormal = normalize(normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const earthFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform float uTime;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vObjectNormal;

  // Simplex 3D noise, Ian McEwan / Ashima Arts (MIT).
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p);
      p = p * 2.03 + vec3(13.1, 7.7, 5.3);
      amplitude *= 0.5;
    }
    return value;
  }

  vec3 rotateY(vec3 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  void main() {
    vec3 p = normalize(vObjectNormal);
    vec3 N = normalize(vWorldNormal);
    vec3 L = normalize(uSunDirection);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    float lat = abs(p.y);

    float continental = fbm(p * 1.34 + vec3(2.3, 8.1, 4.7));
    float detail = fbm(p * 4.6 + vec3(continental * 1.8, 11.0, -3.0));
    float land = smoothstep(0.015, 0.105, continental + detail * 0.19);

    // Ocean: abyssal blue with a subtle shelf glow near coastlines.
    float shelf = smoothstep(0.025, -0.16, continental + detail * 0.12);
    vec3 deepOcean = vec3(0.004, 0.019, 0.058);
    vec3 shallowOcean = vec3(0.008, 0.084, 0.135);
    vec3 ocean = mix(deepOcean, shallowOcean, shelf);

    // Continents: green basins, dry interiors, pale mountain belts.
    float moisture = fbm(p * 5.2 + vec3(4.0, 1.0, 8.0)) * 0.5 + 0.5;
    float arid = smoothstep(0.42, 0.78, moisture + smoothstep(0.15, 0.5, lat) * 0.18);
    vec3 greenLand = vec3(0.028, 0.095, 0.037);
    vec3 dryLand = vec3(0.33, 0.25, 0.13);
    vec3 landColor = mix(greenLand, dryLand, arid);
    float mountains = smoothstep(0.22, 0.55, detail);
    landColor = mix(landColor, vec3(0.32, 0.31, 0.27), mountains * 0.55);

    float ice = smoothstep(0.79, 0.92, lat + detail * 0.055);
    landColor = mix(landColor, vec3(0.72, 0.83, 0.88), ice);
    ocean = mix(ocean, vec3(0.55, 0.72, 0.8), smoothstep(0.82, 0.94, lat) * 0.75);

    vec3 surface = mix(ocean, landColor, land);

    // Clouds are rotated independently from the solid planet.
    vec3 cp = rotateY(p, uTime * 0.0018);
    float cloudWarp = fbm(cp * 3.1 + vec3(9.0, 2.0, 6.0));
    float cloudField = fbm(cp * 5.0 + vec3(cloudWarp * 0.75, 0.0, 0.0));
    cloudField += 0.36 * fbm(cp * 11.0 + vec3(uTime * 0.012, 0.0, 0.0));
    cloudField += 0.22 * sin(cp.y * 24.0 + cloudWarp * 3.0);
    float clouds = smoothstep(0.26, 0.71, cloudField) * 0.92;
    clouds *= smoothstep(0.01, 0.12, lat + 0.15);

    float ndl = dot(N, L);
    float day = smoothstep(-0.18, 0.12, ndl);
    float direct = max(ndl, 0.0);

    vec3 nightSurface = surface * vec3(0.012, 0.022, 0.05);
    vec3 daySurface = surface * (0.12 + direct * 1.1);
    vec3 color = mix(nightSurface, daySurface, day);

    // Specular sun glint on open water.
    vec3 H = normalize(L + V);
    float specular = pow(max(dot(N, H), 0.0), 240.0) * (1.0 - land) * day;
    color += vec3(0.9, 0.76, 0.52) * specular * 0.45;
    float sheen = pow(max(dot(N, H), 0.0), 24.0) * (1.0 - land) * day;
    color += vec3(0.12, 0.22, 0.28) * sheen * 0.12;

    // City lights on the night side of the land.
    float cityField = fbm(p * 62.0 + vec3(3.3, 1.1, 7.7));
    float cityClusters = smoothstep(0.2, 0.75, fbm(p * 7.4 + vec3(1.0, 5.0, 9.0)));
    float cities = smoothstep(0.42, 0.68, cityField) * cityClusters * land * (1.0 - day);
    cities *= smoothstep(0.05, 0.22, lat);
    color += vec3(1.0, 0.56, 0.2) * cities * 1.7;

    // Clouds catch the sun and hide the surface beneath.
    float cloudLight = 0.032 + direct * 0.98;
    vec3 cloudColor = vec3(0.74, 0.82, 0.87) * cloudLight;
    color = mix(color, cloudColor, clouds * 0.9);

    // Warm scattering at the terminator, cool atmospheric rim.
    float sunset = pow(1.0 - abs(ndl), 7.0) * smoothstep(-0.25, 0.2, ndl);
    color += vec3(0.34, 0.14, 0.045) * sunset * 0.55;
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
    color += vec3(0.12, 0.4, 0.86) * fresnel * (0.07 + day * 0.62);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const atmosphereVertexShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    vec3 L = normalize(uSunDirection);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.4);
    float sunlit = smoothstep(-0.25, 0.38, dot(N, L));
    vec3 color = mix(vec3(0.012, 0.06, 0.16), vec3(0.17, 0.46, 0.94), sunlit);
    gl_FragColor = vec4(color, fresnel * (0.13 + sunlit * 0.6));
  }
`;

const starVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aPhase;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSize;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float twinkle = 0.66 + 0.34 * sin(uTime * 0.75 + aPhase);
    gl_PointSize = clamp(aSize * uPixelRatio * (620.0 / max(40.0, -mvPosition.z)), 0.8, 6.0);
    vColor = color;
    vAlpha = twinkle;
    vSize = aSize;
  }
`;

const starFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSize;
  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    float d = length(p);
    float core = smoothstep(0.5, 0.03, d);
    float halo = smoothstep(0.5, 0.18, d) * 0.35;
    float flare = 0.0;
    if (vSize > 1.9) {
      flare = max(0.0, 1.0 - abs(p.x) * 22.0) * max(0.0, 1.0 - abs(p.y) * 3.2);
      flare += max(0.0, 1.0 - abs(p.y) * 22.0) * max(0.0, 1.0 - abs(p.x) * 3.2);
    }
    float alpha = (core + halo + flare * 0.55) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export function createStars(count = 5200) {
  const rand = (() => {
    let s = 918273;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  })();

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  const palette = [
    new THREE.Color(0xbcd6ff),
    new THREE.Color(0xffffff),
    new THREE.Color(0xfff3d6),
    new THREE.Color(0xa9c8ff),
    new THREE.Color(0xffe0b8),
    new THREE.Color(0xe8f3ff),
  ];

  const bandBasisA = new THREE.Vector3(1, 0.2, 0.3).normalize();
  const bandBasisB = new THREE.Vector3(-0.3, 1, 0.15).normalize();

  for (let i = 0; i < count; i++) {
    let x;
    let y;
    let z;

    if (i < count * 0.42) {
      // A softly populated galactic band.
      const angle = rand() * Math.PI * 2;
      const spread = (rand() + rand() + rand() + rand() - 2) * 0.19;
      const radius = 250 + rand() * 190;
      const a = bandBasisA.clone().multiplyScalar(Math.cos(angle));
      const b = bandBasisB.clone().multiplyScalar(Math.sin(angle));
      x = (a.x + b.x + spread * 0.35) * radius;
      y = (a.y + b.y + spread * 0.5) * radius;
      z = (a.z + b.z + spread) * radius;
    } else {
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const radius = 260 + rand() * 220;
      x = Math.cos(theta) * r * radius;
      y = u * radius;
      z = Math.sin(theta) * r * radius;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const color = palette[Math.floor(rand() * palette.length)].clone();
    const luminosity = 0.62 + rand() * 0.38;
    color.multiplyScalar(luminosity);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    const bright = rand();
    sizes[i] = bright > 0.985 ? 2.8 + rand() * 1.7 : 0.45 + rand() * 1.35;
    phases[i] = rand() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = -2;
  return points;
}

function createSunGlow() {
  const material = new THREE.SpriteMaterial({
    map: createGlowTexture('rgba(255,248,232,1)'),
    color: 0xfff3dc,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    opacity: 0.95,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(34, 34, 1);
  sprite.position.set(-190, 122, 24);
  sprite.renderOrder = -1;
  return sprite;
}

export function createEnvironment(scene, renderer) {
  const sunDirection = new THREE.Vector3(-0.76, 0.47, 0.45).normalize();

  const sunLight = new THREE.DirectionalLight(0xfff4df, 3.45);
  sunLight.position.copy(sunDirection).multiplyScalar(72);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -42;
  sunLight.shadow.camera.right = 42;
  sunLight.shadow.camera.top = 42;
  sunLight.shadow.camera.bottom = -42;
  sunLight.shadow.camera.near = 5;
  sunLight.shadow.camera.far = 180;
  sunLight.shadow.bias = -0.00018;
  sunLight.shadow.normalBias = 0.035;
  scene.add(sunLight);

  const earthShine = new THREE.DirectionalLight(0x5e9cd4, 1.05);
  earthShine.position.set(6, -60, -38);
  scene.add(earthShine);

  const rimLight = new THREE.DirectionalLight(0x8db9f0, 1.35);
  rimLight.position.set(64, 18, -44);
  scene.add(rimLight);

  const hemisphere = new THREE.HemisphereLight(0x7ca8ca, 0x020307, 0.36);
  scene.add(hemisphere);

  const earthRadius = 58;
  const earthGeometry = new THREE.SphereGeometry(earthRadius, 128, 96);
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: sunDirection },
      uTime: { value: 0 },
    },
    vertexShader: earthVertexShader,
    fragmentShader: earthFragmentShader,
  });

  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.position.set(4, -80, -48);
  earth.rotation.z = 0.16;
  earth.rotation.y = -0.7;
  scene.add(earth);

  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: sunDirection },
    },
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(earthRadius * 1.025, 96, 64), atmosphereMaterial);
  atmosphere.position.copy(earth.position);
  atmosphere.rotation.copy(earth.rotation);
  atmosphere.renderOrder = 1;
  scene.add(atmosphere);

  const stars = createStars();
  scene.add(stars);

  const sunGlow = createSunGlow();
  scene.add(sunGlow);

  return {
    sunDirection,
    sunLight,
    earth,
    earthMaterial,
    atmosphere,
    stars,
    starMaterial: stars.material,
    sunGlow,
    update(elapsed) {
      earthMaterial.uniforms.uTime.value = elapsed;
      stars.material.uniforms.uTime.value = elapsed;
      earth.rotation.y += 0.000065;
      atmosphere.rotation.y = earth.rotation.y;
    },
  };
}
