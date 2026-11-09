import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createDecalMaterial } from './materials.js';
import { createDecalTexture, createGlowTexture } from './textures.js';

const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);

function v(x, y, z) {
  return new THREE.Vector3(x, y, z);
}

function cylinderGeometryBetween(a, b, radius, radialSegments = 8) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1, false);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, direction.clone().normalize());
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
    quaternion,
    new THREE.Vector3(1, 1, 1),
  );
  geometry.applyMatrix4(matrix);
  return geometry;
}

function addBeam(parent, a, b, radius, material, radialSegments = 8) {
  if (a.distanceToSquared(b) < 1e-8) return null;
  const mesh = new THREE.Mesh(cylinderGeometryBetween(a, b, radius, radialSegments), material);
  mesh.castShadow = radius > 0.07;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addBox(parent, width, height, depth, material, position, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.copy(position);
  if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, radiusTop, radiusBottom, height, material, position, quaternion = null, segments = 32) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, false),
    material,
  );
  mesh.position.copy(position);
  if (quaternion) mesh.quaternion.copy(quaternion);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addTorus(parent, radius, tube, material, position, normal = FORWARD, segments = 48) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, segments), material);
  mesh.position.copy(position);
  mesh.quaternion.setFromUnitVectors(FORWARD, (normal || FORWARD).clone().normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addWindow(parent, position, normal, width, height, materials, warm = true) {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.1, height + 0.09, 0.08),
    materials.dark,
  );
  frame.castShadow = true;
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.025),
    warm ? materials.warmWindow : materials.coolWindow,
  );
  glass.position.z = 0.05;
  group.add(frame, glass);
  group.position.copy(position).add(normal.clone().multiplyScalar(0.02));
  group.quaternion.setFromUnitVectors(FORWARD, normal.clone().normalize());
  parent.add(group);
  return group;
}

function addDecal(parent, texture, position, normal, width, height, opacity = 0.9) {
  const material = createDecalMaterial(texture);
  material.opacity = opacity;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.copy(position).add(normal.clone().normalize().multiplyScalar(0.015));
  mesh.quaternion.setFromUnitVectors(FORWARD, normal.clone().normalize());
  mesh.renderOrder = 3;
  parent.add(mesh);
  return mesh;
}

function addHandrailAlongZ(parent, angle, radius, zStart, zEnd, materials) {
  const normal = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
  const a = new THREE.Vector3(normal.x * radius, normal.y * radius, zStart);
  const b = new THREE.Vector3(normal.x * radius, normal.y * radius, zEnd);
  addBeam(parent, a, b, 0.022, materials.silver, 6);
  for (const z of [zStart + 0.35, zEnd - 0.35]) {
    const p = new THREE.Vector3(normal.x * radius, normal.y * radius, z);
    const base = p.clone().addScaledVector(normal, -0.16);
    addBeam(parent, base, p, 0.018, materials.dark, 5);
  }
}

function addGlowSprite(parent, texture, color, position, scale) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    opacity: 0.9,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.setScalar(scale);
  parent.add(sprite);
  return sprite;
}

