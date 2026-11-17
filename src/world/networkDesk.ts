import { BoxGeometry, CanvasTexture, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from 'three';
import { DESK_PLACEMENT } from '../data/networkDesk.ts';
import type { Obstacle } from '../player/obstacles.ts';

const TOP_T = 0.03;
const LEG = 0.045;
const MONITOR_W = 0.54;
const MONITOR_H = 0.32;
/** Clear height of the monitor above the floor; used for the collision volume. */
const SOLID_TOP_M = 1.15;

function screenTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.fillStyle = '#0d1b2a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#16314d';
  ctx.fillRect(0, 0, canvas.width, 44);
  ctx.fillStyle = '#e8edf2';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('Network room workstation', 18, 22);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#9fb0c2';
  ['Omada SDN controller', 'VIGI NVR', 'PoE switch management'].forEach((line, i) => {
    ctx.fillStyle = '#3ddc84';
    ctx.fillRect(18, 84 + i * 56, 12, 12);
    ctx.fillStyle = '#c9d6e2';
    ctx.fillText(line, 44, 90 + i * 56);
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Desk with monitor and keyboard. Built with the front (user side) toward +Z
 * and rotated so it faces west, away from the east wall.
 */
export function createNetworkDesk(): Group {
  const root = new Group();
  root.name = 'networkDesk';
  root.position.set(DESK_PLACEMENT.center.x, 0, DESK_PLACEMENT.center.y);
  root.rotation.y = -Math.PI / 2;

  const wood = new MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.7 });
  const metal = new MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.5, metalness: 0.6 });
  const plastic = new MeshStandardMaterial({ color: 0x15181c, roughness: 0.6 });

  const { length, depth, topHeight } = DESK_PLACEMENT;
  const add = (geo: BoxGeometry, mat: MeshStandardMaterial, x: number, y: number, z: number): Mesh => {
    const m = new Mesh(geo, mat);
    m.position.set(x, y, z);
    root.add(m);
    return m;
  };

  add(new BoxGeometry(length, TOP_T, depth), wood, 0, topHeight - TOP_T / 2, 0);
  const legH = topHeight - TOP_T;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      add(new BoxGeometry(LEG, legH, LEG), metal, sx * (length / 2 - LEG), legH / 2, sz * (depth / 2 - LEG));
    }
  }

  // Monitor toward the back of the desk, facing the user (+Z).
  const baseZ = -depth / 2 + 0.2;
  add(new BoxGeometry(0.2, 0.012, 0.14), plastic, 0, topHeight + 0.006, baseZ);
  add(new BoxGeometry(0.03, 0.14, 0.03), plastic, 0, topHeight + 0.07, baseZ);
  const panelY = topHeight + 0.14 + MONITOR_H / 2;
  add(new BoxGeometry(MONITOR_W + 0.03, MONITOR_H + 0.03, 0.025), plastic, 0, panelY, baseZ);
  const screen = new Mesh(new PlaneGeometry(MONITOR_W, MONITOR_H), new MeshBasicMaterial({ map: screenTexture() }));
  screen.position.set(0, panelY, baseZ + 0.0135);
  root.add(screen);

  // Keyboard in front of the monitor.
  add(new BoxGeometry(0.4, 0.015, 0.13), plastic, 0, topHeight + 0.0075, 0.12);
  return root;
}

/** Solid footprint of the desk (plan axes, X east / Z south) for the player. */
export function deskObstacle(): Obstacle {
  const { center, length, depth } = DESK_PLACEMENT;
  return {
    minX: center.x - depth / 2,
    maxX: center.x + depth / 2,
    minZ: center.y - length / 2,
    maxZ: center.y + length / 2,
    maxY: SOLID_TOP_M,
  };
}

/** Monitor center in world space (X, Y up, Z south): the screen faces west. */
export function monitorPoint(): { x: number; y: number; z: number } {
  const { center, topHeight } = DESK_PLACEMENT;
  return { x: center.x + 0.1, y: topHeight + 0.3, z: center.y };
}

/** Horizontal distance within which the monitor can be used. */
export const MONITOR_REACH_M = 1.7;
