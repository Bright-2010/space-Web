import * as THREE from 'three';
import {
  createStars,
  earthFragmentShader,
  earthVertexShader,
} from './environment.js';
import { getPlanetTexture } from './planetTextures.js';
import { createGlowTexture } from './textures.js';

export const SOLAR_ORDER = [
  'sun',
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
];

export const SOLAR_BODIES = {
  sun: {
    id: 'sun',
    index: '00',
    name: '太阳',
    en: 'SUN',
    type: 'G2V 主序星',
    tagline: '太阳系的引力与能量中心',
    description:
      '太阳占太阳系总质量的 99.86%。它的核心每秒将约六亿吨氢聚变为氦，释放出的光需要 8 分 20 秒才能抵达地球。',
    fact: '太阳的日冕温度比可见表面高出数百倍，这一反常加热至今仍是天体物理学未解之谜。',
    color: '#ffb45e',
    radius: 13,
    orbitRadius: 0,
    orbitSpeed: 0,
    rotationSpeed: 0.005,
    axialTilt: 7.25,
    distanceAU: 0,
    stats: [
      ['直径', '1,392,700 km'],
      ['表面温度', '5,500 °C'],
      ['核心温度', '1,500 万 °C'],
      ['自转周期', '25.4 天'],
      ['年龄', '46 亿年'],
      ['质量占比', '99.86%'],
    ],
    composition: [
      ['氢', '73%'],
      ['氦', '25%'],
      ['其他元素', '2%'],
    ],
  },
  mercury: {
    id: 'mercury',
    index: '01',
    name: '水星',
    en: 'MERCURY',
    type: '类地行星',
    tagline: '离太阳最近、也最极端的岩石世界',
    description:
      '水星没有真正的大气层，昼夜温差超过 600°C。它的铁质核心占据了行星体积的大部分，表面布满古老撞击坑。',
    fact: '水星上的一次日出到下一次日出长达 176 个地球日，比它的一年还长。',
    color: '#b7b2aa',
    radius: 1.3,
    orbitRadius: 27,
    orbitSpeed: 0.062,
    rotationSpeed: 0.035,
    axialTilt: 0.03,
    startAngle: 0.55,
    distanceAU: 0.39,
    texture: 'mercury',
    atmosphere: { color: 0x8f8a80, strength: 0.12 },
    detailFactor: 5.2,
    stats: [
      ['直径', '4,879 km'],
      ['质量', '0.055 地球'],
      ['公转周期', '88 天'],
      ['自转周期', '58.6 天'],
      ['表面温度', '-173 ~ 427°C'],
      ['卫星数量', '0'],
    ],
    composition: [
      ['铁镍核心', '85%'],
      ['硅酸盐地幔', '13%'],
      ['表面尘埃', '2%'],
    ],
  },
  venus: {
    id: 'venus',
    index: '02',
    name: '金星',
    en: 'VENUS',
    type: '类地行星',
    tagline: '被浓厚云层包裹的温室行星',
    description:
      '金星的大小与地球接近，却被二氧化碳大气与硫酸云层笼罩。失控温室效应让地表温度稳定在 464°C，比水星更热。',
    fact: '金星自转方向与大多数行星相反，一个金星日比一个金星年更长。',
    color: '#e2c58c',
    radius: 2.3,
    orbitRadius: 36,
    orbitSpeed: 0.041,
    rotationSpeed: -0.018,
    axialTilt: 177.4,
    startAngle: 2.25,
    distanceAU: 0.72,
    texture: 'venus',
    atmosphere: { color: 0xe5c783, strength: 0.8 },
    detailFactor: 4.8,
    stats: [
      ['直径', '12,104 km'],
      ['质量', '0.815 地球'],
      ['公转周期', '224.7 天'],
      ['自转周期', '243 天 · 逆行'],
      ['表面温度', '464°C'],
      ['卫星数量', '0'],
    ],
    composition: [
      ['二氧化碳', '96.5%'],
      ['氮气', '3.5%'],
      ['硫酸云', '微量'],
    ],
  },
  earth: {
    id: 'earth',
    index: '03',
    name: '地球',
    en: 'EARTH',
    type: '类地行星',
    tagline: '目前已知唯一存在生命的天体',
    description:
      '地球拥有液态水海洋、富氧大气与活跃的板块运动。磁层屏蔽了太阳风，板块循环调节着气候，让复杂生命得以延续。',
    fact: '地球并不是完美的球体：赤道半径比极半径多出约 21 公里。',
    color: '#6fb7ff',
    radius: 2.5,
    orbitRadius: 47,
    orbitSpeed: 0.025,
    rotationSpeed: 0.13,
    axialTilt: 23.44,
    startAngle: 4.1,
    distanceAU: 1.0,
    atmosphere: { color: 0x4e8fe8, strength: 0.95 },
    detailFactor: 5.4,
    moons: [
      { name: '月球', radius: 0.38, orbitRadius: 4.25, speed: 0.075, color: 0x9d978d },
    ],
    stats: [
      ['直径', '12,742 km'],
      ['质量', '1 地球'],
      ['公转周期', '365.25 天'],
      ['自转周期', '23 时 56 分'],
      ['平均温度', '15°C'],
      ['卫星数量', '1'],
    ],
    composition: [
      ['氮气', '78%'],
      ['氧气', '21%'],
      ['其他气体', '1%'],
    ],
    station: true,
  },
  mars: {
    id: 'mars',
    index: '04',
    name: '火星',
    en: 'MARS',
    type: '类地行星',
    tagline: '锈红色荒漠与太阳系最高的火山',
    description:
      '火星表面覆盖着氧化铁尘埃。这里曾存在河流与湖泊，如今只剩下极冠、干涸河床和太阳系最高的奥林帕斯山。',
    fact: '奥林帕斯山高约 22 公里，接近珠穆朗玛峰的三倍。',
    color: '#d97b5b',
    radius: 1.8,
    orbitRadius: 58,
    orbitSpeed: 0.017,
    rotationSpeed: 0.12,
    axialTilt: 25.19,
    startAngle: 5.35,
    distanceAU: 1.52,
    texture: 'mars',
    atmosphere: { color: 0xc66b48, strength: 0.25 },
    detailFactor: 5.4,
    moons: [
      { name: '火卫一', radius: 0.08, orbitRadius: 2.45, speed: 0.34, color: 0x8b7d70 },
      { name: '火卫二', radius: 0.06, orbitRadius: 2.95, speed: 0.22, color: 0x9c8d7e },
    ],
    stats: [
      ['直径', '6,779 km'],
      ['质量', '0.107 地球'],
      ['公转周期', '687 天'],
      ['自转周期', '24 时 37 分'],
      ['平均温度', '-63°C'],
      ['卫星数量', '2'],
    ],
    composition: [
      ['二氧化碳', '95%'],
      ['氮气', '2.8%'],
      ['氩气', '2%'],
    ],
  },
  jupiter: {
    id: 'jupiter',
    index: '05',
    name: '木星',
    en: 'JUPITER',
    type: '气态巨行星',
    tagline: '太阳系的巨人，拥有最强烈的风暴',
    description:
      '木星的质量是其余七颗行星总和的 2.5 倍。它没有固体表面，氢氦大气中翻滚着带状云层与持续数百年的巨型风暴。',
    fact: '大红斑的直径可以容纳一个多地球，风速超过 400 km/h。',
    color: '#d9b58b',
    radius: 6.3,
    orbitRadius: 86,
    orbitSpeed: 0.0085,
    rotationSpeed: 0.22,
    axialTilt: 3.13,
    startAngle: 1.2,
    distanceAU: 5.2,
    texture: 'jupiter',
    atmosphere: { color: 0xd8c09b, strength: 0.4 },
    detailFactor: 4.6,
    moons: [
      { name: '木卫一', radius: 0.15, orbitRadius: 8.4, speed: 0.22, color: 0xd8b86a },
      { name: '木卫二', radius: 0.14, orbitRadius: 9.5, speed: 0.17, color: 0xc7c3b6 },
      { name: '木卫三', radius: 0.22, orbitRadius: 10.7, speed: 0.13, color: 0x9d978d },
      { name: '木卫四', radius: 0.2, orbitRadius: 12.0, speed: 0.1, color: 0x7e776e },
    ],
    stats: [
      ['直径', '139,820 km'],
      ['质量', '317.8 地球'],
      ['公转周期', '11.86 年'],
      ['自转周期', '9 时 56 分'],
      ['云顶温度', '-110°C'],
      ['卫星数量', '95'],
    ],
    composition: [
      ['氢', '90%'],
      ['氦', '10%'],
      ['重元素', '微量'],
    ],
  },
  saturn: {
    id: 'saturn',
    index: '06',
    name: '土星',
    en: 'SATURN',
    type: '气态巨行星',
    tagline: '以壮丽环系闻名的淡金色巨人',
    description:
      '土星环由无数冰粒与岩屑组成，延展超过 28 万公里，却平均只有几十米厚。土星本身是太阳系密度最低的行星。',
    fact: '土星的平均密度小于水，如果存在足够大的海洋，它会浮起来。',
    color: '#e3cf9c',
    radius: 5.2,
    orbitRadius: 108,
    orbitSpeed: 0.005,
    rotationSpeed: 0.2,
    axialTilt: 26.73,
    axialTiltX: 18,
    startAngle: 3.0,
    distanceAU: 9.58,
    texture: 'saturn',
    atmosphere: { color: 0xe2d0a0, strength: 0.38 },
    detailFactor: 6.9,
    rings: { inner: 1.36, outer: 2.3, tint: 0xe1cfa4, opacity: 0.92 },
    moons: [
      { name: '土卫六', radius: 0.22, orbitRadius: 13.7, speed: 0.08, color: 0xc39b5e },
      { name: '土卫五', radius: 0.09, orbitRadius: 10.2, speed: 0.12, color: 0xb9b3a7 },
    ],
    stats: [
      ['直径', '116,460 km'],
      ['质量', '95.2 地球'],
      ['公转周期', '29.45 年'],
      ['自转周期', '10 时 42 分'],
      ['云顶温度', '-140°C'],
      ['卫星数量', '146'],
    ],
    composition: [
      ['氢', '96%'],
      ['氦', '3%'],
      ['甲烷等', '1%'],
    ],
  },
  uranus: {
    id: 'uranus',
    index: '07',
    name: '天王星',
    en: 'URANUS',
    type: '冰巨行星',
    tagline: '躺着自转的青色冰巨星',
    description:
      '天王星的自转轴几乎躺倒在轨道平面上，可能源于早期的巨大撞击。甲烷吸收红光，使它呈现出平静的青绿色。',
    fact: '天王星的一年相当于 84 个地球年，而一个季节持续 21 年。',
    color: '#8ce1df',
    radius: 3.9,
    orbitRadius: 128,
    orbitSpeed: 0.0032,
    rotationSpeed: -0.14,
    axialTilt: 97.77,
    startAngle: 0.65,
    distanceAU: 19.2,
    texture: 'uranus',
    atmosphere: { color: 0x92e3df, strength: 0.55 },
    detailFactor: 7.8,
    rings: { inner: 1.55, outer: 1.92, tint: 0x9caeb0, opacity: 0.28 },
    moons: [
      { name: '天卫三', radius: 0.12, orbitRadius: 8.7, speed: 0.1, color: 0x8d8d88 },
    ],
    stats: [
      ['直径', '50,724 km'],
      ['质量', '14.5 地球'],
      ['公转周期', '84 年'],
      ['自转周期', '17 时 14 分 · 逆行'],
      ['云顶温度', '-195°C'],
      ['卫星数量', '28'],
    ],
    composition: [
      ['氢', '83%'],
      ['氦', '15%'],
      ['甲烷', '2%'],
    ],
  },
  neptune: {
    id: 'neptune',
    index: '08',
    name: '海王星',
    en: 'NEPTUNE',
    type: '冰巨行星',
    tagline: '太阳系最遥远、风暴最猛烈的行星',
    description:
      '海王星是距离太阳最远的行星，也是第一颗通过数学计算预测后被发现的行星。它的深蓝大气中存在着超音速风暴。',
    fact: '海王星上的风速可达 2,100 km/h，是太阳系中最快的风。',
    color: '#6d8df5',
    radius: 3.7,
    orbitRadius: 146,
    orbitSpeed: 0.0023,
    rotationSpeed: 0.16,
    axialTilt: 28.32,
    startAngle: 4.8,
    distanceAU: 30.1,
    texture: 'neptune',
    atmosphere: { color: 0x5278ee, strength: 0.65 },
    detailFactor: 5.2,
    moons: [
      { name: '海卫一', radius: 0.14, orbitRadius: 5.9, speed: 0.09, color: 0xb9b6aa },
    ],
    stats: [
      ['直径', '49,244 km'],
      ['质量', '17.1 地球'],
      ['公转周期', '164.8 年'],
      ['自转周期', '16 时 6 分'],
      ['云顶温度', '-200°C'],
      ['卫星数量', '16'],
    ],
    composition: [
      ['氢', '80%'],
      ['氦', '19%'],
      ['甲烷', '1%'],
    ],
  },
};