function buildCore(materials, textures) {
  const group = new THREE.Group();
  group.position.set(0, -2.25, 0);
  group.userData.focusId = 'core';

  const radius = 2.15;
  const length = 10.4;

  const body = addCylinder(
    group,
    radius,
    radius,
    length,
    materials.hull,
    v(0, 0, 0),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
    64,
  );
  body.castShadow = true;
  body.receiveShadow = true;

  // Pressure rings and MLI collars.
  for (const z of [-5.12, -3.9, -1.7, 0.6, 2.8, 4.65, 5.12]) {
    addTorus(group, radius + 0.015, 0.055, materials.hullPanel, v(0, 0, z), FORWARD, 64);
  }
  const collar = addCylinder(
    group,
    radius + 0.03,
    radius + 0.03,
    1.15,
    materials.gold,
    v(0, 0, -4.4),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
    64,
  );
  collar.castShadow = true;

  // Conical aft adapter toward the node.
  addCylinder(
    group,
    1.82,
    radius,
    0.8,
    materials.hullPanel,
    v(0, 0, 5.5),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
    48,
  );

  // Windows on the visible flank.
  const windowConfigs = [
    { angle: 0.28, z: -2.45 },
    { angle: 0.28, z: -0.4 },
    { angle: 0.28, z: 1.8 },
    { angle: -0.5, z: -1.2 },
    { angle: 1.05, z: 0.3 },
    { angle: 1.05, z: 2.45 },
    { angle: 2.0, z: -1.5 },
    { angle: -1.15, z: 1.4 },
  ];
  for (const config of windowConfigs) {
    const normal = new THREE.Vector3(Math.cos(config.angle), Math.sin(config.angle), 0);
    addWindow(
      group,
      new THREE.Vector3(normal.x * radius, normal.y * radius, config.z),
      normal,
      0.34,
      0.17,
      materials,
      true,
    );
  }

  for (const angle of [0.72, 2.36, 3.92, 5.55]) {
    addHandrailAlongZ(group, angle, radius + 0.16, -4.8, 4.8, materials);
  }

  // Longitudinal utility conduits.
  for (const angle of [0.9, 2.4, 4.2, 5.6]) {
    const normal = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const start = new THREE.Vector3(normal.x * (radius + 0.09), normal.y * (radius + 0.09), -4.4);
    const end = new THREE.Vector3(normal.x * (radius + 0.09), normal.y * (radius + 0.09), 4.5);
    addBeam(group, start, end, 0.035, materials.dark, 6);
  }

  // A compact EVA hatch and equipment lockers.
  const hatchNormal = new THREE.Vector3(Math.cos(-0.15), Math.sin(-0.15), 0);
  addCylinder(
    group,
    0.62,
    0.62,
    0.35,
    materials.hullPanel,
    new THREE.Vector3(hatchNormal.x * (radius + 0.16), hatchNormal.y * (radius + 0.16), -3.65),
    new THREE.Quaternion().setFromUnitVectors(UP, hatchNormal),
    32,
  );
  addTorus(
    group,
    0.65,
    0.055,
    materials.goldDark,
    new THREE.Vector3(hatchNormal.x * (radius + 0.32), hatchNormal.y * (radius + 0.32), -3.65),
    hatchNormal,
    32,
  );

  for (const [z, angle] of [[2.9, 0.95], [3.6, 0.95], [-3.1, 2.6]]) {
    const normal = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const locker = addBox(
      group,
      0.72,
      0.46,
      1.1,
      materials.hullPanel,
      new THREE.Vector3(normal.x * (radius + 0.18), normal.y * (radius + 0.18), z),
    );
    locker.quaternion.setFromUnitVectors(FORWARD, normal);
  }

  // Identity plaque on the forward starboard flank.
  addDecal(
    group,
    textures.coreDecal,
    v(radius + 0.025, 0.25, 2.3),
    v(1, 0, 0),
    3.5,
    1.09,
    0.96,
  );

  // Cupola, looking down toward Earth.
  const cupola = new THREE.Group();
  cupola.position.set(0, -radius + 0.02, 0.5);
  addCylinder(cupola, 1.6, 1.72, 0.5, materials.hullPanel, v(0, -0.12, 0), null, 40);
  addTorus(cupola, 1.6, 0.075, materials.dark, v(0, -0.37, 0), null, 48);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.58, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.glass,
  );
  dome.rotation.x = Math.PI;
  dome.position.y = -0.36;
  cupola.add(dome);

  const apex = v(0, -1.88, 0);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const base = v(Math.cos(angle) * 1.56, -0.4, Math.sin(angle) * 1.56);
    addBeam(cupola, base, apex, 0.032, materials.hullPanel, 6);
  }
  addTorus(cupola, 1.58, 0.055, materials.hullPanel, v(0, -0.39, 0), null, 48);
  addTorus(cupola, 0.2, 0.045, materials.hullPanel, v(0, -1.86, 0), new THREE.Vector3(0, 1, 0), 24);
  const cupolaGlow = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffb66b,
      transparent: true,
      opacity: 0.13,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  cupolaGlow.rotation.x = Math.PI / 2;
  cupolaGlow.position.y = -0.28;
  cupola.add(cupolaGlow);
  group.add(cupola);

  return group;
}

function buildNode(materials) {
  const group = new THREE.Group();
  group.position.set(0, -2.25, 5.35);

  const node = new THREE.Mesh(new THREE.SphereGeometry(2.55, 48, 32), materials.hull);
  node.scale.set(1, 1, 0.9);
  node.castShadow = true;
  node.receiveShadow = true;
  group.add(node);

  // Structural rings around all three axes.
  addTorus(group, 2.53, 0.075, materials.hullPanel, v(0, 0, 0), new THREE.Vector3(1, 0, 0), 64);
  addTorus(group, 2.53, 0.075, materials.hullPanel, v(0, 0, 0), new THREE.Vector3(0, 1, 0), 64);
  addTorus(group, 2.3, 0.06, materials.goldDark, v(0, 0, 0), FORWARD, 64);

  const port = (normal, radius = 0.82, depth = 0.62) => {
    const position = normal.clone().multiplyScalar(2.4);
    addCylinder(
      group,
      radius,
      radius,
      0.45,
      materials.dark,
      position,
      new THREE.Quaternion().setFromUnitVectors(UP, normal),
      32,
    );
    addTorus(
      group,
      radius + 0.02,
      0.075,
      materials.gold,
      position.clone().addScaledVector(normal, depth * 0.22),
      normal,
      36,
    );
    addTorus(
      group,
      radius + 0.2,
      0.055,
      materials.hullPanel,
      position.clone().addScaledVector(normal, -0.18),
      normal,
      36,
    );
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), materials.cyanLight);
    light.position.copy(position).addScaledVector(normal, 0.32).add(new THREE.Vector3(0.35, 0.35, 0));
    group.add(light);
  };

  port(v(1, 0, 0));
  port(v(-1, 0, 0));
  port(v(0, 0, 1), 0.92);
  port(v(0, 0, -1), 0.92);
  port(v(0, 1, 0), 0.7);
  port(v(0, -1, 0), 0.92);

  for (const [x, y, z] of [
    [1.2, 1.5, 1.75],
    [-1.25, 1.3, 1.7],
    [1.35, -1.25, 1.7],
    [-1.1, -1.4, 1.8],
  ]) {
    const normal = v(x, y, z).normalize();
    addWindow(group, normal.clone().multiplyScalar(2.48), normal, 0.26, 0.16, materials, true);
  }

  return group;
}

