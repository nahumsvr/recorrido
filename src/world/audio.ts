import {
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from 'three';
import {
  AUDIO_RUNS,
  FLOOR_RUN_H,
  FLOOR_RUN_Y,
  FOH,
  MIXER_MODEL,
  SPEAKERS,
  STAND_FRONT_Y,
  type AudioLine,
  type Speaker,
} from '../data/audio.ts';
import { planToThree, type PlanPoint } from '../domain/coords.ts';
import type { Obstacle } from '../player/obstacles.ts';

/** JBL EON715: 15" active two-way, 0.43 × 0.70 × 0.37 m. */
const SPK_W = 0.43;
const SPK_H = 0.7;
const SPK_D = 0.37;
const CABLE_R = 0.012;
const LINE_COLOR: Record<AudioLine, number> = { L: 0x4aa3ff, R: 0xff6b6b };
/** Parallel runs are offset so the two lines do not overlap. */
const LINE_OFFSET: Record<AudioLine, Vector3> = { R: new Vector3(0, 0, 0), L: new Vector3(0.04, 0.03, 0.03) };
const TABLE_TOP_T = 0.03;
const TABLE_LEG = 0.045;
const MIXER = { w: 0.31, h: 0.1, d: 0.4 } as const;
/** Clear height of the table for the player collision volume. */
const TABLE_SOLID_TOP_M = 0.8;

const vec = (p: PlanPoint): Vector3 => new Vector3(...planToThree(p));

/** Thin cylinder between two points. */
function segment(a: Vector3, b: Vector3, radius: number, material: MeshStandardMaterial): Mesh {
  const length = a.distanceTo(b);
  const mesh = new Mesh(new CylinderGeometry(radius, radius, length, 6), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}

function labelTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  draw(ctx, w, h);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function buildSpeaker(spk: Speaker): Group {
  const root = new Group();
  root.name = spk.id;
  root.userData = { id: spk.id, model: spk.model, stand: spk.stand, line: spk.line };
  const [x, h, z] = planToThree(spk.position);

  const body = new MeshStandardMaterial({ color: 0x141517, roughness: 0.75 });
  const grille = new MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.9, metalness: 0.3 });
  const cone = new MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.5 });
  const metal = new MeshStandardMaterial({ color: 0x59616b, roughness: 0.5, metalness: 0.7 });

  // Cabinet tilted up about its center; the face looks south, toward the seats.
  const cab = new Group();
  cab.position.set(x, h, z);
  cab.rotation.order = 'YXZ';
  cab.rotation.y = Math.PI;
  cab.rotation.x = (spk.tiltUpDeg * Math.PI) / 180;
  cab.add(new Mesh(new BoxGeometry(SPK_W, SPK_H, SPK_D), body));
  const face = new Mesh(new BoxGeometry(SPK_W - 0.04, SPK_H - 0.04, 0.012), grille);
  face.position.z = -SPK_D / 2 - 0.004;
  cab.add(face);
  const woofer = new Mesh(new CylinderGeometry(0.15, 0.15, 0.02, 20), cone);
  woofer.rotation.x = Math.PI / 2;
  woofer.position.set(0, -0.08, -SPK_D / 2 - 0.014);
  cab.add(woofer);
  const horn = new Mesh(new BoxGeometry(0.12, 0.07, 0.02), cone);
  horn.position.set(0, 0.22, -SPK_D / 2 - 0.014);
  cab.add(horn);
  root.add(cab);

  // Yoke: arm from the plate on the riser face to the cabinet.
  const armLen = STAND_FRONT_Y - z;
  const arm = new Mesh(new BoxGeometry(0.08, 0.12, armLen), metal);
  arm.position.set(x, h, z + armLen / 2);
  root.add(arm);
  const plate = new Mesh(new BoxGeometry(0.2, 0.3, 0.012), metal);
  plate.position.set(x, h, STAND_FRONT_Y - 0.006);
  root.add(plate);
  return root;
}

