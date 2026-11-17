import type { PlanPoint } from '../domain/coords.ts';
import { AUDIO_RUNS } from './audio.ts';
import { CAMERAS } from './cameras.ts';
import { MODEL_ACCESS_POINTS } from './modelAps.ts';

/**
 * Structured cabling plan: pathways (trays, conduits), penetrations and the
 * route of every device. Plan coordinates (X east, Y south, h up, meters).
 *
 * The rooms under the stands are restrooms and locker rooms, so no route goes
 * through them: everything runs through the annex, the aisle opening, the
 * back wall, the perimeter walls and the offices north wall. Everything the 3D
 * model cannot confirm is marked as an assumption in
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
  /**
   * A cable that follows an existing tray in the opposite direction (copper
   * leaving the north IDF along the tray the fiber came by): not drawn, not
   * counted in the quantities; `physical` is the tray it shares.
   */
  readonly physical?: string;
}

const p = (x: number, y: number, h: number): PlanPoint => ({ x, y, h });

/** Standard sizes. */
const BASKET = { widthMm: 100, depthMm: 50 } as const;
const BASKET_WIDE = { widthMm: 200, depthMm: 50 } as const;
/** Rigid sleeve through a wall: 100 mm inner diameter (4"). */
const SLEEVE_4IN = { widthMm: 100, depthMm: 100 } as const;

/** Courts trays: above the top stand row (3.77 m) and under the roof start (6.85 m). */
const H_HIGH = 5.7;
const H_ROOM = 2.4;
/** Just under the annex ceiling / the lintel over the aisle opening (soffit at 3.28 m). */
const H_ANNEX = 3.1;
/** East side of the offices wall: above the post at X 46.5 (reaches 2.9 m) and the audio run (3.0 m). */
const H_OFFICES = 3.4;
/** Wall faces: west X 0, north Y 0, east X 54.6, back (south) Y 32.2. Trays sit 0.15-0.2 m off the face. */
const X_WEST = 0.2;
const Y_NORTH = 0.15;
const X_EAST = 54.45;
const Y_BACK = 32.05;
/** Piers of the aisle opening in the south wall (X 16.64-25.84); risers hug their end faces. */
const X_PIER_W = 16.75;
const X_PIER_E = 25.7;
/** North intermediate distribution frame (IDF): wall cabinet on the north wall, fed by fiber. */
export const IDF = {
  id: 'IDF-N',
  position: p(30.0, 0.15, 3.0),
  /** Wall-mount 6U cabinet, meters. */
  size: { w: 0.6, h: 0.4, d: 0.4 },
  /** The 24-port PoE++ switch of the hardware budget, moved here from the rack; 12 of its ports are used. */
  switchModel: 'TP-Link SG3428XMPP',
  ports: 12,
} as const;
const X_IDF = IDF.position.x;