function buildLab(materials, side, title, subtitle, focusId) {
  const group = new THREE.Group();
  group.userData.focusId = focusId;
  const z = 5.35;
  const y = -2.25;
  const start = 2.35;
  const length = 6.35;
  const radius = 1.85;
  const centerX = side * (start + length / 2 + 0.15);
  const axis = new THREE.Vector3(side, 0, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(UP, axis);

  const adapter = addCylinder(
    group,
    1.82,
    2.28,
    0.95,
    materials.hullPanel,
    v(side * 2.4, y, z),
    quat,
    40,
  );
  adapter.castShadow = true;

  const body = addCylinder(group, radius, radius, length, materials.hull, v(centerX, y, z), quat, 48);
  body.castShadow = true;

  for (const offset of [-length / 2, -length / 6, length / 6, length / 2]) {
    addTorus(
      group,
      radius + 0.015,
      0.055,
      materials.hullPanel,
      v(centerX + side * offset, y, z),
      axis,
      48,
    );
  }

  // A gold-foil experiment section on the outboard end.
  addCylinder(
    group,
    1.7,
    1.7,
    0.85,
    materials.gold,
    v(centerX + side * (length / 2 + 0.45), y, z),
    quat,
    40,
  );

  const endX = centerX + side * (length / 2 + 0.92);
  addCylinder(
    group,
    1.35,
    1.7,
    0.42,
    materials.hullPanel,
    v(endX, y, z),
    quat,
    32,
  );
  addTorus(
    group,
    1.38,
    0.07,
    materials.goldDark,
    v(endX + side * 0.22, y, z),
    axis,
    36,
  );

  // A sealed end hatch with a docking target and inspection cross.
  const hatchX = endX + side * 0.25;
  addCylinder(
    group,
    1.17,
    1.17,
    0.08,
    materials.hullBright,
    v(hatchX, y, z),
    quat,
    36,
  );
  addTorus(group, 1.05, 0.045, materials.dark, v(hatchX + side * 0.05, y, z), axis, 36);
  addBeam(
    group,
    v(hatchX + side * 0.06, y - 0.72, z),
    v(hatchX + side * 0.06, y + 0.72, z),
    0.022,
    materials.silver,
    5,
  );
  addBeam(
    group,
    v(hatchX + side * 0.06, y, z - 0.72),
    v(hatchX + side * 0.06, y, z + 0.72),
    0.022,
    materials.silver,
    5,
  );
  addCylinder(
    group,
    0.16,
    0.2,
    0.18,
    materials.gold,
    v(hatchX + side * 0.08, y, z),
    quat,
    16,
  );

  // Science airlock and exposed payloads on the top surface.
  addBox(
    group,
    1.8,
    0.62,
    1.2,
    materials.hullPanel,
    v(centerX - side * 0.8, y + radius + 0.28, z),
  );
  addBox(
    group,
    1.0,
    0.5,
    1.7,
    materials.gold,
    v(centerX + side * 1.55, y + radius + 0.2, z + 0.1),
  );
  for (let i = 0; i < 3; i++) {
    addBox(
      group,
      0.35,
      0.7,
      0.35,
      materials.dark,
      v(centerX + side * (0.7 + i * 0.7), y + radius + 0.2, z - 1.3),
    );
  }

  // Railings and small push-off points.
  for (const angle of [0.2, 1.1, 2.2, -0.9]) {
    const normal = v(0, Math.sin(angle), Math.cos(angle));
    const railCenter = v(centerX - side * 1.6, y + normal.y * (radius + 0.16), z + normal.z * (radius + 0.16));
    const railEnd = railCenter.clone().add(v(side * 2.2, 0, 0));
    addBeam(group, railCenter, railEnd, 0.022, materials.silver, 6);
  }

  const windowY = y + 0.45;
  for (const offset of [-1.7, 0.2, 2.0]) {
    addWindow(
      group,
      v(centerX + side * offset, windowY, z + radius + 0.02),
      v(0, 0, 1),
      0.42,
      0.2,
      materials,
      true,
    );
    addWindow(
      group,
      v(centerX + side * offset, y + radius + 0.02, z + 0.35),
      v(0, 1, 0),
      0.38,
      0.18,
      materials,
      false,
    );
  }

  addDecal(
    group,
    createDecalTexture({
      title,
      subtitle,
      accent: '#2b3940',
      subtitleColor: 'rgba(38, 54, 61, 0.62)',
      lineColor: 'rgba(38, 54, 61, 0.32)',
      titleSize: 150,
    }),
    v(centerX, y + 0.1, z + radius + 0.035),
    v(0, 0, 1),
    3.45,
    1.08,
    0.96,
  );

  // Outboard experiment package.
  addBox(
    group,
    0.95,
    0.9,
    0.95,
    materials.gold,
    v(endX + side * 0.45, y + 1.65, z - 0.3),
  );
  addBeam(
    group,
    v(endX + side * 0.4, y + 0.2, z - 0.3),
    v(endX + side * 0.4, y + 1.2, z - 0.3),
    0.04,
    materials.dark,
    6,
  );

  return group;
}

function buildCrewVehicle(materials) {
  const group = new THREE.Group();
  group.position.set(0, -2.25, -8.45);
  group.rotation.z = 0.03;
  group.userData.focusId = 'capsule';

  addTorus(group, 0.92, 0.08, materials.goldDark, v(0, 0, 1.35), FORWARD, 36);
  addCylinder(
    group,
    0.98,
    1.18,
    2.1,
    materials.hull,
    v(0, 0, 0),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
    40,
  );
  addTorus(group, 1.0, 0.06, materials.hullPanel, v(0, 0, 0.2), FORWARD, 40);

  const descent = addCylinder(
    group,
    0.94,
    1.18,
    1.55,
    materials.hullPanel,
    v(0, 0, -1.8),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
    36,
  );
  descent.castShadow = true;
  addTorus(group, 1.01, 0.055, materials.gold, v(0, 0, -1.05), FORWARD, 36);

  addCylinder(
    group,
    0.88,
    0.88,
    1.55,
    materials.gold,
    v(0, 0, -3.3),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
    32,
  );
  addCylinder(
    group,
    0.7,
    0.86,
    0.32,
    materials.dark,
    v(0, 0, -4.17),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
    28,
  );

  // Twin solar panels on the service module.
  for (const side of [-1, 1]) {
    addBeam(
      group,
      v(side * 0.75, 0, -3.32),
      v(side * 1.65, 0, -3.32),
      0.035,
      materials.dark,
      6,
    );
    addBox(
      group,
      1.8,
      1.25,
      0.06,
      [materials.solarEdge, materials.solarEdge, materials.solarEdge, materials.solarEdge, materials.solar, materials.solarBack],
      v(side * 2.55, 0, -3.32),
    );
  }

  addCylinder(
    group,
    0.05,
    0.18,
    0.55,
    materials.silver,
    v(0.6, 0.72, 0.9),
    new THREE.Quaternion().setFromUnitVectors(UP, v(0.3, 1, 0.1).normalize()),
    12,
  );
  addBox(group, 0.32, 0.18, 0.28, materials.dark, v(-0.65, 0.72, 0.95));

  return group;
}

function buildVentralAirlock(materials) {
  const group = new THREE.Group();
  group.position.set(0, -4.85, 5.35);
  group.userData.focusId = 'core';

  addCylinder(group, 1.0, 1.0, 1.35, materials.hullPanel, v(0, 0, 0), null, 36);
  addTorus(group, 1.01, 0.065, materials.gold, v(0, -0.67, 0), UP, 40);
  addTorus(group, 1.01, 0.055, materials.dark, v(0, 0.67, 0), UP, 40);
  addCylinder(group, 0.76, 0.76, 0.34, materials.dark, v(0, -0.84, 0), null, 28);
  addTorus(group, 0.79, 0.05, materials.goldDark, v(0, -1.0, 0), UP, 32);

  for (const side of [-1, 1]) {
    addBeam(
      group,
      v(side * 0.52, -0.25, 0.98),
      v(side * 0.52, 0.55, 0.98),
      0.022,
      materials.silver,
      5,
    );
    addBeam(
      group,
      v(side * 0.52, -0.25, 0.86),
      v(side * 0.52, -0.25, 0.98),
      0.018,
      materials.dark,
      5,
    );
    addBeam(
      group,
      v(side * 0.52, 0.55, 0.86),
      v(side * 0.52, 0.55, 0.98),
      0.018,
      materials.dark,
      5,
    );
  }

  addBox(group, 0.52, 0.35, 0.34, materials.gold, v(0.78, 0.15, 0.58));
  addBox(group, 0.24, 0.18, 0.2, materials.dark, v(-0.7, 0.28, 0.6));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), materials.cyanLight);
  lamp.position.set(0, -0.68, 0.92);
  group.add(lamp);

  return group;
}