const sunVertexShader = /* glsl */ `
  varying vec3 vObjectNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vObjectNormal = normalize(normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const sunFragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vObjectNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  float hash31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  float valueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    return mix(nxy0, nxy1, f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * valueNoise(p);
      p = p * 2.07 + vec3(5.1, 7.3, 3.7);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 p = normalize(vObjectNormal);
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    float slow = fbm(p * 4.0 + vec3(uTime * 0.018, uTime * 0.007, 0.0));
    float fine = fbm(p * 18.0 + vec3(uTime * 0.03, 0.0, uTime * 0.012));
    float granule = fbm(p * 44.0 - vec3(uTime * 0.045, 0.0, 0.0));
    float cells = fbm(p * 92.0 + vec3(0.0, uTime * 0.02, 0.0));
    float spots = smoothstep(0.73, 0.9, fbm(p * 9.0 + vec3(3.0, uTime * 0.008, 0.0)));

    vec3 deep = vec3(0.42, 0.055, 0.006);
    vec3 mid = vec3(1.0, 0.34, 0.025);
    vec3 hot = vec3(1.0, 0.82, 0.37);
    vec3 color = mix(deep, mid, smoothstep(0.16, 0.62, slow + fine * 0.2));
    color = mix(color, hot, smoothstep(0.52, 0.88, fine + granule * 0.2));
    color *= 0.7 + 0.55 * granule + 0.18 * cells;
    color *= 1.0 - spots * 0.42;

    float mu = max(dot(N, V), 0.0);
    float limb = pow(mu, 0.42);
    color *= 0.34 + 0.86 * limb;
    color += vec3(1.0, 0.55, 0.1) * pow(1.0 - mu, 2.8) * 0.42;

    gl_FragColor = vec4(color * 1.08, 1.0);
  }
`;

const planetVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const planetFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uSunDirection;
  uniform vec3 uAtmosphereColor;
  uniform float uAtmosphereStrength;
  uniform float uSpecularStrength;
  uniform float uRoughness;
  uniform float uAmbient;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 L = normalize(uSunDirection);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    float ndl = dot(N, L);
    float day = smoothstep(-0.16, 0.2, ndl);
    float direct = max(ndl, 0.0);

    vec3 base = texture2D(uMap, vUv).rgb;
    vec3 color = base * (uAmbient + direct * 0.9);
    color += base * 0.012;

    vec3 H = normalize(L + V);
    float specular = pow(max(dot(N, H), 0.0), mix(110.0, 22.0, uRoughness));
    color += vec3(1.0, 0.94, 0.83) * specular * uSpecularStrength * day;

    float sunset = pow(1.0 - abs(ndl), 8.0) * smoothstep(-0.3, 0.25, ndl);
    color += vec3(0.32, 0.13, 0.04) * sunset * 0.34;

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
    color += uAtmosphereColor * fresnel * uAtmosphereStrength * (0.08 + day * 0.92);

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
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    vec3 L = normalize(uSunDirection);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.5);
    float sunlit = smoothstep(-0.25, 0.4, dot(N, L));
    gl_FragColor = vec4(uColor, fresnel * (0.08 + sunlit * 0.92) * uStrength);
  }