export const PATHWAYS: readonly Pathway[] = [
  // -- From the rack: network room → south wall sleeve → annex trunk.
  { id: 'ANNEX_FEED', kind: 'tray', service: 'data', label: 'Rack to the south wall sleeve (PEN-3)', ...BASKET_WIDE, points: [p(14.44, 30.1, H_ROOM), p(12.9, 30.1, 2.5), p(12.9, 32.6, 2.5)] },
  { id: 'ANNEX_W', kind: 'tray', service: 'data', label: 'Annex trunk, west', ...BASKET, points: [p(12.9, 32.6, H_ANNEX), p(5.0, 32.6, H_ANNEX)] },
  { id: 'ANNEX_E1', kind: 'tray', service: 'data', label: 'Annex trunk, to the west pier of the aisle opening', ...BASKET, points: [p(12.9, 32.6, H_ANNEX), p(X_PIER_W, 32.6, H_ANNEX)] },
  { id: 'ANNEX_E2', kind: 'tray', service: 'data', label: 'Annex trunk, hung across the aisle opening under the lintel', ...BASKET, points: [p(X_PIER_W, 32.6, H_ANNEX), p(X_PIER_E, 32.6, H_ANNEX)] },
  { id: 'ANNEX_E3', kind: 'tray', service: 'data', label: 'Annex trunk, east', ...BASKET, points: [p(X_PIER_E, 32.6, H_ANNEX), p(37.4, 32.6, H_ANNEX)] },
  // -- Up the west pier, over the west stand along the back wall, along the west wall and the north wall to the IDF.
  { id: 'RISER_W', kind: 'tray', service: 'data', label: 'Riser at the west pier, through the opening and up the back wall', ...BASKET_WIDE, points: [p(X_PIER_W, 32.6, H_ANNEX), p(X_PIER_W, Y_BACK, H_ANNEX), p(X_PIER_W, Y_BACK, H_HIGH)] },
  { id: 'BACK_W', kind: 'tray', service: 'data', label: 'Back wall over the west stand', ...BASKET_WIDE, points: [p(X_PIER_W, Y_BACK, H_HIGH), p(X_WEST, Y_BACK, H_HIGH)] },
  { id: 'WEST', kind: 'tray', service: 'data', label: 'West wall, above the stand and the courts', ...BASKET_WIDE, points: [p(X_WEST, Y_BACK, H_HIGH), p(X_WEST, Y_NORTH, H_HIGH)] },
  { id: 'NORTH_A', kind: 'tray', service: 'data', label: 'North wall, west part, up to the IDF', ...BASKET_WIDE, points: [p(X_WEST, Y_NORTH, H_HIGH), p(X_IDF, Y_NORTH, H_HIGH)] },
  // -- Up the east pier, along the back wall over the east stand and down its end wall to M12.
  { id: 'RISER_E', kind: 'tray', service: 'data', label: 'Riser at the east pier, through the opening and up the back wall', ...BASKET, points: [p(X_PIER_E, 32.6, H_ANNEX), p(X_PIER_E, Y_BACK, H_ANNEX), p(X_PIER_E, Y_BACK, H_HIGH)] },
  { id: 'BACK_E', kind: 'tray', service: 'data', label: 'Back wall over the east stand and its end wall', ...BASKET, points: [p(X_PIER_E, Y_BACK, H_HIGH), p(42.35, Y_BACK, H_HIGH), p(42.35, 28.2, H_HIGH)] },
  // -- North IDF: copper from the IDF to the north wall, west wall, stage and offices.
  { id: 'IDF_UP', kind: 'tray', service: 'data', label: 'IDF cabinet up to the north wall tray', ...BASKET_WIDE, points: [p(X_IDF, Y_NORTH, IDF.position.h), p(X_IDF, Y_NORTH, H_HIGH)] },
  { id: 'ID_W', kind: 'tray', service: 'data', label: 'Copper west from the IDF along the north wall tray', ...BASKET_WIDE, physical: 'NORTH_A', points: [p(X_IDF, Y_NORTH, H_HIGH), p(X_WEST, Y_NORTH, H_HIGH)] },
  { id: 'WEST_R', kind: 'tray', service: 'data', label: 'Copper south along the west wall tray', ...BASKET_WIDE, physical: 'WEST', points: [p(X_WEST, Y_NORTH, H_HIGH), p(X_WEST, Y_BACK, H_HIGH)] },
  { id: 'NORTH_B', kind: 'tray', service: 'data', label: 'North wall, east part', ...BASKET, points: [p(X_IDF, Y_NORTH, H_HIGH), p(X_EAST, Y_NORTH, H_HIGH)] },
  { id: 'STAGE_N', kind: 'tray', service: 'data', label: 'Stage east wall, north end', ...BASKET, points: [p(X_EAST, Y_NORTH, H_HIGH), p(X_EAST, 4.26, H_HIGH)] },
  { id: 'BR_M18', kind: 'tray', service: 'data', label: 'Stage branch to M18', ...BASKET, points: [p(X_EAST, 4.26, H_HIGH), p(49.0, 4.26, H_HIGH)] },
  { id: 'STAGE_S', kind: 'tray', service: 'data', label: 'Stage east wall, south part', ...BASKET, points: [p(X_EAST, 4.26, H_HIGH), p(X_EAST, 24.35, H_HIGH), p(X_EAST, 24.35, H_OFFICES)] },
  { id: 'STAGE_W', kind: 'tray', service: 'data', label: 'Offices north wall, stage side', ...BASKET, points: [p(X_EAST, 24.35, H_OFFICES), p(49.0, 24.35, H_OFFICES)] },
  { id: 'PEN6', kind: 'conduit', service: 'data', label: 'Offices north wall sleeve (PEN-6)', ...SLEEVE_4IN, points: [p(49.0, 24.35, H_OFFICES), p(49.0, 24.85, H_OFFICES)] },
  { id: 'OFFICES', kind: 'tray', service: 'data', label: 'Offices, north and west walls', ...BASKET, points: [p(49.0, 24.85, H_OFFICES), p(42.8, 24.85, H_OFFICES), p(42.8, 30.0, H_OFFICES)] },
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
  /** Pathway that goes through it. */
  readonly pathway: string;
  /** Material thickness crossed, meters (from the model). */
  readonly thicknessM: number;
}