function buildTruss(materials) {
  const group = new THREE.Group();
  group.position.set(0, 2.8, 0);

  const xStart = -15.7;
  const xEnd = 15.7;
  const halfY = 0.86;
  const halfZ = 0.86;
  const bay = 2.0;
  const geometries = [];

  const addMergedBeam = (a, b, radius, segments = 6) => {
    geometries.push(cylinderGeometryBetween(a, b, radius, segments));
  };

  for (let x = xStart; x < xEnd - 0.01; x += bay) {
    const x2 = Math.min(x + bay, xEnd);
    for (const y of [-halfY, halfY]) {
      for (const z of [-halfZ, halfZ]) {
        addMergedBeam(v(x, y, z), v(x2, y, z), 0.085, 6);
      }
    }
  }

  for (let x = xStart; x <= xEnd + 0.01; x += bay) {
    for (const y of [-halfY, halfY]) {
      addMergedBeam(v(x, y, -halfZ), v(x, y, halfZ), 0.055, 5);
    }
    for (const z of [-halfZ, halfZ]) {
      addMergedBeam(v(x, -halfY, z), v(x, halfY, z), 0.055, 5);
    }
  }

  for (let x = xStart, index = 0; x < xEnd - 0.01; x += bay, index++) {
    const x2 = x + bay;
    const flip = index % 2 === 0 ? 1 : -1;
    addMergedBeam(v(x, -halfY * flip, -halfZ), v(x2, halfY * flip, -halfZ), 0.038, 5);
    addMergedBeam(v(x, -halfY * flip, halfZ), v(x2, halfY * flip, halfZ), 0.038, 5);
    addMergedBeam(v(x, -halfY, -halfZ * flip), v(x2, -halfY, halfZ * flip), 0.038, 5);
    addMergedBeam(v(x, halfY, -halfZ * flip), v(x2, halfY, halfZ * flip), 0.038, 5);
  }

  // A central keel and utility spine.
  addMergedBeam(v(xStart, -halfY - 0.28, 0), v(xEnd, -halfY - 0.28, 0), 0.11, 8);
  for (let x = xStart + 2; x < xEnd; x += 4) {
    addMergedBeam(v(x, -halfY - 0.28, 0), v(x, -halfY, 0), 0.055, 5);
  }

  const merged = mergeGeometries(geometries, false);
  const truss = new THREE.Mesh(merged, materials.truss);
  truss.castShadow = true;
  truss.receiveShadow = true;
  group.add(truss);

  // Equipment pallets and ORU boxes.
  const palletConfigs = [
    { x: -12.2, y: 0.15, z: 0.15, w: 1.7, h: 1.0, d: 1.4, gold: true },
    { x: -8.8, y: -0.2, z: -0.2, w: 1.4, h: 1.2, d: 1.2, gold: false },
    { x: -6.0, y: 0.2, z: 0.15, w: 2.0, h: 1.0, d: 1.3, gold: false },
    { x: 2.3, y: -0.05, z: 0.1, w: 1.8, h: 1.1, d: 1.4, gold: true },
    { x: 8.0, y: 0.2, z: 0.1, w: 1.6, h: 0.9, d: 1.4, gold: false },
    { x: 11.6, y: -0.1, z: -0.1, w: 2.1, h: 1.1, d: 1.3, gold: true },
  ];

  for (const config of palletConfigs) {
    const box = addBox(
      group,
      config.w,
      config.h,
      config.d,
      config.gold ? materials.gold : materials.hullPanel,
      v(config.x, config.y, config.z),
    );
    box.castShadow = true;
    addBox(
      group,
      config.w * 0.7,
      0.05,
      config.d * 0.7,
      materials.dark,
      v(config.x, config.y + config.h / 2 + 0.027, config.z),
    );
    for (let i = 0; i < 3; i++) {
      addBeam(
        group,
        v(config.x - config.w * 0.3 + i * config.w * 0.3, -0.9, 0.5),
        v(config.x - config.w * 0.3 + i * config.w * 0.3, config.y - config.h / 2, 0.5),
        0.025,
        materials.dark,
        5,
      );
    }
  }

  // Propellant tanks beneath the truss.
  for (const x of [5.0, 6.1]) {
    addCylinder(
      group,
      0.46,
      0.46,
      2.1,
      materials.silver,
      v(x, -1.35, -0.15),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
      28,
    );
    addTorus(group, 0.47, 0.04, materials.goldDark, v(x - 0.6, -1.35, -0.15), new THREE.Vector3(0, 0, 1), 28);
    addTorus(group, 0.47, 0.04, materials.goldDark, v(x + 0.6, -1.35, -0.15), new THREE.Vector3(0, 0, 1), 28);
  }

  // EVA rail on the forward face.
  for (const y of [-0.55, 0.55]) {
    addBeam(group, v(-14.2, y, halfZ + 0.25), v(14.2, y, halfZ + 0.25), 0.024, materials.silver, 5);
    for (let x = -13; x <= 13; x += 2.6) {
      addBeam(group, v(x, y, halfZ + 0.05), v(x, y, halfZ + 0.25), 0.02, materials.dark, 5);
    }
  }

  // S-band antenna mast and a high-gain dish.
  addBeam(group, v(-11.2, 0.8, 0.6), v(-11.2, 3.0, 0.6), 0.075, materials.hullPanel, 8);
  addCylinder(group, 0.35, 0.35, 0.28, materials.dark, v(-11.2, 3.1, 0.6), null, 20);

  const dishGroup = new THREE.Group();
  dishGroup.position.set(-11.2, 4.2, 0.6);
  dishGroup.rotation.set(Math.PI + 0.1, 0.2, -0.28);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(1.28, 36, 14, 0, Math.PI * 2, 0, Math.PI * 0.36),
    new THREE.MeshStandardMaterial({
      color: 0xc6c0b0,
      roughness: 0.56,
      metalness: 0.38,
      side: THREE.DoubleSide,
      envMapIntensity: 0.46,
    }),
  );
  dish.castShadow = true;
  dishGroup.add(dish);
  addTorus(dishGroup, 1.23, 0.032, materials.goldDark, v(0, 0.38, 0), UP, 40);
  addBeam(dishGroup, v(0, 0.36, 0), v(0, 1.15, 0), 0.023, materials.dark, 5);
  addCylinder(dishGroup, 0.1, 0.055, 0.28, materials.gold, v(0, 1.21, 0), null, 16);
  group.add(dishGroup);

  // Helical UHF antenna.
  const helixPoints = [];
  for (let i = 0; i <= 140; i++) {
    const t = i / 140;
    const angle = t * Math.PI * 12;
    helixPoints.push(v(-8.25 + Math.cos(angle) * 0.22, 1.25 + t * 2.1, -0.55 + Math.sin(angle) * 0.22));
  }
  const helix = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPoints), 180, 0.014, 4, false),
    materials.gold,
  );
  group.add(helix);
  addBeam(group, v(-8.25, 0.75, -0.55), v(-8.25, 1.3, -0.55), 0.04, materials.dark, 6);

  // Small white strobe near the center.
  addCylinder(group, 0.08, 0.1, 0.24, materials.whiteLight, v(-2.2, 0.95, 0.7), null, 12);

  return group;
}