`;

const ringVertexShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying float vRadius;
  void main() {
    vRadius = length(position.xy);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const ringFragmentShader = /* glsl */ `
  uniform float uInner;
  uniform float uOuter;
  uniform float uOpacity;
  uniform vec3 uTint;
  uniform vec3 uSunDirection;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying float vRadius;

  void main() {
    float t = clamp((vRadius - uInner) / (uOuter - uInner), 0.0, 1.0);
    float band = 0.56
      + 0.18 * sin(t * 71.0 + 0.6)
      + 0.12 * sin(t * 163.0 + 2.1)
      + 0.08 * sin(t * 311.0 + 4.2);
    band = max(band, 0.12);

    float cassini = smoothstep(0.045, 0.008, abs(t - 0.64));
    float encke = smoothstep(0.025, 0.004, abs(t - 0.87));
    band *= 1.0 - cassini * 0.86;
    band *= 1.0 - encke * 0.55;

    float edge = smoothstep(0.0, 0.055, t) * (1.0 - smoothstep(0.93, 1.0, t));
    float alpha = band * edge * uOpacity;

    vec3 N = normalize(vWorldNormal);
    vec3 L = normalize(uSunDirection);
    float light = 0.42 + abs(dot(N, L)) * 0.58;
    vec3 color = mix(uTint * 0.58, uTint * 1.12, band) * light;
    gl_FragColor = vec4(color, alpha);
  }