/** Every hole the plan needs. Everything else is surface-mounted (anchors only). */
export const PENETRATIONS: readonly Penetration[] = [
  { id: 'PEN-3', kind: 'wall', description: 'Network room south wall → annex', position: p(12.9, 32.3, 2.5), sleeves: 2, diameterMm: 100, pathway: 'ANNEX_FEED', thicknessM: 0.2 },
  { id: 'PEN-6', kind: 'wall', description: 'Offices north wall → offices (stage side to inside)', position: p(49.0, 24.6, H_OFFICES), sleeves: 2, diameterMm: 100, pathway: 'PEN6', thicknessM: 0.2 },
];

/** Closest a pathway or drop must stay to a wall, ceiling or post along its whole length. */
export const HUG_DISTANCE_M = 0.35;

/**
 * Stretches that cannot hug a surface: the stage has free-standing posts and no
 * roof within reach (8.2 m). `maxFarM` is the longest part allowed beyond
 * HUG_DISTANCE_M; `support` says how the stretch is held.
 */
export interface FreeSpan {
  readonly id: string;
  readonly kind: 'pathway' | 'drop';
  readonly maxFarM: number;
  readonly support: string;
}
export const FREE_SPANS: readonly FreeSpan[] = [
  { id: 'BR_M18', kind: 'pathway', maxFarM: 5.5, support: 'M18 sits on a free-standing post 6 m from the east wall: tray hung from the stage roof (8.2 m) with threaded rod every 1.5 m.' },
  { id: 'M17', kind: 'drop', maxFarM: 2.5, support: 'M17 is on a free-standing post: rigid conduit from the offices wall to the post, supported every 1.5 m at most.' },
  { id: 'M18', kind: 'drop', maxFarM: 3.2, support: 'Rigid conduit down the post from the hung tray to the AP.' },
];

/** Where a device's copper starts: the rack, or the north IDF. */
export type Hub = 'rack' | 'idf';

export interface CableDevice {
  readonly id: string;
  readonly kind: 'AP' | 'camera';
  readonly position: PlanPoint;
  readonly hub: Hub;
  /** Pathway chain serving the device (cable order from its hub); the last pathway is where the drop leaves the tray. */
  readonly chain: readonly string[];
}