function buildSolarWing(materials, glowTexture, side) {
  const group = new THREE.Group();
  group.position.set(side * 15.75, 2.8, 0);
  group.userData.focusId = 'solar';
  const sx = side;

  addCylinder(
    group,
    1.15,
    1.15,
    1.0,
    materials.dark,
    v(0, 0, 0),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
    32,
  );
  addTorus(group, 1.16, 0.1, materials.gold, v(0, 0, 0), new THREE.Vector3(1, 0, 0), 44);
  addTorus(group, 0.95, 0.055, materials.hullPanel, v(sx * 0.52, 0, 0), new THREE.Vector3(1, 0, 0), 40);

  const pivot = new THREE.Group();
  pivot.rotation.x = -0.22;
  group.add(pivot);

  addBeam(pivot, v(0, 0, 0), v(sx * 2.85, 0, 0), 0.17, materials.dark, 8);
  addBeam(pivot, v(sx * 2.85, -8.9, 0), v(sx * 2.85, 8.9, 0), 0.14, materials.silver, 8);
  addBeam(pivot, v(sx * 2.85, -8.9, 0), v(sx * 15.7, -8.9, 0), 0.08, materials.truss, 6);
  addBeam(pivot, v(sx * 2.85, 8.9, 0), v(sx * 15.7, 8.9, 0), 0.08, materials.truss, 6);

  const stripWidth = 4.02;
  const stripHeight = 7.4;
  const gap = 0.12;
  const firstCenter = 3.35 + stripWidth / 2;

  for (const vertical of [-1, 1]) {
    const centerY = vertical * 5.2;
    for (let i = 0; i < 3; i++) {
      const centerX = firstCenter + i * (stripWidth + gap);
      const panel = addBox(
        pivot,
        stripWidth - 0.08,
        stripHeight,
        0.075,
        [
          materials.solarEdge,
          materials.solarEdge,
          materials.solarEdge,
          materials.solarEdge,
          materials.solar,
          materials.solarBack,
        ],
        v(sx * centerX, centerY, 0),
      );
      panel.castShadow = true;

      const left = sx * (centerX - stripWidth / 2 + 0.04);
      const right = sx * (centerX + stripWidth / 2 - 0.04);
      const top = centerY + stripHeight / 2 - 0.02;
      const bottom = centerY - stripHeight / 2 + 0.02;
      addBeam(pivot, v(left, bottom, 0.08), v(right, bottom, 0.08), 0.035, materials.goldDark, 5);
      addBeam(pivot, v(left, top, 0.08), v(right, top, 0.08), 0.035, materials.goldDark, 5);
      addBeam(pivot, v(left, bottom, 0.08), v(left, top, 0.08), 0.035, materials.goldDark, 5);
      addBeam(pivot, v(right, bottom, 0.08), v(right, top, 0.08), 0.035, materials.goldDark, 5);
    }

    // Hinge barrels between the blanket strips.
    for (const gapX of [3.35 + stripWidth + gap / 2, 3.35 + stripWidth * 2 + gap * 1.5]) {
      for (let j = -2; j <= 2; j++) {
        addCylinder(
          pivot,
          0.07,
          0.07,
          0.42,
          materials.goldDark,
          v(sx * gapX, centerY + j * 1.35, 0.02),
          null,
          10,
        );
      }
    }

    // Diagonal tension cables back to the mast.
    addBeam(
      pivot,
      v(sx * 3.0, vertical * 8.4, 0),
      v(sx * 3.5, centerY + vertical * 1.2, 0),
      0.012,
      materials.silver,
      4,
    );
    addBeam(
      pivot,
      v(sx * 3.0, vertical * 1.1, 0),
      v(sx * 15.3, vertical * 8.4, 0),
      0.012,
      materials.silver,
      4,
    );

    const beaconColor = vertical > 0 ? 0xff5e47 : 0x68ffc1;
    const beacon = addGlowSprite(
      pivot,
      glowTexture,
      beaconColor,
      v(sx * 15.55, centerY + vertical * 3.95, 0.22),
      0.9,
    );
    const tipLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 8),
      vertical > 0 ? materials.redLight : materials.greenLight,
    );
    tipLight.position.copy(v(sx * 15.55, centerY + vertical * 3.95, 0.23));
    pivot.add(tipLight);
    group.userData.beacons = group.userData.beacons || [];
    group.userData.beacons.push({ sprite: beacon, phase: side * 1.7 + vertical });
  }

  addBox(pivot, 0.55, 1.1, 0.65, materials.gold, v(sx * 14.8, 0, -0.32));
  addCylinder(
    pivot,
    0.1,
    0.13,
    0.5,
    materials.silver,
    v(sx * 14.8, 0.4, 0.1),
    null,
    12,
  );

  group.userData.pivot = pivot;
  group.userData.baseTilt = -0.22;
  return group;
}

