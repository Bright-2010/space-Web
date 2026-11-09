import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createEnvironment } from './environment.js';
import { createMaterials } from './materials.js';
import { buildStation } from './station.js';
import { createSolarSystem, SOLAR_BODIES, SOLAR_ORDER } from './solarSystem.js';
import { createEnvTexture } from './textures.js';

const canvas = document.querySelector('#space');
const loader = document.querySelector('#loader');
const loaderBar = document.querySelector('#loader-bar');
const loaderPercent = document.querySelector('#loader-percent');
const loaderStatus = document.querySelector('#loader-status');
const fader = document.querySelector('#view-fader');
const hotspotLayer = document.querySelector('#hotspots');
const telemetryAltitude = document.querySelector('#telemetry-altitude');
const telemetrySpeed = document.querySelector('#telemetry-speed');
const telemetryPeriod = document.querySelector('#telemetry-period');
const telemetryClock = document.querySelector('#telemetry-clock');
const infoPanel = document.querySelector('#info-panel');

const planetListElement = document.querySelector('#planet-list');
const planetQuicknav = document.querySelector('#planet-quicknav');
const solarLabelsElement = document.querySelector('#solar-labels');
const solarStationLabel = document.querySelector('#solar-station-label');
const planetDetail = document.querySelector('#planet-detail');
const planetIndex = document.querySelector('#planet-index');
const planetType = document.querySelector('#planet-type');
const planetName = document.querySelector('#planet-name');
const planetEn = document.querySelector('#planet-en');
const planetTagline = document.querySelector('#planet-tagline');
const planetDescription = document.querySelector('#planet-description');
const planetStats = document.querySelector('#planet-stats');
const planetCompositionLabel = document.querySelector('#planet-composition-label');
const planetComposition = document.querySelector('#planet-composition');
const planetFact = document.querySelector('#planet-fact');
const planetWatermark = document.querySelector('#planet-watermark');
const earthStationCard = document.querySelector('#earth-station-card');
const enterStationButton = document.querySelector('#enter-station');
const planetBackButton = document.querySelector('#planet-back');
const modeButtons = [...document.querySelectorAll('.mode-button')];
const liveLabel = document.querySelector('#live-label');
const topCoordA = document.querySelector('#top-coord-a');
const topCoordB = document.querySelector('#top-coord-b');

