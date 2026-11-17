import type { PlanPoint } from '../domain/coords.ts';
import { AUDIO_RUNS, type AudioLine } from './audio.ts';
import { CAMERAS } from './cameras.ts';
import { MODEL_ACCESS_POINTS } from './modelAps.ts';

/**
 * Structured cabling plan: pathways (trays, conduits), penetrations and the
 * route of every device. Plan coordinates (X east, Y south, h up, meters).
 * Everything the 3D model cannot confirm is marked as an assumption in
 * docs/memoria-tecnica-adaptada.md and must be checked in the site survey.
 */
export type PathwayKind = 'tray' | 'conduit' | 'raceway';
export type Service = 'data' | 'audio';

export interface Pathway {
  readonly id: string;
  readonly kind: PathwayKind;
  readonly service: Service;
  readonly label: string;
  /** Wire-basket tray: `widthMm` × `depthMm`. Conduit / raceway: inner diameter in `widthMm`. */
  readonly widthMm: number;
  readonly depthMm: number;
  readonly points: readonly PlanPoint[];
}

const p = (x: number, y: number, h: number): PlanPoint => ({ x, y, h });

/** Standard sizes. */
const BASKET = { widthMm: 100, depthMm: 50 } as const;
const BASKET_WIDE = { widthMm: 200, depthMm: 50 } as const;
/** Rigid sleeve / EMT through the walls and slab: 100 mm inner diameter (4"). */
const SLEEVE_4IN = { widthMm: 100, depthMm: 100 } as const;

/** Heights: courts trays hang 0.95 m under the roof start (6.85 m) and above the top stand row (3.77 m). */
const H_HIGH = 5.7;
const H_VOID = 2.4;
const H_ANNEX = 2.8;
const H_OFFICES = 2.5;
/** Wall faces: west X 0, north Y 0, east X 54.6, back (south) Y 32.2. Trays sit 0.15 m off the face. */
const X_WEST = 0.15;
const Y_NORTH = 0.15;
const X_EAST = 54.45;
const Y_BACK = 32.05;