function buildRadiator(materials, side) {
  const group = new THREE.Group();
  group.position.set(side * 8.4, 2.8, -1.0);
  group.rotation.y = side * 0.28;

  addBeam(group, v(0, 0, 0), v(0, -1.3, -1.0), 0.1, materials.truss, 8);
  addCylinder(
    group,
    0.22,
    0.22,
    0.55,
    materials.dark,
    v(0, -1.25, -1.0),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
    18,
  );

  const panelGroup = new THREE.Group();
  panelGroup.position.set(0, -4.1, -1.7);
  panelGroup.rotation.x = 0.05;
  group.add(panelGroup);

  for (let i = -1; i <= 1; i++) {
    const panel = addBox(
      panelGroup,
      1.12,
      5.7,
      0.065,
      [materials.dark, materials.dark, materials.dark, materials.dark, materials.radiator, materials.radiator],
      v(i * 1.2, 0, 0),
    );
    panel.castShadow = true;
    addBeam(panelGroup, v(i * 1.2 - 0.56, 2.85, 0.02), v(i * 1.2 + 0.56, 2.85, 0.02), 0.026, materials.dark, 5);
    addBeam(panelGroup, v(i * 1.2 - 0.56, -2.85, 0.02), v(i * 1.2 + 0.56, -2.85, 0.02), 0.026, materials.dark, 5);
  }
  addBeam(panelGroup, v(-1.75, -2.9, 0.03), v(-1.75, 2.9, 0.03), 0.04, materials.dark, 5);
  addBeam(panelGroup, v(1.75, -2.9, 0.03), v(1.75, 2.9, 0.03), 0.04, materials.dark, 5);

  addCylinder(
    group,
    0.18,
    0.18,
    1.8,
    materials.silver,
    v(-0.9, -2.0, -1.45),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
    14,
  );

  return group;
}