export interface AudioSystem {
  /** Speakers and the cable tray, always installed. */
  readonly installed: Group;
}

/** The four speakers (two per stand, on the front of each stand) and the audio cable runs that feed them. */
export function createAudioSystem(): AudioSystem {
  const installed = new Group();
  installed.name = 'audioSystem';
  for (const spk of SPEAKERS) installed.add(buildSpeaker(spk));

  for (const run of AUDIO_RUNS) {
    const mat = new MeshStandardMaterial({ color: LINE_COLOR[run.line], roughness: 0.6 });
    const offset = LINE_OFFSET[run.line];
    const pts = run.points.map((p) => vec(p).add(offset));
    pts.slice(1).forEach((b, i) => installed.add(segment(pts[i]!, b, CABLE_R, mat)));
  }
  // Short drops from the floor raceway to the connector panel of each cabinet.
  for (const spk of SPEAKERS) {
    const mat = new MeshStandardMaterial({ color: LINE_COLOR[spk.line], roughness: 0.6 });
    const off = LINE_OFFSET[spk.line];
    const run = new Vector3(spk.position.x, FLOOR_RUN_H, FLOOR_RUN_Y).add(off);
    const rear = new Vector3(spk.position.x, spk.position.h - 0.3, spk.position.y - 0.1).add(off);
    installed.add(segment(run, rear, CABLE_R, mat));
  }
  return { installed };
}

export interface FohStation {
  /** Table and wall panel: stay when the mixer is taken away. */
  readonly fixed: Group;
  /** Portable mixer and its two patch cables: toggled to show it unplugged and stored. */
  readonly mixer: Group;
  readonly obstacle: Obstacle;
}

function panelTexture(): CanvasTexture {
  return labelTexture((ctx, w, h) => {
    ctx.fillStyle = '#c9ced4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1b1f24';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AUDIO IN', w / 2, 26);
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText('L', w * 0.2, h - 12);
    ctx.fillText('R', w * 0.5, h - 12);
    ctx.fillText('AC 127 V', w * 0.8, h - 12);
  }, 340, 160);
}