const MODULES = {
  overview: {
    index: 'TQ',
    title: '轨道综合体',
    en: 'TIANQIONG ORBITAL COMPLEX',
    role: '近地轨道 · 长期驻留平台',
    body: '一座在寂静真空中生长的前哨。模块化舱段、可展开太阳翼与自主机械臂，共同维持六名航天员的轨道生活。',
    specs: [
      ['在轨质量', '420 t'],
      ['整体翼展', '62.9 m'],
      ['额定乘员', '6 人'],
    ],
    camera: { position: [35, 17.5, 56], target: [0, 0.5, 0], auto: true },
  },
  core: {
    index: '01',
    title: '天枢核心舱',
    en: 'TQ-01 / CORE MODULE',
    role: '指挥中枢 · 生命保障',
    body: '空间站的控制与生活中心。环形压力舱壁内布置了交会对接、环境控制与生保系统，穹顶观察窗始终朝向地球。',
    specs: [
      ['舱段长度', '10.4 m'],
      ['最大直径', '4.3 m'],
      ['对接端口', '5 个'],
    ],
    camera: { position: [18, 6.5, 29.5], target: [0, -2.4, 1.6] },
  },
  lab: {
    index: '02',
    title: '问天实验舱',
    en: 'WENTIAN / SCIENCE LAB',
    role: '微重力科学 · 暴露实验',
    body: '面向材料、流体与生命科学的微重力实验平台。舱外挂载点可支持真空暴露实验，并为空间站提供额外姿态控制能力。',
    specs: [
      ['舱段长度', '6.4 m'],
      ['实验机柜', '12 个'],
      ['舱外载荷', '8 个'],
    ],
    camera: { position: [21, 8, 31], target: [5.2, -2, 5.2] },
  },
  solar: {
    index: '03',
    title: '曦和太阳翼',
    en: 'XIHE / SOLAR ARRAY',
    role: '主电源 · 双轴对日',
    body: '四组高展弦比硅基太阳翼，在日照区展开至近 63 米。双轴万向节持续追踪太阳矢量，为整站提供约 120 千瓦电力。',
    specs: [
      ['单翼长度', '15.7 m'],
      ['总发电量', '120 kW'],
      ['对日精度', '±0.1°'],
    ],
    camera: { position: [-33, 12, 29], target: [-21, 6, 0] },
  },
  arm: {
    index: '04',
    title: '玄戈机械臂',
    en: 'XUANGE / ROBOTIC ARM',
    role: '在轨操作 · 舱外巡检',
    body: '七自由度空间机械臂，可在桁架表面移动并完成舱段转位、载荷安装与舱外状态巡检。末端执行器支持毫米级定位。',
    specs: [
      ['展开长度', '10.5 m'],
      ['自由度', '7 DOF'],
      ['末端精度', '5 mm'],
    ],
    camera: { position: [20, 11, 20], target: [8.8, 4.9, 1.1] },
  },
  capsule: {
    index: '05',
    title: '神舟载人飞船',
    en: 'SHENZHOU / CREW VEHICLE',
    role: '乘员运输 · 应急返回',
    body: '停泊于核心舱前向端口，承担航天员往返与应急救生任务。返回舱外覆烧蚀防热层，可在再入段承受上千摄氏度高温。',
    specs: [
      ['全长', '9.0 m'],
      ['乘员', '3 人'],
      ['停泊时长', '180 d'],
    ],
    camera: { position: [11, 3, 6], target: [0, -2.3, -9.4] },
  },
};

const SOLAR_OVERVIEW = {
  position: [139, 112, 246],
  target: [0, 0, 0],
};

const state = {
  mode: 'solar',
  selected: 'overview',
  selectedPlanet: null,
  hoveredPlanet: null,
  autoCruise: true,
  solarTracking: true,
  tween: null,
  lastInteraction: -10000,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  modeToken: 0,
};

// ---------------------------------------------------------------------------
// Renderer and post-processing
// ---------------------------------------------------------------------------

let renderer;

try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
} catch (error) {
  loaderStatus.textContent = '无法初始化 WebGL · 请检查浏览器硬件加速设置';
  loaderPercent.textContent = 'ERR';
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x010208, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010208);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 1200);
camera.position.set(168, 136, 292);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 16;
controls.maxDistance = 620;
controls.minPolarAngle = Math.PI * 0.06;
controls.maxPolarAngle = Math.PI * 0.94;
controls.autoRotateSpeed = 0.09;
controls.autoRotate = false;
controls.target.set(0, 0, 0);
controls.update();

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
composer.setSize(window.innerWidth, window.innerHeight);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.58,
  0.7,
  0.84,
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------------------
// Station scene
// ---------------------------------------------------------------------------

const envSource = createEnvTexture();
envSource.mapping = THREE.EquirectangularReflectionMapping;
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
const envTarget = pmremGenerator.fromEquirectangular(envSource);
scene.environment = envTarget.texture;
scene.environmentIntensity = 0.9;
envSource.dispose();
pmremGenerator.dispose();

const environment = createEnvironment(scene, renderer);
const materials = createMaterials(renderer);
const station = buildStation(materials);

station.root.traverse((object) => {
  if (object.isMesh) object.frustumCulled = true;
});
scene.add(station.root);

if (environment.stars.material.uniforms.uPixelRatio) {
  environment.stars.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
}

// ---------------------------------------------------------------------------
// Solar system scene
// ---------------------------------------------------------------------------

const solarSystem = createSolarSystem(station.root);
let activeScene = solarSystem.scene;
renderPass.scene = activeScene;
solarSystem.setPixelRatio(renderer.getPixelRatio());

