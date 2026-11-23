import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three';
import { planToThree } from '../domain/coords.ts';
import type { Obstacle } from '../player/obstacles.ts';
import {
  RACK_DEVICES,
  RACK_MODEL,
  RACK_PLACEMENT,
  RACK_PLINTH_M,
  RACK_U_M,
  RACK_UNITS,
  type RackDevice,
  type RackDeviceKind,
} from '../data/networkRack.ts';

const U_M = RACK_U_M;
const PLINTH_M = RACK_PLINTH_M;
const POST_M = 0.04;
/** 19-inch equipment width and a typical shallow depth. */
const EQUIP_W = 0.482;
const EQUIP_D = 0.42;
const PX_PER_U = 56;
const PX_W = 640;

const FACE_COLOR: Record<RackDeviceKind, string> = {
  router: '#2b3a4a',
  controller: '#2b3a4a',
  switch: '#26323f',
  patch: '#3a3f46',
  organizer: '#15181c',
  nvr: '#2d2f36',
  ups: '#1c2430',
  pdu: '#2a2a2a',
};

/** Rack height from the floor to the top of the frame. */
export const RACK_HEIGHT_M = PLINTH_M + RACK_UNITS * U_M + 0.02;

function faceTexture(device: RackDevice): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = PX_W;
  canvas.height = PX_PER_U * device.units;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.fillStyle = FACE_COLOR[device.kind];
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);

  if (device.kind === 'switch' || device.kind === 'patch') {
    // Port rows.
    const ports = 24;
    const rows = device.id.endsWith('48') ? 2 : 1;
    const pw = 14;
    const gap = 8;
    const startX = 150;
    for (let r = 0; r < rows; r += 1) {
      for (let i = 0; i < ports; i += 1) {
        ctx.fillStyle = device.kind === 'switch' ? '#0b0d10' : '#6b7480';
        ctx.fillRect(startX + i * (pw + gap), 12 + r * 22, pw, 16);
      }
    }
  }
  if (device.kind === 'organizer') {
    ctx.fillStyle = '#090a0c';
    for (let i = 0; i < 9; i += 1) ctx.fillRect(40 + i * 64, 14, 40, 24);
  }
  if (device.kind === 'ups') {
    ctx.fillStyle = '#0a0f16';
    ctx.fillRect(470, 18, 140, 40);
    ctx.fillStyle = '#3ddc84';
    ctx.fillRect(480, 28, 50, 20);
  }
  if (device.kind === 'pdu') {
    ctx.fillStyle = '#d33';
    ctx.fillRect(560, 18, 36, 20);
  }

  ctx.fillStyle = '#e8edf2';
  ctx.font = `600 ${Math.round(PX_PER_U * 0.34)}px system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  const labelY = device.kind === 'switch' || device.kind === 'patch' ? canvas.height - 14 : canvas.height / 2;
  ctx.fillText(device.id, 16, labelY);
  if (device.kind !== 'switch' && device.kind !== 'patch' && device.kind !== 'organizer') {
    ctx.fillStyle = '#9fb0c2';
    ctx.font = `${Math.round(PX_PER_U * 0.26)}px system-ui, sans-serif`;
    ctx.fillText(device.model, 110, labelY);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Network room rack: a 42U frame with the equipment of the hardware budget.
 * Purely visual (no collisions); the front faces south, toward the room opening.
 */
export function createNetworkRack(): Group {
  const root = new Group();
  root.name = 'networkRack';
  const [cx, , cz] = planToThree(RACK_PLACEMENT.center);
  root.position.set(cx, 0, cz);

  const { width, depth } = RACK_PLACEMENT;
  const frameMat = new MeshStandardMaterial({ color: 0x14171b, roughness: 0.55, metalness: 0.6 });
  const panelMat = new MeshStandardMaterial({
    color: 0x0e1013,
    roughness: 0.8,
    metalness: 0.3,
    transparent: true,
    opacity: 0.55,
  });

  const frameH = RACK_HEIGHT_M;
  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number, mat: MeshStandardMaterial): void => {
    const mesh = new Mesh(new BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    root.add(mesh);
  };

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(POST_M, frameH, POST_M, sx * (width / 2 - POST_M / 2), frameH / 2, sz * (depth / 2 - POST_M / 2), frameMat);
    }
  }
  addBox(width, 0.04, depth, 0, PLINTH_M - 0.02, 0, frameMat);
  addBox(width, 0.03, depth, 0, frameH - 0.015, 0, frameMat);
  // Side and back panels stay translucent so the equipment is visible from any angle.
  addBox(0.012, frameH - PLINTH_M, depth, -width / 2 + 0.006, PLINTH_M + (frameH - PLINTH_M) / 2, 0, panelMat);
  addBox(0.012, frameH - PLINTH_M, depth, width / 2 - 0.006, PLINTH_M + (frameH - PLINTH_M) / 2, 0, panelMat);
  addBox(width, frameH - PLINTH_M, 0.012, 0, PLINTH_M + (frameH - PLINTH_M) / 2, -depth / 2 + 0.006, panelMat);

  const frontZ = depth / 2 - POST_M - 0.02;
  for (const device of RACK_DEVICES) {
    const h = device.units * U_M - 0.004;
    const y = PLINTH_M + (device.u - 1) * U_M + (device.units * U_M) / 2;
    const body = new Mesh(
      new BoxGeometry(EQUIP_W, h, EQUIP_D),
      new MeshStandardMaterial({ color: 0x20252b, roughness: 0.7, metalness: 0.4 }),
    );
    body.position.set(0, y, frontZ - EQUIP_D / 2);
    body.name = `${device.id}:${device.model}`;
    body.userData = { info: { type: 'netdevice', id: device.id } };
    root.add(body);

    const face = new Mesh(
      new BoxGeometry(EQUIP_W, h, 0.006),
      new MeshBasicMaterial({ map: faceTexture(device) }),
    );
    face.position.set(0, y, frontZ);
    face.name = `${device.id}:face`;
    face.userData = { info: { type: 'netdevice', id: device.id } };
    root.add(face);
  }

  root.userData = { model: RACK_MODEL, units: RACK_UNITS };
  return root;
}

/** Solid footprint of the rack for the player controller. */
export function rackObstacle(): Obstacle {
  const [cx, , cz] = planToThree(RACK_PLACEMENT.center);
  return {
    minX: cx - RACK_PLACEMENT.width / 2,
    maxX: cx + RACK_PLACEMENT.width / 2,
    minZ: cz - RACK_PLACEMENT.depth / 2,
    maxZ: cz + RACK_PLACEMENT.depth / 2,
    maxY: RACK_HEIGHT_M,
  };
}