export const PATHWAYS: readonly Pathway[] = [
  // -- Data, west branch: network room → west void → slab core → courts west wall / north wall / back wall.
  { id: 'ROOM_W', kind: 'tray', service: 'data', label: 'Network room, rack to west wall sleeve', ...BASKET_WIDE, points: [p(14.44, 30.1, H_VOID), p(14.44, 31.1, H_VOID), p(12.0, 31.1, H_VOID)] },
  { id: 'VOID_W', kind: 'tray', service: 'data', label: 'West stand void, back corridor', ...BASKET_WIDE, points: [p(12.0, 31.1, H_VOID), p(0.5, 31.1, H_VOID)] },
  { id: 'RISER_W', kind: 'conduit', service: 'data', label: 'Slab core to the stand top, then riser', ...SLEEVE_4IN, points: [p(0.5, 31.1, H_VOID), p(0.5, 31.1, H_HIGH)] },
  { id: 'WEST', kind: 'tray', service: 'data', label: 'West wall, above the stands and courts', ...BASKET, points: [p(0.5, 31.1, H_HIGH), p(X_WEST, 31.1, H_HIGH), p(X_WEST, Y_NORTH, H_HIGH)] },
  { id: 'NORTH_W', kind: 'tray', service: 'data', label: 'North wall, west half', ...BASKET, points: [p(X_WEST, Y_NORTH, H_HIGH), p(37.9, Y_NORTH, H_HIGH)] },
  { id: 'BACK', kind: 'tray', service: 'data', label: 'Back wall, above the last stand row', ...BASKET, points: [p(0.5, 31.1, H_HIGH), p(0.5, Y_BACK, H_HIGH), p(25.8, Y_BACK, H_HIGH)] },
  // -- Data, annex: room south wall sleeve → annex trunk.
  { id: 'ANNEX_FEED', kind: 'tray', service: 'data', label: 'Rack to the south wall sleeve', ...BASKET_WIDE, points: [p(14.44, 30.1, H_VOID), p(12.9, 30.1, 2.5), p(12.9, 32.6, 2.5)] },
  { id: 'ANNEX_W', kind: 'tray', service: 'data', label: 'Annex trunk, west', ...BASKET, points: [p(12.9, 32.6, H_ANNEX), p(5.0, 32.6, H_ANNEX)] },
  { id: 'ANNEX_E', kind: 'tray', service: 'data', label: 'Annex trunk, east (hung across the aisle opening)', ...BASKET, points: [p(12.9, 32.6, H_ANNEX), p(36.0, 32.6, H_ANNEX)] },
  // -- Data, east branch: annex → east void → offices → stage.
  { id: 'PEN4', kind: 'conduit', service: 'data', label: 'South wall sleeve to the east void', ...SLEEVE_4IN, points: [p(36.0, 32.6, H_ANNEX), p(36.0, 32.6, 2.5), p(36.0, 31.6, 2.5)] },
  { id: 'VOID_E', kind: 'tray', service: 'data', label: 'East stand void, back corridor', ...BASKET, points: [p(36.0, 31.6, 2.5), p(40.5, 31.6, 2.5), p(40.5, 30.0, 2.5)] },
  { id: 'PEN5', kind: 'conduit', service: 'data', label: 'Offices west wall sleeve', ...SLEEVE_4IN, points: [p(40.5, 30.0, 2.5), p(43.2, 30.0, H_OFFICES)] },
  { id: 'OFFICES', kind: 'tray', service: 'data', label: 'Offices, west and north walls', ...BASKET, points: [p(43.2, 30.0, H_OFFICES), p(43.2, 25.2, H_OFFICES), p(49.0, 25.2, H_OFFICES)] },
  { id: 'PEN6', kind: 'conduit', service: 'data', label: 'Offices north wall sleeve to the stage side', ...SLEEVE_4IN, points: [p(49.0, 25.2, H_OFFICES), p(49.0, 24.3, H_OFFICES)] },
  { id: 'STAGE', kind: 'tray', service: 'data', label: 'Stage south edge and east wall', ...BASKET, points: [p(49.0, 24.3, H_OFFICES), p(X_EAST, 24.3, H_OFFICES), p(X_EAST, 24.3, H_HIGH), p(X_EAST, 4.26, H_HIGH)] },
  { id: 'STAGE_N', kind: 'tray', service: 'data', label: 'Stage east wall, north end', ...BASKET, points: [p(X_EAST, 4.26, H_HIGH), p(X_EAST, Y_NORTH, H_HIGH)] },
  { id: 'BR_M18', kind: 'tray', service: 'data', label: 'Stage branch to M18', ...BASKET, points: [p(X_EAST, 4.26, H_HIGH), p(49.0, 4.26, H_HIGH)] },
  // -- Audio (see src/data/audio.ts for the exact routes).
  ...AUDIO_RUNS.map((r): Pathway => ({
    id: `AUDIO_${r.line}`,
    kind: 'raceway',
    service: 'audio',
    label: r.line === 'L' ? 'Audio L: offices wall, over the back wall, west stand foot' : 'Audio R: offices wall, east stand foot',
    widthMm: 30,
    depthMm: 30,
    points: r.points,
  })),
];

export interface Penetration {
  readonly id: string;
  readonly kind: 'wall' | 'slab';
  readonly description: string;
  readonly position: PlanPoint;
  /** Sleeve count and inner diameter. */
  readonly sleeves: number;
  readonly diameterMm: number;
  /** Pathways that go through it. */
  readonly pathway: string;
  /** Material thickness crossed, meters (from the model). */
  readonly thicknessM: number;
}