function mixerTopTexture(): CanvasTexture {
  return labelTexture((ctx, w, h) => {
    ctx.fillStyle = '#2b2f36';
    ctx.fillRect(0, 0, w, h);
    const strips = 12;
    const sw = w / (strips + 1.4);
    for (let i = 0; i < strips; i++) {
      const x = 8 + i * sw;
      ctx.fillStyle = i % 2 ? '#353a42' : '#30353c';
      ctx.fillRect(x, 6, sw - 4, h - 12);
      ctx.fillStyle = '#d8dde3';
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.arc(x + sw / 2 - 2, 26 + k * 34, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#0d0f12';
      ctx.fillRect(x + sw / 2 - 3, h - 118, 3, 100);
      ctx.fillStyle = '#e8edf2';
      ctx.fillRect(x + sw / 2 - 9, h - 80 - (i % 3) * 14, 15, 9);
    }
    ctx.fillStyle = '#3ddc84';
    ctx.fillRect(w - 38, 18, 18, 8);
    ctx.fillStyle = '#e8edf2';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText('MG12XU', w - 72, h - 6);
  }, 620, 400);
}

/** Operator table with the wall panel, and the removable mixer plugged into it. */
export function createFohStation(): FohStation {
  const fixed = new Group();
  fixed.name = 'fohTable';
  const wood = new MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.7 });
  const metal = new MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.5, metalness: 0.6 });
  const plasticDark = new MeshStandardMaterial({ color: 0x15181c, roughness: 0.6 });

  const { center, length, depth, topHeight } = FOH.table;
  const floorH = FOH.floorH;
  const table = new Group();
  table.position.set(center.x, floorH, center.y);
  const top = new Mesh(new BoxGeometry(length, TABLE_TOP_T, depth), wood);
  top.position.y = topHeight - TABLE_TOP_T / 2;
  table.add(top);
  const legH = topHeight - TABLE_TOP_T;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new Mesh(new BoxGeometry(TABLE_LEG, legH, TABLE_LEG), metal);
      leg.position.set(sx * (length / 2 - TABLE_LEG), legH / 2, sz * (depth / 2 - TABLE_LEG));
      table.add(leg);
    }
  }
  fixed.add(table);

  // Wall panel on the north face of the offices block (Y 24.5), facing north.
  const { panel } = FOH;
  const box = new Mesh(new BoxGeometry(panel.width, panel.height, 0.04), new MeshStandardMaterial({ color: 0x59616b, roughness: 0.5, metalness: 0.6 }));
  box.position.set(panel.x, panel.h, panel.y - 0.02);
  fixed.add(box);
  const plate = new Mesh(new PlaneGeometry(panel.width - 0.02, panel.height - 0.02), new MeshBasicMaterial({ map: panelTexture() }));
  plate.rotation.y = Math.PI;
  plate.position.set(panel.x, panel.h, panel.y - 0.0415);
  fixed.add(plate);
  const xlrX = [panel.x - panel.width * 0.3, panel.x];
  for (const x of xlrX) {
    const xlr = new Mesh(new CylinderGeometry(0.014, 0.014, 0.01, 12), plasticDark);
    xlr.rotation.x = Math.PI / 2;
    xlr.position.set(x, panel.h + 0.01, panel.y - 0.046);
    fixed.add(xlr);
  }
  const outlet = new Mesh(new BoxGeometry(0.04, 0.05, 0.01), plasticDark);
  outlet.position.set(panel.x + panel.width * 0.3, panel.h + 0.01, panel.y - 0.046);
  fixed.add(outlet);

  // Portable mixer, rear (connectors) toward the wall.
  const mixer = new Group();
  mixer.name = 'mixer';
  mixer.userData = { model: MIXER_MODEL, removable: true };
  const bodyMat = new MeshStandardMaterial({ color: 0x1d2025, roughness: 0.6 });
  const mixerBody = new Mesh(new BoxGeometry(MIXER.w, MIXER.h, MIXER.d), bodyMat);
  mixerBody.position.set(center.x, floorH + topHeight + MIXER.h / 2, center.y);
  mixer.add(mixerBody);
  const topPlate = new Mesh(new PlaneGeometry(MIXER.w - 0.01, MIXER.d - 0.01), new MeshBasicMaterial({ map: mixerTopTexture() }));
  topPlate.rotation.x = -Math.PI / 2;
  topPlate.position.set(center.x, floorH + topHeight + MIXER.h + 0.001, center.y);
  mixer.add(topPlate);

  // Two XLR patch cables with a sag, from the panel jacks to the rear of the mixer.
  const rearZ = center.y + MIXER.d / 2;
  xlrX.forEach((x, i) => {
    const line: AudioLine = i === 0 ? 'L' : 'R';
    const to = new Vector3(center.x + (i === 0 ? -0.08 : 0.08), floorH + topHeight + MIXER.h * 0.5, rearZ);
    const from = new Vector3(x, panel.h + 0.01, panel.y - 0.05);
    const mid = new Vector3((from.x + to.x) / 2, Math.min(from.y, to.y) - 0.08, (from.z + to.z) / 2 - 0.04);
    const tube = new Mesh(
      new TubeGeometry(new CatmullRomCurve3([from, mid, to]), 16, CABLE_R, 6),
      new MeshStandardMaterial({ color: LINE_COLOR[line], roughness: 0.6 }),
    );
    mixer.add(tube);
  });

  const obstacle: Obstacle = {
    minX: center.x - length / 2,
    maxX: center.x + length / 2,
    minZ: center.y - depth / 2,
    maxZ: center.y + depth / 2,
    maxY: floorH + TABLE_SOLID_TOP_M,
  };
  return { fixed, mixer, obstacle };
}