const FROM_RACK_W = ['ANNEX_FEED', 'ANNEX_E1', 'RISER_W'] as const;
const FROM_RACK_E = ['ANNEX_FEED', 'ANNEX_E1', 'ANNEX_E2', 'RISER_E'] as const;
const ANNEX_E = ['ANNEX_FEED', 'ANNEX_E1', 'ANNEX_E2', 'ANNEX_E3'] as const;
const FROM_IDF_STAGE = ['IDF_UP', 'NORTH_B', 'STAGE_N', 'STAGE_S'] as const;
/** Chain and hub by device id. */
const ROUTE_BY_ID: Readonly<Record<string, { hub: Hub; chain: readonly string[] }>> = {
  // Rack: annex, back wall and the east stand end wall.
  M13: { hub: 'rack', chain: ['ANNEX_FEED', 'ANNEX_W'] },
  CAM11: { hub: 'rack', chain: ['ANNEX_FEED', 'ANNEX_W'] },
  M14: { hub: 'rack', chain: ['ANNEX_FEED', 'ANNEX_E1', 'ANNEX_E2'] },
  M15: { hub: 'rack', chain: [...ANNEX_E] },
  CAM12: { hub: 'rack', chain: [...ANNEX_E] },
  M09: { hub: 'rack', chain: [...FROM_RACK_W, 'BACK_W'] },
  CAM10: { hub: 'rack', chain: [...FROM_RACK_W, 'BACK_W'] },
  M07: { hub: 'rack', chain: [...FROM_RACK_W, 'BACK_W', 'WEST'] },
  M10: { hub: 'rack', chain: [...FROM_RACK_E, 'BACK_E'] },
  M12: { hub: 'rack', chain: [...FROM_RACK_E, 'BACK_E'] },
  // North IDF: north wall, west wall, stage and offices.
  M01: { hub: 'idf', chain: ['IDF_UP', 'ID_W'] },
  M02: { hub: 'idf', chain: ['IDF_UP', 'ID_W'] },
  M03: { hub: 'idf', chain: ['IDF_UP', 'ID_W'] },
  CAM02: { hub: 'idf', chain: ['IDF_UP', 'ID_W'] },
  M04: { hub: 'idf', chain: ['IDF_UP', 'NORTH_B'] },
  M06: { hub: 'idf', chain: ['IDF_UP', 'ID_W', 'WEST_R'] },
  CAM04: { hub: 'idf', chain: ['IDF_UP', 'NORTH_B', 'STAGE_N'] },
  M18: { hub: 'idf', chain: ['IDF_UP', 'NORTH_B', 'STAGE_N', 'BR_M18'] },
  CAM05: { hub: 'idf', chain: [...FROM_IDF_STAGE] },
  M17: { hub: 'idf', chain: [...FROM_IDF_STAGE, 'STAGE_W'] },
  M16: { hub: 'idf', chain: [...FROM_IDF_STAGE, 'STAGE_W', 'PEN6', 'OFFICES'] },
  CAM07: { hub: 'idf', chain: [...FROM_IDF_STAGE, 'STAGE_W', 'PEN6', 'OFFICES'] },
};

const routeOf = (id: string) => {
  const r = ROUTE_BY_ID[id];
  if (!r) throw new Error(`no cabling route for ${id}`);
  return r;
};

export const CABLE_DEVICES: readonly CableDevice[] = [
  ...MODEL_ACCESS_POINTS.map((a): CableDevice => ({ id: a.id, kind: 'AP', position: a.position, ...routeOf(a.id) })),
  ...CAMERAS.filter((c) => !c.hidden).map((c): CableDevice => ({ id: c.id, kind: 'camera', position: c.position, ...routeOf(c.id) })),
];

/** Fiber backbone rack → IDF (OM3, 10GBASE-SR): same pathways as the copper to the north wall. */
export const BACKBONE_FIBER_CHAIN: readonly string[] = ['ANNEX_FEED', 'ANNEX_E1', 'RISER_W', 'BACK_W', 'WEST', 'NORTH_A', 'IDF_UP'];
/** 10GBASE-SR over OM3 reaches 300 m (TIA-568.3). */
export const OM3_MAX_M = 300;

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
  /** Copper length from its hub to the attach point along the pathways, meters. */
  readonly trayM: number;
  readonly dropM: number;
  readonly attach: PlanPoint;
  /** Permanent link (tray + drop). */
  readonly linkM: number;
  /** Cut length with slack and service loops. */
  readonly cutM: number;
}

export function routeDevice(device: CableDevice): DeviceRoute {
  const last = pathway(device.chain[device.chain.length - 1]!);
  const before = device.chain.slice(0, -1).reduce((sum, id) => sum + pathLength(pathway(id).points), 0);
  const a = attachPoint(last, device.position);
  const linkM = before + a.along + a.offset;
  return { device, chain: device.chain, trayM: before + a.along, dropM: a.offset, attach: a.at, linkM, cutM: linkM * SLACK_FACTOR + SERVICE_LOOP_M };
}

export const DEVICE_ROUTES: readonly DeviceRoute[] = CABLE_DEVICES.map(routeDevice);

/** Length of the OM3 backbone, with a service loop at each end. */
export function backboneFiberM(): number {
  return BACKBONE_FIBER_CHAIN.reduce((sum, id) => sum + pathLength(pathway(id).points), 0) * SLACK_FACTOR + SERVICE_LOOP_M;
}

/** Copper cables carried by a physical pathway (counting the copper that reuses it in the other direction). */
export function cablesOn(id: string): number {
  const twins = PATHWAYS.filter((w) => w.physical === id).map((w) => w.id);
  return DEVICE_ROUTES.filter((r) => r.chain.some((c) => c === id || twins.includes(c))).length;
}