`;

function createAtmosphereShell(radius, color, strength, sunDirection) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: sunDirection },
      uColor: { value: new THREE.Color(color) },
      uStrength: { value: strength },
    },
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.022, 64, 40), material);
  mesh.renderOrder = 2;
  return mesh;
}

function createPlanetMaterial(texture, body) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
      uAtmosphereColor: { value: new THREE.Color(body.atmosphere?.color ?? 0x6688aa) },
      uAtmosphereStrength: { value: body.atmosphere?.strength ?? 0.2 },
      uSpecularStrength: { value: body.id === 'mercury' ? 0.02 : 0.08 },
      uRoughness: { value: 0.78 },
      uAmbient: { value: 0.035 },
    },
    vertexShader: planetVertexShader,
    fragmentShader: planetFragmentShader,
  });
}

function createEarthMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
      uTime: { value: 0 },
    },
    vertexShader: earthVertexShader,
    fragmentShader: earthFragmentShader,
  });
}

function createSun() {
  const group = new THREE.Group();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: sunVertexShader,
    fragmentShader: sunFragmentShader,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(13, 96, 64), material);
  group.add(mesh);

  const glowTexture = createGlowTexture('rgba(255,185,105,1)');
  const coronaMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffb15d,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.7,
  });
  const corona = new THREE.Sprite(coronaMaterial);
  corona.scale.set(50, 50, 1);
  group.add(corona);

  const outerMaterial = coronaMaterial.clone();
  outerMaterial.color.set(0xffd39a);
  outerMaterial.opacity = 0.18;
  const outerCorona = new THREE.Sprite(outerMaterial);
  outerCorona.scale.set(96, 96, 1);
  group.add(outerCorona);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(13.6, 16, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
  );
  hit.userData.bodyId = 'sun';
  group.add(hit);

  group.userData.bodyId = 'sun';
  return { group, mesh, material, hit, corona, outerCorona };
}

function createOrbitLine(radius, color) {
  const points = [];
  for (let i = 0; i < 260; i++) {
    const angle = (i / 260) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const line = new THREE.LineLoop(geometry, material);
  line.renderOrder = -1;
  return line;
}

function createRing(body, sunDirection) {
  const inner = body.radius * body.rings.inner;
  const outer = body.radius * body.rings.outer;
  const geometry = new THREE.RingGeometry(inner, outer, 160, 1);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uInner: { value: inner },
      uOuter: { value: outer },
      uOpacity: { value: body.rings.opacity },
      uTint: { value: new THREE.Color(body.rings.tint) },
      uSunDirection: { value: sunDirection },
    },
    vertexShader: ringVertexShader,
    fragmentShader: ringFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 2;
  return mesh;
}

function createMoon(moon) {
  const material = new THREE.MeshStandardMaterial({
    color: moon.color,
    roughness: 0.9,
    metalness: 0.02,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(moon.radius, 24, 16), material);
  mesh.userData.moon = moon;
  return mesh;
}

function createAsteroidBelt() {
  const count = 720;
  const geometry = new THREE.IcosahedronGeometry(0.18, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x776e62,
    roughness: 0.92,
    metalness: 0.05,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();
  const random = (() => {
    let s = 6174;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  })();

  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 65 + random() * 13;
    const scale = 0.35 + random() * 1.8;
    dummy.position.set(
      Math.cos(angle) * radius,
      (random() - 0.5) * 2.2,
      Math.sin(angle) * radius,
    );
    dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function createStationOrbit(stationModel) {
  const plane = new THREE.Group();
  plane.rotation.z = 0.34;
  plane.visible = false;

  const orbitRadius = 3.4;
  const points = [];
  for (let i = 0; i < 160; i++) {
    const angle = (i / 160) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius));
  }
  const orbitLine = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: 0x86e8ff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  plane.add(orbitLine);

  const orbitGroup = new THREE.Group();
  const station = stationModel.clone(true);
  station.scale.setScalar(0.024);
  station.position.set(orbitRadius, 0, 0);
  station.rotation.y = Math.PI * 0.5;
  orbitGroup.add(station);

  const markerGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture('rgba(143,232,246,1)'),
      color: 0x8fe8f6,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    }),
  );
  markerGlow.scale.setScalar(0.9);
  markerGlow.position.set(orbitRadius, 0.1, 0);
  orbitGroup.add(markerGlow);

  plane.add(orbitGroup);
  plane.userData.orbitGroup = orbitGroup;
  plane.userData.station = station;
  return plane;
}

export function createSolarSystem(stationModel) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010208);

  const stars = createStars(6800);
  scene.add(stars);

  const ambient = new THREE.AmbientLight(0x2a3b50, 0.55);
  scene.add(ambient);

  const sunLight = new THREE.PointLight(0xfff1de, 3.4, 0, 0);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  const sun = createSun();
  scene.add(sun.group);

  const orbitLines = new Map();
  const bodies = new Map();
  const clickTargets = [];
  const tmpVector = new THREE.Vector3();

  for (const id of SOLAR_ORDER) {
    const body = SOLAR_BODIES[id];
    if (id === 'sun') {
      bodies.set(id, {
        ...body,
        group: sun.group,
        mesh: sun.mesh,
        material: sun.material,
        atmosphere: null,
        ring: null,
        moons: [],
      });
      clickTargets.push(sun.hit);
      continue;
    }

    const group = new THREE.Group();
    const angle = body.startAngle ?? Math.random() * Math.PI * 2;
    group.position.set(
      Math.cos(angle) * body.orbitRadius,
      0,
      Math.sin(angle) * body.orbitRadius,
    );
    group.userData.bodyId = id;

    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.set(
      THREE.MathUtils.degToRad(body.axialTiltX ?? 0),
      0,
      THREE.MathUtils.degToRad(body.axialTilt),
    );
    group.add(tiltGroup);

    let material;
    if (id === 'earth') {
      material = createEarthMaterial();
    } else {
      material = createPlanetMaterial(getPlanetTexture(id), body);
    }

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(body.radius, 96, 64), material);
    mesh.rotation.y = 0.6 + Math.random() * 2.2;
    mesh.userData.bodyId = id;
    tiltGroup.add(mesh);

    let atmosphere = null;
    if (body.atmosphere) {
      atmosphere = createAtmosphereShell(
        body.radius,
        body.atmosphere.color,
        body.atmosphere.strength,
        material.uniforms.uSunDirection.value,
      );
      tiltGroup.add(atmosphere);
    }

    let ring = null;
    if (body.rings) {
      ring = createRing(body, material.uniforms.uSunDirection.value);
      tiltGroup.add(ring);
    }

    const moonMeshes = [];
    if (body.moons) {
      for (const moon of body.moons) {
        const meshMoon = createMoon(moon);
        meshMoon.userData.angle = Math.random() * Math.PI * 2;
        group.add(meshMoon);
        moonMeshes.push(meshMoon);
      }
    }

    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(2.4, body.radius * 2.1), 16, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
    );
    hit.userData.bodyId = id;
    group.add(hit);
    clickTargets.push(hit);

    scene.add(group);

    const orbitLine = createOrbitLine(body.orbitRadius, body.color);
    scene.add(orbitLine);
    orbitLines.set(id, orbitLine);

    let stationOrbit = null;
    if (body.station) {
      stationOrbit = createStationOrbit(stationModel);
      group.add(stationOrbit);
    }

    bodies.set(id, {
      ...body,
      group,
      mesh,
      tiltGroup,
      material,
      atmosphere,
      ring,
      moons: moonMeshes,
      stationOrbit,
      angle,
    });
  }

  const asteroidBelt = createAsteroidBelt();
  scene.add(asteroidBelt);

  const sunDirection = new THREE.Vector3();
  let detailId = null;

  function updateSunDirection(body) {
    sunDirection.copy(body.group.position).multiplyScalar(-1).normalize();
    if (body.id === 'sun') sunDirection.set(0, 0, 1);
    if (body.material.uniforms?.uSunDirection) {
      body.material.uniforms.uSunDirection.value.copy(sunDirection);
    }
    if (body.atmosphere?.material.uniforms.uSunDirection) {
      body.atmosphere.material.uniforms.uSunDirection.value.copy(sunDirection);
    }
    if (body.ring?.material.uniforms.uSunDirection) {
      body.ring.material.uniforms.uSunDirection.value.copy(sunDirection);
    }
  }

  function update(elapsed, dt, options = {}) {
    const detail = options.detail ?? false;
    const selected = options.selected ?? null;
    if (detailId !== selected) detailId = selected;

    stars.material.uniforms.uTime.value = elapsed;
    sun.material.uniforms.uTime.value = elapsed;
    sun.mesh.rotation.y += (SOLAR_BODIES.sun.rotationSpeed || 0) * dt;
    sun.group.rotation.y = Math.sin(elapsed * 0.02) * 0.05;

    for (const body of bodies.values()) {
      if (body.id === 'sun') {
        updateSunDirection(body);
        continue;
      }

      if (!detail) {
        body.angle += body.orbitSpeed * dt;
        body.group.position.set(
          Math.cos(body.angle) * body.orbitRadius,
          0,
          Math.sin(body.angle) * body.orbitRadius,
        );
      }

      body.mesh.rotation.y += body.rotationSpeed * dt;
      updateSunDirection(body);

      if (body.id === 'earth') {
        body.material.uniforms.uTime.value = elapsed;
      }

      for (const moonMesh of body.moons) {
        const moon = moonMesh.userData.moon;
        moonMesh.userData.angle = (moonMesh.userData.angle ?? 0) + moon.speed * dt;
        const a = moonMesh.userData.angle;
        moonMesh.position.set(
          Math.cos(a) * moon.orbitRadius,
          Math.sin(a * 0.7) * moon.orbitRadius * 0.16,
          Math.sin(a) * moon.orbitRadius,
        );
        moonMesh.rotation.y += dt * 0.2;
      }

      if (body.stationOrbit) {
        body.stationOrbit.visible = detail && selected === 'earth';
        if (body.stationOrbit.visible) {
          body.stationOrbit.userData.orbitGroup.rotation.y = 0.95 + elapsed * 0.04;
        }
      }
    }

    if (!detail) {
      asteroidBelt.rotation.y += dt * 0.0035;
    }

    if (options.hovered && orbitLines.has(options.hovered)) {
      for (const [id, line] of orbitLines) {
        line.material.opacity = id === options.hovered ? 0.5 : 0.14;
      }
    } else {
      for (const line of orbitLines.values()) {
        line.material.opacity = 0.14;
      }
    }
  }

  function setDetail(id) {
    detailId = id;
    const isSun = id === 'sun';
    sun.group.visible = isSun;
    if (isSun) {
      sun.corona.scale.set(27, 27, 1);
      sun.corona.material.opacity = 0.16;
      sun.outerCorona.scale.set(52, 52, 1);
      sun.outerCorona.material.opacity = 0.025;
    } else {
      sun.corona.scale.set(50, 50, 1);
      sun.corona.material.opacity = 0.7;
      sun.outerCorona.scale.set(96, 96, 1);
      sun.outerCorona.material.opacity = 0.18;
    }
    for (const body of bodies.values()) {
      if (body.id === 'sun') continue;
      const active = body.id === id;
      body.group.visible = active;
      if (body.stationOrbit) body.stationOrbit.visible = active && body.id === 'earth';
    }
    for (const line of orbitLines.values()) line.visible = false;
    asteroidBelt.visible = false;
    return isSun;
  }

  function showOverview() {
    detailId = null;
    sun.group.visible = true;
    sun.corona.scale.set(50, 50, 1);
    sun.corona.material.opacity = 0.7;
    sun.outerCorona.scale.set(96, 96, 1);
    sun.outerCorona.material.opacity = 0.18;
    for (const body of bodies.values()) {
      if (body.id === 'sun') continue;
      body.group.visible = true;
      if (body.stationOrbit) body.stationOrbit.visible = false;
    }
    for (const line of orbitLines.values()) line.visible = true;
    asteroidBelt.visible = true;
  }

  function getDetailView(id) {
    const body = bodies.get(id);
    if (!body) return null;
    const factor = body.detailFactor ?? 4.8;
    const distance = id === 'sun' ? 58 : body.radius * factor + 1.4;

    let direction;
    if (id === 'sun') {
      direction = new THREE.Vector3(0.72, 0.38, 1.0).normalize();
    } else {
      // Approach the planet from its sunlit side so the visible disc is legible.
      const toSun = body.group.position.clone().multiplyScalar(-1).normalize();
      const tangent = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), toSun).normalize();
      direction = toSun
        .multiplyScalar(1.15)
        .addScaledVector(tangent, 0.62)
        .add(new THREE.Vector3(0, 0.46, 0))
        .normalize();
    }

    const position = body.group.position.clone().addScaledVector(direction, distance);
    const viewDirection = body.group.position.clone().sub(position).normalize();
    const right = new THREE.Vector3().crossVectors(viewDirection, new THREE.Vector3(0, 1, 0)).normalize();
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const horizontalOffset = distance * Math.tan(THREE.MathUtils.degToRad(19)) * aspect * 0.14;
    const target = body.group.position.clone().addScaledVector(right, horizontalOffset);

    return {
      position: [position.x, position.y, position.z],
      target: [target.x, target.y, target.z],
      distance,
      body,
    };
  }

  function getAnchors() {
    return SOLAR_ORDER.map((id) => {
      const body = bodies.get(id);
      const offset = id === 'sun' ? 15.5 : body.radius + 0.85;
      return {
        id,
        name: body.name,
        color: body.color,
        position: body.group.position.clone().add(new THREE.Vector3(0, offset, 0)),
      };
    });
  }

  function getStationAnchor() {
    const earth = bodies.get('earth');
    if (!earth?.stationOrbit?.visible) return null;
    const station = earth.stationOrbit.userData.station;
    return station.getWorldPosition(new THREE.Vector3());
  }

  function getBody(id) {
    return bodies.get(id) ?? null;
  }

  function getClickTargets() {
    return clickTargets;
  }

  function setPixelRatio(ratio) {
    stars.material.uniforms.uPixelRatio.value = ratio;
  }

  return {
    scene,
    bodies,
    sun,
    sunLight,
    stars,
    asteroidBelt,
    update,
    setDetail,
    showOverview,
    getDetailView,
    getAnchors,
    getStationAnchor,
    getBody,
    getClickTargets,
    setPixelRatio,
    get detailId() {
      return detailId;
    },
  };
}