/** Every hole the plan needs. Everything else is surface-mounted (anchors only). */
export const PENETRATIONS: readonly Penetration[] = [
  { id: 'PEN-1', kind: 'wall', description: 'Network room west wall → west stand void', position: p(12.29, 31.1, H_VOID), sleeves: 2, diameterMm: 100, pathway: 'ROOM_W', thicknessM: 0.2 },
  { id: 'PEN-2', kind: 'slab', description: 'Core through the west stand top slab (void ceiling 2.59 → stand floor 3.77)', position: p(0.5, 31.1, 3.2), sleeves: 2, diameterMm: 100, pathway: 'RISER_W', thicknessM: 1.18 },
  { id: 'PEN-3', kind: 'wall', description: 'Network room south wall → annex', position: p(12.9, 32.3, 2.5), sleeves: 2, diameterMm: 100, pathway: 'ANNEX_FEED', thicknessM: 0.2 },
  { id: 'PEN-4', kind: 'wall', description: 'Annex → east stand void (south wall, beside the door at X 34.5–35.4)', position: p(36.0, 32.3, 2.5), sleeves: 2, diameterMm: 100, pathway: 'PEN4', thicknessM: 0.2 },
  { id: 'PEN-5', kind: 'wall', description: 'East stand void → offices (offices west wall)', position: p(42.58, 30.0, H_OFFICES), sleeves: 2, diameterMm: 100, pathway: 'PEN5', thicknessM: 0.2 },
  { id: 'PEN-6', kind: 'wall', description: 'Offices → stage side (offices north wall)', position: p(49.0, 24.6, H_OFFICES), sleeves: 2, diameterMm: 100, pathway: 'PEN6', thicknessM: 0.2 },
  { id: 'PEN-7', kind: 'wall', description: 'Offices → M12 on the east stand end wall (offices west wall)', position: p(42.58, 28.47, 3.7), sleeves: 1, diameterMm: 50, pathway: 'M12', thicknessM: 0.2 },
];

/** Devices fed by data cable, with the pathway chain that serves each (cable order, starting at the rack). */
export interface CableDevice {
  readonly id: string;
  readonly kind: 'AP' | 'camera';
  readonly position: PlanPoint;
  readonly chain: readonly string[];
}

const W_CHAIN = ['ROOM_W', 'VOID_W', 'RISER_W'] as const;
const E_CHAIN = ['ANNEX_FEED', 'ANNEX_E', 'PEN4', 'VOID_E', 'PEN5', 'OFFICES'] as const;
/** Chain by device id; the last pathway is where the drop leaves the tray. */
const CHAIN_BY_ID: Readonly<Record<string, readonly string[]>> = {
  M01: [...W_CHAIN, 'WEST', 'NORTH_W'],
  M02: [...W_CHAIN, 'WEST', 'NORTH_W'],
  M03: [...W_CHAIN, 'WEST', 'NORTH_W'],
  M04: [...W_CHAIN, 'WEST', 'NORTH_W'],
  CAM02: [...W_CHAIN, 'WEST', 'NORTH_W'],
  M06: [...W_CHAIN, 'WEST'],
  M07: [...W_CHAIN, 'WEST'],
  CAM10: [...W_CHAIN, 'BACK'],
  M09: [...W_CHAIN, 'BACK'],
  M10: [...W_CHAIN, 'BACK'],
  M13: ['ANNEX_FEED', 'ANNEX_W'],
  CAM11: ['ANNEX_FEED', 'ANNEX_W'],
  M14: ['ANNEX_FEED', 'ANNEX_E'],
  M15: ['ANNEX_FEED', 'ANNEX_E'],
  CAM12: ['ANNEX_FEED', 'ANNEX_E'],
  M12: [...E_CHAIN],
  M16: [...E_CHAIN],
  CAM07: [...E_CHAIN],
  M17: [...E_CHAIN, 'PEN6', 'STAGE'],
  CAM05: [...E_CHAIN, 'PEN6', 'STAGE'],
  M18: [...E_CHAIN, 'PEN6', 'STAGE', 'BR_M18'],
  CAM04: [...E_CHAIN, 'PEN6', 'STAGE', 'STAGE_N'],
};