function buildRoboticArm(materials) {
  const group = new THREE.Group();
  group.position.set(5.15, 3.75, 0.7);
  group.userData.focusId = 'arm';

  const points = [
    v(0, 0, 0),
    v(0.5, 1.25, 0.2),
    v(4.6, 2.8, 1.3),
    v(8.4, 1.55, 0.5),
    v(10.5, 0.2, -0.1),
  ];

  addCylinder(group, 0.55, 0.65, 0.42, materials.hullPanel, v(0, 0.1, 0), null, 24);
  addTorus(group, 0.56, 0.06, materials.gold, v(0, 0.3, 0), UP, 32);

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const direction = new THREE.Vector3().subVectors(b, a).normalize();
    addBeam(group, a, b, 0.16, materials.hullBright, 12);
    addBeam(group, a.clone().add(v(0, 0.14, 0)), b.clone().add(v(0, 0.14, 0)), 0.025, materials.dark, 5);
    addBeam(group, a.clone().add(v(0, -0.14, 0)), b.clone().add(v(0, -0.14, 0)), 0.025, materials.dark, 5);
    addCylinder(
      group,
      0.3,
      0.3,
      0.36,
      materials.dark,
      a,
      new THREE.Quaternion().setFromUnitVectors(UP, direction),
      20,
    );
    addTorus(group, 0.31, 0.045, materials.gold, a, direction, 24);
  }

  const wrist = points[points.length - 1];
  addCylinder(
    group,
    0.26,
    0.26,
    0.5,
    materials.hullPanel,
    wrist,
    new THREE.Quaternion().setFromUnitVectors(UP, v(0.2, -1, 0.1).normalize()),
    18,
  );
  addCylinder(
    group,
    0.1,
    0.16,
    0.7,
    materials.dark,
    wrist.clone().add(v(0.1, -0.58, 0.05)),
    new THREE.Quaternion().setFromUnitVectors(UP, v(0.2, -1, 0.1).normalize()),
    14,
  );
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    addBeam(
      group,
      wrist.clone().add(v(0.1, -0.75, 0.05)),
      wrist.clone().add(v(0.1 + Math.cos(angle) * 0.27, -1.05, 0.05 + Math.sin(angle) * 0.27)),
      0.035,
      materials.silver,
      5,
    );
  }

  // A bundle of cables running along the outside of the arm.
  const cablePoints = [
    v(0.1, 0.2, 0.18),
    v(0.55, 1.25, 0.36),
    v(4.6, 2.95, 1.48),
    v(8.4, 1.7, 0.68),
    v(10.2, 0.4, 0.18),
  ];
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePoints), 80, 0.022, 5, false),
    materials.dark,
  );
  group.add(cable);

  return group;
}

function buildAstronaut(materials, glowTexture) {
  const group = new THREE.Group();
  group.position.set(-4.7, -5.4, 4.1);
  group.rotation.set(0.2, 0.6, -0.5);

  const suit = materials.hullBright;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.48, 8, 16), suit);
  torso.castShadow = true;
  group.add(torso);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 18), suit);
  helmet.position.y = 0.55;
  helmet.castShadow = true;
  group.add(helmet);
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({
      color: 0xc58a32,
      metalness: 1,
      roughness: 0.12,
      envMapIntensity: 1.8,
    }),
  );
  visor.position.set(0, 0.56, 0.055);
  visor.rotation.x = 0.3;
  group.add(visor);

  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.22), materials.hullPanel);
  pack.position.set(0, 0.05, -0.25);
  pack.castShadow = true;
  group.add(pack);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.58, 10), suit);
    arm.position.set(side * 0.29, 0.08, 0.02);
    arm.rotation.z = side * 0.32;
    group.add(arm);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.6, 10), suit);
    leg.position.set(side * 0.13, -0.65, 0.02);
    leg.rotation.z = side * 0.08;
    leg.rotation.x = -0.2;
    group.add(leg);
  }

  addGlowSprite(group, glowTexture, 0xffb05f, v(0.25, 0.18, 0.22), 0.55);
  addBox(group, 0.12, 0.06, 0.04, materials.whiteLight, v(0.25, 0.18, 0.2));

  // A long, gently curved safety tether back to the core.
  const tetherPoints = [
    v(-3.6, -3.85, 3.1),
    v(-3.9, -4.4, 3.3),
    v(-4.35, -4.9, 3.7),
    v(-4.65, -5.3, 4.0),
  ];
  const tether = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tetherPoints), 48, 0.012, 4, false),
    new THREE.MeshStandardMaterial({ color: 0xd8d8cc, roughness: 0.8 }),
  );
  group.add(tether);

  return group;
}

function buildConnectingMast(materials) {
  const group = new THREE.Group();
  addBeam(group, v(-0.95, 2.8, -0.95), v(-0.55, 0.2, -0.55), 0.08, materials.truss, 7);
  addBeam(group, v(0.95, 2.8, -0.95), v(0.55, 0.2, -0.55), 0.08, materials.truss, 7);
  addBeam(group, v(-0.95, 2.8, 0.95), v(-0.55, 0.2, 0.55), 0.08, materials.truss, 7);
  addBeam(group, v(0.95, 2.8, 0.95), v(0.55, 0.2, 0.55), 0.08, materials.truss, 7);
  addCylinder(group, 0.9, 0.9, 0.6, materials.hullPanel, v(0, 1.9, 0), null, 28);
  addTorus(group, 0.91, 0.07, materials.goldDark, v(0, 1.6, 0), null, 36);
  addTorus(group, 0.91, 0.07, materials.goldDark, v(0, 2.2, 0), null, 36);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    addBox(
      group,
      0.16,
      0.16,
      0.9,
      materials.dark,
      v(Math.cos(angle) * 0.78, 1.9, Math.sin(angle) * 0.78),
    );
  }
  return group;
}

