import * as THREE from 'three';
import {
  createFoilTextures,
  createHullTextures,
  createRadiatorTexture,
  createSolarBackTexture,
  createSolarTextures,
} from './textures.js';

export function createMaterials(renderer) {
  const hull = createHullTextures();
  const foil = createFoilTextures();
  const solar = createSolarTextures();
  const solarBack = createSolarBackTexture();
  const radiator = createRadiatorTexture();

  const hullMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0f1ed,
    map: hull.map,
    bumpMap: hull.bump,
    bumpScale: 0.028,
    roughness: 0.5,
    metalness: 0.18,
    envMapIntensity: 0.9,
  });

  const hullPanelMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8bec0,
    map: hull.map,
    bumpMap: hull.bump,
    bumpScale: 0.012,
    roughness: 0.58,
    metalness: 0.22,
    envMapIntensity: 0.75,
  });

  const hullBrightMaterial = new THREE.MeshStandardMaterial({
    color: 0xfafaf5,
    map: hull.map,
    roughness: 0.42,
    metalness: 0.2,
    envMapIntensity: 1.1,
  });

  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x1c2328,
    roughness: 0.38,
    metalness: 0.82,
    envMapIntensity: 1.05,
  });

  const trussMetal = new THREE.MeshStandardMaterial({
    color: 0x858b8c,
    roughness: 0.34,
    metalness: 0.88,
    envMapIntensity: 1.18,
  });

  const blackMetal = new THREE.MeshStandardMaterial({
    color: 0x080b0d,
    roughness: 0.32,
    metalness: 0.75,
    envMapIntensity: 0.9,
  });

  const silver = new THREE.MeshStandardMaterial({
    color: 0xb9c2c5,
    roughness: 0.26,
    metalness: 0.95,
    envMapIntensity: 1.35,
  });

  const gold = new THREE.MeshStandardMaterial({
    color: 0xd7a64f,
    map: foil.map,
    bumpMap: foil.bump,
    bumpScale: 0.03,
    roughness: 0.34,
    metalness: 0.92,
    envMapIntensity: 1.25,
  });

  const goldDark = new THREE.MeshStandardMaterial({
    color: 0x6d4a17,
    map: foil.map,
    roughness: 0.44,
    metalness: 0.78,
    envMapIntensity: 1,
  });

  const solarMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: solar.map,
    emissiveMap: solar.emissive,
    emissive: 0x1d4d80,
    emissiveIntensity: 0.42,
    roughness: 0.34,
    metalness: 0.24,
    envMapIntensity: 1.25,
  });

  const solarBackMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f4ef,
    map: solarBack,
    roughness: 0.64,
    metalness: 0.1,
    envMapIntensity: 0.65,
  });

  const radiatorMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1f2ee,
    map: radiator,
    roughness: 0.46,
    metalness: 0.22,
    envMapIntensity: 0.85,
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x102631,
    roughness: 0.06,
    metalness: 0.15,
    transmission: 0.35,
    transparent: true,
    opacity: 0.72,
    envMapIntensity: 2,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: 0x3c1d09,
    emissiveIntensity: 0.45,
    side: THREE.DoubleSide,
  });

  const warmWindow = new THREE.MeshStandardMaterial({
    color: 0xffc57f,
    emissive: 0xffb765,
    emissiveIntensity: 3.6,
    roughness: 0.2,
    metalness: 0,
  });

  const coolWindow = new THREE.MeshStandardMaterial({
    color: 0x9de8ff,
    emissive: 0x75d8ff,
    emissiveIntensity: 2.8,
    roughness: 0.2,
    metalness: 0,
  });

  const cyanLight = new THREE.MeshBasicMaterial({ color: 0x7ae9ff });
  const redLight = new THREE.MeshBasicMaterial({ color: 0xff4b39 });
  const greenLight = new THREE.MeshBasicMaterial({ color: 0x61ffb2 });
  const whiteLight = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const solarEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c6b35,
    roughness: 0.38,
    metalness: 0.8,
    envMapIntensity: 1,
  });

  return {
    renderer,
    textures: { hull, foil, solar, solarBack, radiator },
    hull: hullMaterial,
    hullPanel: hullPanelMaterial,
    hullBright: hullBrightMaterial,
    dark: darkMetal,
    truss: trussMetal,
    black: blackMetal,
    silver,
    gold,
    goldDark,
    solar: solarMaterial,
    solarBack: solarBackMaterial,
    radiator: radiatorMaterial,
    glass,
    warmWindow,
    coolWindow,
    cyanLight,
    redLight,
    greenLight,
    whiteLight,
    solarEdge: solarEdgeMaterial,
  };
}

export function createDecalMaterial(texture) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: false,
    alphaTest: 0.22,
    depthWrite: true,
    toneMapped: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}