const chainOf = (id: string): readonly string[] => {
  const c = CHAIN_BY_ID[id];
  if (!c) throw new Error(`no cabling chain for ${id}`);
  return c;
};

export const CABLE_DEVICES: readonly CableDevice[] = [
  ...MODEL_ACCESS_POINTS.map((a): CableDevice => ({ id: a.id, kind: 'AP', position: a.position, chain: chainOf(a.id) })),
  ...CAMERAS.filter((c) => !c.hidden).map((c): CableDevice => ({ id: c.id, kind: 'camera', position: c.position, chain: chainOf(c.id) })),
];

// ---------- geometry helpers ----------

const dist = (a: PlanPoint, b: PlanPoint): number => Math.hypot(a.x - b.x, a.y - b.y, a.h - b.h);
const manhattan = (a: PlanPoint, b: PlanPoint): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.h - b.h);

export function pathLength(points: readonly PlanPoint[]): number {
  return points.slice(1).reduce((sum, q, i) => sum + dist(points[i]!, q), 0);
}

const BY_ID = new Map(PATHWAYS.map((w) => [w.id, w]));
export const pathway = (id: string): Pathway => {
  const w = BY_ID.get(id);
  if (!w) throw new Error(`unknown pathway ${id}`);
  return w;
};

/** Closest point of a pathway to `target`, by Manhattan offset; returns distance along the pathway. */
export function attachPoint(w: Pathway, target: PlanPoint): { along: number; offset: number; at: PlanPoint } {
  let best = { along: 0, offset: Infinity, at: w.points[0]! };
  let acc = 0;
  for (let i = 1; i < w.points.length; i++) {
    const a = w.points[i - 1]!;
    const b = w.points[i]!;
    const len = dist(a, b);
    for (let s = 0; s <= len; s += 0.05) {
      const f = len === 0 ? 0 : s / len;
      const at = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, h: a.h + (b.h - a.h) * f };
      const offset = manhattan(at, target);
      if (offset < best.offset) best = { along: acc + s, offset, at };
    }
    acc += len;
  }
  return best;
}

/** Longest conduit drop from a tray to a device. */
export const MAX_DROP_M = 10;
/** Service loop at each end plus 10% slack, per the installation rules in the report. */
export const SLACK_FACTOR = 1.1;
export const SERVICE_LOOP_M = 5;

export interface DeviceRoute {
  readonly device: CableDevice;
  readonly chain: readonly string[];
  /** Cable length from the rack to the attach point along the pathways, meters. */
  readonly trayM: number;
  readonly dropM: number;
  readonly attach: PlanPoint;
  /** Permanent link (tray + drop). */
  readonly linkM: number;
  /** Cut length with slack and service loops. */
  readonly cutM: number;
  /** Pathways the cable travels, in order. */
  readonly pathways: readonly string[];
}

export function routeDevice(device: CableDevice): DeviceRoute {
  const last = pathway(device.chain[device.chain.length - 1]!);
  const before = device.chain.slice(0, -1).reduce((sum, id) => sum + pathLength(pathway(id).points), 0);
  const a = attachPoint(last, device.position);
  const linkM = before + a.along + a.offset;
  return { device, chain: device.chain, trayM: before + a.along, dropM: a.offset, attach: a.at, linkM, cutM: linkM * SLACK_FACTOR + SERVICE_LOOP_M, pathways: device.chain };
}

export const DEVICE_ROUTES: readonly DeviceRoute[] = CABLE_DEVICES.map(routeDevice);

/** Data cables carried by each pathway (those whose chain includes it; the last pathway only up to the attach point). */
export function cablesOn(id: string): number {
  return DEVICE_ROUTES.filter((r) => r.chain.includes(id)).length;
}

export const AUDIO_LINES: readonly AudioLine[] = ['L', 'R'];