function buildSolarWingConnectors(materials, side) {
  const group = new THREE.Group();
  const endX = side * 15.75;
  addBeam(group, v(endX, 2.8, -0.86), v(endX, 2.8, 0.86), 0.12, materials.dark, 8);
  addBeam(group, v(endX, 2.8, 0), v(endX + side * 0.55, 2.8, 0), 0.2, materials.goldDark, 10);
  return group;
}

export function buildStation(materials) {
  const root = new THREE.Group();
  root.name = 'TIANQIONG_STATION';
  root.rotation.z = -0.015;

  const glowTexture = createGlowTexture('rgba(255,255,255,1)');

  const textures = {
    coreDecal: createDecalTexture({
      title: '天穹',
      subtitle: 'TIANQIONG · TQ-01',
      accent: '#26343a',
      subtitleColor: 'rgba(36, 53, 61, 0.62)',
      lineColor: 'rgba(36, 53, 61, 0.34)',
      titleSize: 140,
      flag: true,
    }),
  };

  const core = buildCore(materials, textures);
  const node = buildNode(materials);
  const labPort = buildLab(materials, 1, '问天', 'WENTIAN LAB', 'lab');
  const labStarboard = buildLab(materials, -1, '梦天', 'MENGTIAN LAB', 'lab');
  const crew = buildCrewVehicle(materials);
  const ventralAirlock = buildVentralAirlock(materials);
  const truss = buildTruss(materials);
  const arm = buildRoboticArm(materials);
  const astronaut = buildAstronaut(materials, glowTexture);
  const mast = buildConnectingMast(materials);

  const leftWing = buildSolarWing(materials, glowTexture, -1);
  const rightWing = buildSolarWing(materials, glowTexture, 1);
  const leftRadiator = buildRadiator(materials, -1);
  const rightRadiator = buildRadiator(materials, 1);
  const leftConnector = buildSolarWingConnectors(materials, -1);
  const rightConnector = buildSolarWingConnectors(materials, 1);

  root.add(
    core,
    node,
    labPort,
    labStarboard,
    crew,
    ventralAirlock,
    truss,
    arm,
    astronaut,
    mast,
    leftWing,
    rightWing,
    leftRadiator,
    rightRadiator,
    leftConnector,
    rightConnector,
  );

  // Decorative markings along the truss.
  const trussDecal = createDecalTexture({
    title: 'TIANQIONG',
    subtitle: 'ORBITAL ASSEMBLY · 2026',
    accent: '#dbe4e6',
    titleSize: 52,
  });
  addDecal(
    truss,
    trussDecal,
    v(-1.5, 0.25, 0.89),
    v(0, 0, 1),
    3.8,
    1.19,
    0.72,
  );

  const beacons = [
    ...(leftWing.userData.beacons || []),
    ...(rightWing.userData.beacons || []),
  ];

  for (const wing of [leftWing, rightWing]) {
    const strobe = addGlowSprite(
      wing,
      glowTexture,
      0xffffff,
      v(0, 1.55, 0.2),
      0.55,
    );
    beacons.push({ sprite: strobe, phase: wing.position.x * 0.1, strobe: true });
  }

  const shadowMaterials = new Set([
    materials.hull,
    materials.hullPanel,
    materials.hullBright,
    materials.gold,
    materials.solar,
    materials.solarBack,
    materials.radiator,
    materials.truss,
  ]);
  root.traverse((object) => {
    if (!object.isMesh) return;
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    object.receiveShadow = true;
    object.castShadow = object.castShadow || mats.some((material) => shadowMaterials.has(material));
    if (object.material && object.material.transparent) {
      object.castShadow = false;
    }
  });

  return {
    root,
    wings: [leftWing, rightWing],
    beacons,
    focusTargets: {
      core: { point: v(0, -2, 0.8), label: '天枢核心舱' },
      lab: { point: v(6.2, -1.4, 5.4), label: '问天实验舱' },
      solar: { point: v(-28, 7, 0), label: '曦和太阳翼' },
      arm: { point: v(9.5, 5.8, 1.4), label: '玄戈机械臂' },
    },
    update(elapsed, solarTracking) {
      root.position.y = Math.sin(elapsed * 0.17) * 0.1;
      root.rotation.z = -0.015 + Math.sin(elapsed * 0.11) * 0.004;

      for (const wing of [leftWing, rightWing]) {
        const pivot = wing.userData.pivot;
        const target = solarTracking ? -0.28 + Math.sin(elapsed * 0.055) * 0.045 : wing.userData.baseTilt;
        pivot.rotation.x += (target - pivot.rotation.x) * 0.03;
      }

      for (const beacon of beacons) {
        const pulse = 0.5 + 0.5 * Math.max(0, Math.sin(elapsed * (beacon.strobe ? 4.2 : 1.7) + beacon.phase));
        beacon.sprite.material.opacity = beacon.strobe
          ? (pulse > 0.82 ? 1 : 0.06)
          : 0.22 + pulse * 0.78;
      }
    },
  };
}