// ---------------------------------------------------------------------------
// Camera transitions
// ---------------------------------------------------------------------------

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function flyTo(position, target, duration = 1.8) {
  state.tween = {
    fromPosition: camera.position.clone(),
    toPosition: new THREE.Vector3(...position),
    fromTarget: controls.target.clone(),
    toTarget: new THREE.Vector3(...target),
    startedAt: performance.now(),
    duration,
  };
  state.lastInteraction = performance.now();
  controls.autoRotate = false;
  controls.enabled = false;
}

function setCameraPose(position, target) {
  state.tween = null;
  controls.enabled = true;
  camera.position.set(position[0], position[1], position[2]);
  controls.target.set(target[0], target[1], target[2]);
  controls.update();
}

function updateTween() {
  if (!state.tween) return;
  const tween = state.tween;
  const t = Math.min(1, (performance.now() - tween.startedAt) / (tween.duration * 1000));
  const eased = easeInOutCubic(t);
  camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased);
  controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased);
  if (t >= 1) {
    state.tween = null;
    controls.enabled = true;
    state.lastInteraction = performance.now();
  }
}

// ---------------------------------------------------------------------------
// Station focus
// ---------------------------------------------------------------------------

function setSelected(id, { fly = true } = {}) {
  if (state.mode !== 'station') return;
  const module = MODULES[id];
  if (!module) return;
  state.selected = id;

  document.querySelectorAll('[data-focus]').forEach((element) => {
    element.classList.toggle('is-active', element.dataset.focus === id);
  });
  document.querySelectorAll('.hotspot').forEach((element) => {
    element.classList.toggle('is-active', element.dataset.focus === id);
  });

  infoPanel.classList.add('is-switching');
  window.setTimeout(() => {
    document.querySelector('#info-index').textContent = module.index;
    document.querySelector('#info-title').textContent = module.title;
    document.querySelector('#info-en').textContent = module.en;
    document.querySelector('#info-role').textContent = module.role;
    document.querySelector('#info-body').textContent = module.body;
    document.querySelector('#info-specs').innerHTML = module.specs
      .map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`)
      .join('');
    infoPanel.classList.remove('is-switching');
  }, 150);

  if (fly) flyTo(module.camera.position, module.camera.target);
  if (id === 'overview') state.lastInteraction = performance.now() - 6500;
}

// ---------------------------------------------------------------------------
// Solar system UI
// ---------------------------------------------------------------------------

for (const id of SOLAR_ORDER) {
  const body = SOLAR_BODIES[id];

  const item = document.createElement('button');
  item.className = 'planet-list-item';
  item.type = 'button';
  item.dataset.planet = id;
  item.style.setProperty('--planet-color', body.color);
  item.innerHTML = `
    <span class="planet-list-swatch"></span>
    <span class="planet-list-index">${body.index}</span>
    <span class="planet-list-main"><strong>${body.name}</strong><small>${body.en}</small></span>
    <span class="planet-list-distance">${body.distanceAU ? `${body.distanceAU.toFixed(2)} AU` : '恒星'}</span>
  `;
  item.addEventListener('click', () => openPlanet(id));
  item.addEventListener('pointerenter', () => { state.hoveredPlanet = id; });
  item.addEventListener('pointerleave', () => { state.hoveredPlanet = null; });
  planetListElement.appendChild(item);

  const quick = document.createElement('button');
  quick.type = 'button';
  quick.dataset.planet = id;
  quick.style.setProperty('--quick-color', body.color);
  quick.innerHTML = `<i></i>${body.name}`;
  quick.addEventListener('click', () => openPlanet(id));
  quick.addEventListener('pointerenter', () => { state.hoveredPlanet = id; });
  quick.addEventListener('pointerleave', () => { state.hoveredPlanet = null; });
  planetQuicknav.appendChild(quick);

  const label = document.createElement('button');
  label.type = 'button';
  label.className = 'solar-label';
  label.dataset.id = id;
  label.style.setProperty('--body-color', body.color);
  label.innerHTML = `
    <span class="solar-label-dot"></span>
    <span class="solar-label-name">${body.name}</span>
    <span class="solar-label-en">${body.en}</span>
  `;
  label.addEventListener('click', (event) => {
    event.stopPropagation();
    openPlanet(id);
  });
  label.addEventListener('pointerenter', () => { state.hoveredPlanet = id; });
  label.addEventListener('pointerleave', () => { state.hoveredPlanet = null; });
  solarLabelsElement.appendChild(label);
}

const solarLabelElements = new Map(
  [...solarLabelsElement.querySelectorAll('.solar-label')].map((element) => [element.dataset.id, element]),
);

function updatePlanetActive(id) {
  document.querySelectorAll('[data-planet]').forEach((element) => {
    element.classList.toggle('is-active', element.dataset.planet === id);
  });
  solarLabelElements.forEach((element, key) => {
    element.classList.toggle('is-active', key === id);
  });
}

function updatePlanetDetail(body) {
  planetDetail.style.setProperty('--planet-accent', body.color);
  planetIndex.textContent = body.index;
  planetType.textContent = body.type;
  planetName.textContent = body.name;
  planetEn.textContent = body.en;
  planetTagline.textContent = body.tagline;
  planetDescription.textContent = body.description;
  planetFact.textContent = body.fact;
  planetWatermark.textContent = body.en;
  planetStats.innerHTML = body.stats
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join('');
  planetCompositionLabel.textContent = body.id === 'sun' ? '组成 / COMPOSITION' : '大气 / 组成';

  planetComposition.innerHTML = body.composition
    .map(([label, value]) => {
      const numeric = Number.parseFloat(value);
      const width = Number.isFinite(numeric) ? Math.max(4, Math.min(100, numeric)) : 9;
      return `
        <div class="composition-row">
          <span>${label}</span>
          <div class="composition-track"><i class="composition-fill" style="width:${width}%;--bar-color:${body.color}"></i></div>
          <strong>${value}</strong>
        </div>
      `;
    })
    .join('');

  earthStationCard.hidden = !body.station;
  planetDetail.scrollTop = 0;
}

function updateModeChrome() {
  const stationMode = state.mode === 'station';
  modeButtons.forEach((button) => {
    const active = (button.dataset.mode === 'station') === stationMode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  liveLabel.textContent = stationMode ? 'LIVE ORBIT' : 'LIVE SYSTEM';

  if (stationMode) {
    topCoordA.textContent = '31.2304° N  121.4737° E';
    topCoordB.textContent = 'LOW EARTH ORBIT';
  } else if (state.mode === 'planet' && state.selectedPlanet) {
    const body = SOLAR_BODIES[state.selectedPlanet];
    topCoordA.textContent = `${body.id === 'sun' ? 'STELLAR DETAIL' : 'PLANETARY DETAIL'} · ${body.en}`;
    topCoordB.textContent = body.distanceAU ? `${body.distanceAU.toFixed(2)} AU · ${body.type}` : body.type;
  } else {
    topCoordA.textContent = 'HELIOCENTRIC · ECLIPTIC PLANE';
    topCoordB.textContent = '8 PLANETS · 1 STAR';
  }
}

async function setMode(mode, { planet = null, immediate = false } = {}) {
  if (mode === 'planet' && !planet) return;
  const token = ++state.modeToken;
  const sceneSwitch = (mode === 'station') !== (state.mode === 'station');

  if (!immediate && sceneSwitch && !state.reducedMotion) {
    fader.classList.add('is-active');
    await new Promise((resolve) => window.setTimeout(resolve, 280));
    if (token !== state.modeToken) return;
  }

  state.mode = mode;
  state.selectedPlanet = mode === 'planet' ? planet : null;
  state.hoveredPlanet = null;
  document.body.classList.remove('mode-solar', 'mode-planet', 'mode-station');
  document.body.classList.add(`mode-${mode}`);
  updateModeChrome();

  if (mode === 'station') {
    solarSystem.showOverview();
    renderPass.scene = scene;
    activeScene = scene;
    controls.minDistance = 22;
    controls.maxDistance = 145;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.maxPolarAngle = Math.PI * 0.84;
    controls.autoRotateSpeed = 0.26;
    bloomPass.strength = qualityReduced ? 0.46 : 0.52;
    setSelected('overview', { fly: false });
    const overview = MODULES.overview;
    if (sceneSwitch || immediate) {
      setCameraPose(overview.camera.position, overview.camera.target);
    } else {
      flyTo(overview.camera.position, overview.camera.target, 2);
    }
  } else {
    renderPass.scene = solarSystem.scene;
    activeScene = solarSystem.scene;
    controls.minPolarAngle = Math.PI * 0.06;
    controls.maxPolarAngle = Math.PI * 0.94;
    bloomPass.strength = qualityReduced ? 0.46 : 0.58;

    if (mode === 'solar') {
      solarSystem.showOverview();
      updatePlanetActive(null);
      controls.minDistance = 16;
      controls.maxDistance = 620;
      controls.autoRotateSpeed = 0.09;
      if (sceneSwitch || immediate) {
        setCameraPose(SOLAR_OVERVIEW.position, SOLAR_OVERVIEW.target);
      } else {
        flyTo(SOLAR_OVERVIEW.position, SOLAR_OVERVIEW.target, 2.6);
      }
    } else {
      const body = SOLAR_BODIES[planet];
      bloomPass.strength = qualityReduced ? 0.28 : (planet === 'sun' ? 0.3 : 0.58);
      solarSystem.setDetail(planet);
      solarSystem.update(0, 0, { detail: true, selected: planet });
      updatePlanetDetail(body);
      updatePlanetActive(planet);
      controls.minDistance = Math.max(2.8, body.radius * 1.5);
      controls.maxDistance = Math.max(48, body.radius * 22);
      controls.autoRotate = false;
      const view = solarSystem.getDetailView(planet);
      if (sceneSwitch || immediate) {
        setCameraPose(view.position, view.target);
      } else {
        flyTo(view.position, view.target, 2.5);
      }
    }
  }

  state.lastInteraction = performance.now();

  if (!immediate && sceneSwitch && !state.reducedMotion) {
    requestAnimationFrame(() => {
      if (token === state.modeToken) fader.classList.remove('is-active');
    });
  }
}

function openPlanet(id) {
  if (!SOLAR_BODIES[id]) return;
  state.lastInteraction = performance.now();
  setMode('planet', { planet: id });
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.mode === 'station') setMode('station');
    else setMode('solar');
  });
});

planetBackButton.addEventListener('click', () => setMode('solar'));
enterStationButton.addEventListener('click', () => setMode('station'));
solarStationLabel.addEventListener('click', () => setMode('station'));

// ---------------------------------------------------------------------------
// Solar labels
// ---------------------------------------------------------------------------

const projectedPoint = new THREE.Vector3();
const cameraSpacePoint = new THREE.Vector3();

function updateSolarLabels() {
  if (state.mode !== 'solar') return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const anchors = solarSystem.getAnchors();
  const entries = [];

  for (const anchor of anchors) {
    const element = solarLabelElements.get(anchor.id);
    if (!element) continue;
    projectedPoint.copy(anchor.position);
    cameraSpacePoint.copy(projectedPoint).applyMatrix4(camera.matrixWorldInverse);
    if (cameraSpacePoint.z > -0.5) {
      element.classList.add('is-hidden');
      continue;
    }
    projectedPoint.project(camera);
    const x = (projectedPoint.x * 0.5 + 0.5) * width;
    const y = (-projectedPoint.y * 0.5 + 0.5) * height;
    if (x < 30 || x > width - 30 || y < 34 || y > height - 34) {
      element.classList.add('is-hidden');
      continue;
    }
    entries.push({ element, x, y, distance: camera.position.distanceTo(anchor.position) });
  }

  entries.sort((a, b) => a.y - b.y);
  const placed = [];
  for (const entry of entries) {
    let x = entry.x + 10;
    let y = entry.y - 5;
    for (const point of placed) {
      if (Math.abs(x - point.x) < 92 && Math.abs(y - point.y) < 19) {
        y = point.y + 19;
      }
    }
    placed.push({ x, y });
    entry.element.classList.remove('is-hidden');
    entry.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    entry.element.style.opacity = String(
      THREE.MathUtils.clamp(1.55 - entry.distance / 320, 0.42, 1),
    );
  }
}

function updateStationLabel() {
  if (state.mode !== 'planet' || state.selectedPlanet !== 'earth') {
    solarStationLabel.hidden = true;
    return;
  }
  const point = solarSystem.getStationAnchor();
  if (!point) {
    solarStationLabel.hidden = true;
    return;
  }
  cameraSpacePoint.copy(point).applyMatrix4(camera.matrixWorldInverse);
  if (cameraSpacePoint.z > -0.2) {
    solarStationLabel.hidden = true;
    return;
  }
  projectedPoint.copy(point).project(camera);
  const x = (projectedPoint.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-projectedPoint.y * 0.5 + 0.5) * window.innerHeight;
  if (x < 20 || x > window.innerWidth - 20 || y < 20 || y > window.innerHeight - 20) {
    solarStationLabel.hidden = true;
    return;
  }
  solarStationLabel.hidden = false;
  const panelReserve = window.innerWidth > 620 ? 420 : 10;
  const labelWidth = 156;
  let labelX = x + 12;
  if (labelX + labelWidth > window.innerWidth - panelReserve) {
    labelX = Math.max(14, x - labelWidth - 12);
  }
  const labelY = Math.max(46, Math.min(window.innerHeight - 60, y - 22));
  solarStationLabel.style.transform = `translate3d(${labelX}px, ${labelY}px, 0)`;
}

// ---------------------------------------------------------------------------
// Raycasting
// ---------------------------------------------------------------------------

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerStart = null;
let hoverRaf = 0;

function focusIdFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData && current.userData.focusId) return current.userData.focusId;
    current = current.parent;
  }
  return null;
}

function setPointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickStation(event) {
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObject(station.root, true);
  for (const intersection of intersections) {
    const id = focusIdFromObject(intersection.object);
    if (id && MODULES[id]) return id;
  }
  return null;
}

function pickSolar(event) {
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(solarSystem.getClickTargets(), false);
  for (const intersection of intersections) {
    if (intersection.object.userData.bodyId) return intersection.object.userData.bodyId;
  }
  return null;
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!pointerStart) return;
  const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  if (distance > 6) return;

  if (state.mode === 'station') {
    const id = pickStation(event);
    if (id) setSelected(id);
  } else if (state.mode === 'solar') {
    const id = pickSolar(event);
    if (id) openPlanet(id);
  }
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (pointerStart) return;
  if (hoverRaf) return;
  hoverRaf = requestAnimationFrame(() => {
    hoverRaf = 0;
    if (state.mode === 'station') {
      const id = pickStation(event);
      renderer.domElement.classList.toggle('can-pick', Boolean(id));
    } else if (state.mode === 'solar') {
      const id = pickSolar(event);
      state.hoveredPlanet = id;
      renderer.domElement.classList.toggle('can-pick', Boolean(id));
    } else {
      renderer.domElement.classList.remove('can-pick');
    }
  });
});

renderer.domElement.addEventListener('pointerleave', () => {
  renderer.domElement.classList.remove('can-pick');
  state.hoveredPlanet = null;
});

// ---------------------------------------------------------------------------
// Station hotspots
// ---------------------------------------------------------------------------

const hotspotElements = [];
for (const [id, target] of Object.entries(station.focusTargets)) {
  if (!MODULES[id]) continue;
  const element = document.createElement('button');
  element.className = 'hotspot';
  element.dataset.focus = id;
  element.setAttribute('aria-label', target.label);
  element.innerHTML = `<span class="hotspot-dot"></span><span class="hotspot-label"><b>${MODULES[id].index}</b>${MODULES[id].title}</span>`;
  element.addEventListener('click', () => setSelected(id));
  hotspotLayer.appendChild(element);
  hotspotElements.push({ element, id, localPoint: target.point });
}

function updateHotspots() {
  if (state.mode !== 'station') return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  for (const hotspot of hotspotElements) {
    projectedPoint.copy(hotspot.localPoint);
    station.root.localToWorld(projectedPoint);
    cameraSpacePoint.copy(projectedPoint).applyMatrix4(camera.matrixWorldInverse);
    if (cameraSpacePoint.z > -0.4) {
      hotspot.element.classList.add('is-hidden');
      continue;
    }
    projectedPoint.project(camera);
    const x = (projectedPoint.x * 0.5 + 0.5) * width;
    const y = (-projectedPoint.y * 0.5 + 0.5) * height;
    const margin = 52;
    if (x < margin || x > width - margin || y < margin || y > height - margin) {
      hotspot.element.classList.add('is-hidden');
      continue;
    }
    hotspot.element.classList.remove('is-hidden');
    hotspot.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    const distance = camera.position.distanceTo(projectedPoint);
    hotspot.element.style.opacity = String(THREE.MathUtils.clamp(1.4 - distance / 115, 0.42, 1));
  }
}

// ---------------------------------------------------------------------------
// HUD interactions
// ---------------------------------------------------------------------------

document.querySelectorAll('[data-focus]').forEach((element) => {
  element.addEventListener('click', () => setSelected(element.dataset.focus));
});

const autoButton = document.querySelector('#auto-cruise');
const solarButton = document.querySelector('#solar-track');
const missionModal = document.querySelector('#mission-modal');

function syncToggles() {
  autoButton.classList.toggle('is-on', state.autoCruise);
  autoButton.setAttribute('aria-pressed', String(state.autoCruise));
  solarButton.classList.toggle('is-on', state.solarTracking);
  solarButton.setAttribute('aria-pressed', String(state.solarTracking));
}

autoButton.addEventListener('click', () => {
  state.autoCruise = !state.autoCruise;
  state.lastInteraction = performance.now();
  if (!state.autoCruise) controls.autoRotate = false;
  syncToggles();
});

solarButton.addEventListener('click', () => {
  state.solarTracking = !state.solarTracking;
  syncToggles();
});

document.querySelector('#brand-home').addEventListener('click', (event) => {
  event.preventDefault();
  if (state.mode === 'station') setSelected('overview');
  else if (state.mode === 'planet') setMode('solar');
  else setMode('solar');
});

document.querySelector('#mission-button').addEventListener('click', () => {
  missionModal.classList.add('is-open');
  missionModal.setAttribute('aria-hidden', 'false');
});

document.querySelector('#mission-close').addEventListener('click', () => {
  missionModal.classList.remove('is-open');
  missionModal.setAttribute('aria-hidden', 'true');
});

missionModal.addEventListener('click', (event) => {
  if (event.target === missionModal) {
    missionModal.classList.remove('is-open');
    missionModal.setAttribute('aria-hidden', 'true');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (missionModal.classList.contains('is-open')) {
      missionModal.classList.remove('is-open');
      missionModal.setAttribute('aria-hidden', 'true');
    } else if (state.mode === 'planet') {
      setMode('solar');
    }
  }
});

controls.addEventListener('start', () => {
  state.lastInteraction = performance.now();
  if (state.tween) {
    state.tween = null;
    controls.enabled = true;
  }
  controls.autoRotate = false;
});

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

let telemetryTimer = 0;

function updateTelemetry(elapsed) {
  const altitude = 408.6 + Math.sin(elapsed * 0.11) * 0.28 + Math.sin(elapsed * 0.031) * 0.16;
  const speed = 7.663 + Math.cos(elapsed * 0.09) * 0.002;
  telemetryAltitude.textContent = altitude.toFixed(1);
  telemetrySpeed.textContent = speed.toFixed(3);
  telemetryPeriod.textContent = (92.68 + Math.sin(elapsed * 0.04) * 0.01).toFixed(2);

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  telemetryClock.textContent = `CST ${formatter.format(now)}`;
}

// ---------------------------------------------------------------------------
// Loading and boot sequence
// ---------------------------------------------------------------------------

const loadingSteps = [
  [8, '校准日心坐标'],
  [22, '生成行星表面'],
  [39, '布置轨道平面'],
  [55, '点亮太阳等离子体'],
  [71, '载入地球轨道站点'],
  [86, '同步深空观测数据'],
  [94, '完成引力模型'],
];

let progress = 0;
function setLoadProgress(value, text) {
  progress = Math.max(progress, value);
  loaderBar.style.width = `${progress}%`;
  loaderPercent.textContent = String(Math.round(progress)).padStart(3, '0');
  if (text) loaderStatus.textContent = text;
}

async function boot() {
  const started = performance.now();
  for (const [value, text] of loadingSteps) {
    setLoadProgress(value, text);
    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }

  renderer.compile(scene, camera);
  renderer.compile(solarSystem.scene, camera);
  setLoadProgress(98, '渲染首帧');

  renderer.render(solarSystem.scene, camera);
  await new Promise((resolve) => window.setTimeout(resolve, 350));

  const minimum = state.reducedMotion ? 300 : 850;
  const remaining = Math.max(0, minimum - (performance.now() - started));
  await new Promise((resolve) => window.setTimeout(resolve, remaining));

  setLoadProgress(100, '星图就绪');
  await new Promise((resolve) => window.setTimeout(resolve, 320));

  document.body.classList.add('is-ready');
  loader.classList.add('is-hidden');
  window.setTimeout(() => loader.setAttribute('aria-hidden', 'true'), 900);

  if (state.reducedMotion) {
    setCameraPose(SOLAR_OVERVIEW.position, SOLAR_OVERVIEW.target);
  } else {
    flyTo(SOLAR_OVERVIEW.position, SOLAR_OVERVIEW.target, 3.6);
  }
  window.setTimeout(() => {
    state.lastInteraction = performance.now() - 9000;
  }, 3200);

  window.__SCENE_READY__ = true;
}

// ---------------------------------------------------------------------------
// Resize and render loop
// ---------------------------------------------------------------------------

let slowFrames = 0;
let qualityReduced = false;

function getRenderPixelRatio() {
  return qualityReduced ? 1 : Math.min(window.devicePixelRatio, 1.7);
}

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = getRenderPixelRatio();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(width, height);
  environment.stars.material.uniforms.uPixelRatio.value = pixelRatio;
  solarSystem.setPixelRatio(pixelRatio);
}

window.addEventListener('resize', onResize);

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.05);
  elapsed += dt;

  updateTween();

  const now = performance.now();

  if (state.mode === 'station') {
    environment.update(elapsed);
    station.update(elapsed, state.solarTracking);
    updateHotspots();
    if (!state.reducedMotion && state.autoCruise && state.selected === 'overview' && !state.tween && now - state.lastInteraction > 6500) {
      controls.autoRotate = true;
    } else {
      controls.autoRotate = false;
    }
    telemetryTimer += dt;
    if (telemetryTimer > 0.22) {
      telemetryTimer = 0;
      updateTelemetry(elapsed);
    }
  } else {
    solarSystem.update(elapsed, dt, {
      detail: state.mode === 'planet',
      selected: state.selectedPlanet,
      hovered: state.mode === 'solar' ? state.hoveredPlanet : null,
    });
    updateSolarLabels();
    updateStationLabel();
    if (state.mode === 'solar') {
      controls.autoRotate = !state.reducedMotion && state.autoCruise && !state.tween && now - state.lastInteraction > 6500;
    } else {
      controls.autoRotate = false;
    }
  }

  controls.update();

  composer.render();

  if (!qualityReduced && !state.reducedMotion) {
    slowFrames = rawDt > 0.032 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames > 50) {
      qualityReduced = true;
      onResize();
      bloomPass.strength = 0.46;
    }
  }
}

updateModeChrome();
syncToggles();
updateTelemetry(0);
renderer.setAnimationLoop(animate);
boot();

// Expose a small debug surface for automated visual checks.
window.__STATION_DEBUG__ = {
  camera,
  controls,
  station,
  solarSystem,
  renderer,
  scene,
  activeScene: () => activeScene,
  setSelected,
  setMode,
  openPlanet,
  state,
};
