import type { PlanPoint } from '../domain/coords.ts';
import { AUDIO_RUNS, FLOOR_CONDUIT, FLOOR_RUN_H, FLOOR_RUN_Y, SPEAKERS } from './audio.ts';
import { PROJECT_CAMERAS } from './projectCameras.ts';
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
/**
 * `tray`: wire-basket tray. `conduit`: rigid steel sleeve through a wall. `emt`: EMT metal conduit on the
 * wall. `rmc`: rigid steel conduit (thick wall), audio within 2 m of the floor. `plastic`: surface plastic raceway,
 * interior dry spaces only. `raceway`: audio raceway (no longer used: the audio runs in EMT and RMC).
 * Everything on the courts and stands side (back wall, risers, west and north walls) is EMT metal conduit: the public can reach the stands and the courts take balls. Wire-basket tray stays only in the annex, where nobody goes.
 */
export type PathwayKind = 'tray' | 'conduit' | 'raceway' | 'emt' | 'rmc' | 'plastic';
export type Service = 'data' | 'audio';

export interface Pathway {
  readonly id: string;
  readonly kind: PathwayKind;
  readonly service: Service;
  readonly label: string;
  /** EMT trade size, e.g. `¾"`. */
  readonly trade?: string;
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
/** EMT inner diameters (NEC Chapter 9, Table 4), in `widthMm`; `depthMm` repeats it. */
const EMT_HALF = { widthMm: 15.8, depthMm: 15.8, trade: '½"' } as const;
const EMT_THREE_QUARTER = { widthMm: 20.9, depthMm: 20.9, trade: '¾"' } as const;
const EMT_ONE = { widthMm: 26.6, depthMm: 26.6, trade: '1"' } as const;
const EMT_ONE_QUARTER = { widthMm: 35.1, depthMm: 35.1, trade: '1¼"' } as const;
const EMT_ONE_HALF = { widthMm: 40.9, depthMm: 40.9, trade: '1½"' } as const;
/** Rigid steel conduit (RMC) ¾": inner diameter 21.2 mm, outer 26.7 mm (NEC Chapter 9, Table 4, secondary sources). */
const RMC_THREE_QUARTER = { widthMm: 21.2, depthMm: 21.2, trade: '¾"' } as const;
export const RMC_OD_MM: Readonly<Record<string, number>> = { '¾"': 26.7 };
/** EMT outer diameters by trade size (inner diameter plus the wall), for drawing the straps. */
export const EMT_OD_MM: Readonly<Record<string, number>> = { '½"': 17.9, '¾"': 23.4, '1"': 29.5, '1¼"': 38.4, '1½"': 44.2 };
/** Surface plastic raceway for 1-2 cables, mounted flush on the wall. */
const PLASTIC = { widthMm: 40, depthMm: 25 } as const;
/** Rigid sleeve through a wall: 100 mm inner diameter (4"). */
const SLEEVE_4IN = { widthMm: 100, depthMm: 100 } as const;
/** Rigid sleeve through the outer wall for one exterior camera cable: 50 mm inner diameter (2"). */
const SLEEVE_2IN = { widthMm: 50, depthMm: 50 } as const;

/** Courts trays: above the top stand row (3.77 m) and under the roof start (6.85 m). */
const H_HIGH = 5.7;
const H_ROOM = 2.4;
/** Just under the annex ceiling / the lintel over the aisle opening (soffit at 3.28 m). */
const H_ANNEX = 3.1;
/** The risers hug the lintel soffit (3.28 m) while they pass through the aisle opening: the tube axis sits 0.03 m under it. */
const H_LINTEL = 3.25;
/** East side of the offices wall: above the post at X 46.5 (reaches 2.9 m) and the audio run (3.0 m). */
const H_OFFICES = 3.4;
/** Wall faces: west X 0, north Y 0, east X 54.6, back (south) Y 32.2. Trays sit 0.15-0.2 m off the face. */
const X_WEST = 0.03;
const Y_NORTH = 0.03;
const X_EAST = 54.57;
const Y_BACK = 32.17;
/** Piers of the aisle opening in the south wall (X 16.64-25.84); risers hug their end faces. */
const X_PIER_W = 16.67;
const X_PIER_E = 25.81;
/** North intermediate distribution frame (IDF): wall cabinet on the north wall, fed by fiber. */
export const IDF = {
  id: 'IDF-N',
  /** Center height: the cabinet top (5.6 m) sits just under the north wall conduit (5.7 m), which runs over it. */
  position: p(30.0, 0.15, 5.4),
  /** Wall-mount 6U cabinet, meters. */
  size: { w: 0.6, h: 0.4, d: 0.4 },
  /** The 24-port PoE++ switch of the hardware budget, moved here from the rack; 12 of its ports are used. */
  switchModel: 'TP-Link SG3428XMPP',
  ports: 7,
} as const;
const X_IDF = IDF.position.x;
/** Plastic raceway goes flush on the wall (0.04 m off): annex north wall face Y 32.4, offices inside faces X 42.68 and Y 24.7. */
const Y_ANNEX_FLUSH = 32.44;
const X_OFFICES_FLUSH = 42.72;
const Y_OFFICES_N_FLUSH = 24.74;
/** Splayed wall that carries M18: it starts at the north wall (face at X 46.5) and runs to M18 at Y 4.3. The branch leaves the north tray just west of it. */
const X_M18_WALL = 46.39;
/** Inside face of the offices west wall (the wall is X 42.48-42.68). */
const X_OFFICES_W = 42.85;
/** Wall sleeve into the offices: just over the top row of the east stand (3.77 m) and under the offices roof (3.9 m). */
const H_PEN7 = 3.8;
/**
 * Branch height along the walls that carry M17 and M18: both are 2.98 m tall, so the conduit lies on the face 3 cm
 * under the top. It stops 0.35 m short of the AP (wall-mounted at 2.84-2.88 m), where the drop leaves.
 */
const H_M18 = 2.95;
/** East stand end wall: the tray is 0.15 m off its west face (face at X 42.5), above the stand top row. */
const X_ENDWALL = 42.45;
/** Offices north wall faces the stage at Y 24.5; the stage-side tray is 0.33 m off it: 0.3 m clear of the audio raceway (Y 24.48), and it wraps the wall tip. */
const Y_STAGE_FACE = 24.47;
/** Where the M17 branch leaves the stage-side tray: east of the stair head (X 45.7-47), clear of the audio raceway (h 3.0). */
const X_STAGE_RISER = 45.9;
/**
 * The M17 branch crosses the audio raceway (Y 24.48, h 3.0): the riser stands 0.33 m off the face so it
 * keeps 0.3 m from it. It then follows the west face of the 0.2 m wall that carries M17 (the wall is 3.05 m
 * tall, so the branch runs at 2.6 m, just under the AP at 2.88 m).
 */
const Y_AUDIO_CLEAR = 24.47;
const H_M17 = 2.6;
const H_M17_TOP = 2.95;

/**
 * Audio raceways hug the same wall as the stage-side conduit and cross it at right angles: line L climbs at
 * X 42.9 (to 6.6 m) and both lines run along the wall at 3.0 m. The conduit passes in front of each one with an
 * offset bend (two 30 degree bends, EMT bent on site), so it never touches the raceway.
 */
const X_AUDIO_CLIMB = 42.9;
const KICK_M = 0.1;
const KICK_RUN_M = KICK_M / Math.tan(Math.PI / 6);
const KICK_HALF_PLATEAU_M = 0.07;
/** Offset bend along a horizontal run on the offices north wall, centred on `x`. */
const kickOut = (x: number, h: number): PlanPoint[] => [
  p(x - KICK_HALF_PLATEAU_M - KICK_RUN_M, Y_STAGE_FACE, h),
  p(x - KICK_HALF_PLATEAU_M, Y_STAGE_FACE - KICK_M, h),
  p(x + KICK_HALF_PLATEAU_M, Y_STAGE_FACE - KICK_M, h),
  p(x + KICK_HALF_PLATEAU_M + KICK_RUN_M, Y_STAGE_FACE, h),
];
/** Vertical run on the offices north wall from `top` to `bottom`, with an offset bend in front of the 3.0 m audio raceway. */
const dropOver = (x: number, top: number, bottom: number): PlanPoint[] => {
  const audioH = 3.0;
  return [
    p(x, Y_AUDIO_CLEAR, top),
    p(x, Y_AUDIO_CLEAR, audioH + KICK_HALF_PLATEAU_M + KICK_RUN_M),
    p(x, Y_AUDIO_CLEAR - KICK_M, audioH + KICK_HALF_PLATEAU_M),
    p(x, Y_AUDIO_CLEAR - KICK_M, audioH - KICK_HALF_PLATEAU_M),
    p(x, Y_AUDIO_CLEAR, audioH - KICK_HALF_PLATEAU_M - KICK_RUN_M),
    p(x, Y_AUDIO_CLEAR, bottom),
  ];
};

/** An audio run split where it comes down through the protected height: EMT above, rigid conduit (RMC) below. */
function audioPathways(line: 'L' | 'R', points: readonly PlanPoint[]): Pathway[] {
  const limit = FLOOR_CONDUIT.protectedHeightM;
  const i = points.findIndex((q, k) => k > 0 && points[k - 1]!.h > limit && q.h < limit);
  if (i < 0) throw new Error(`audio ${line} never comes down through ${limit} m`);
  const a = points[i - 1]!;
  const b = points[i]!;
  const f = (a.h - limit) / (a.h - b.h);
  const cut = p(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, limit);
  const west = line === 'L';
  return [
    { id: `AUDIO_${line}`, kind: 'emt', service: 'audio', label: west ? 'Audio L: offices wall, over the back wall, west end wall' : 'Audio R: offices wall, east end wall', ...EMT_THREE_QUARTER, points: [...points.slice(0, i), cut] },
    { id: `AUDIO_${line}_LOW`, kind: 'rmc', service: 'audio', label: west ? 'Audio L: west wall below 2 m, foot of the west stand' : 'Audio R: east wall below 2 m, foot of the east stand', ...RMC_THREE_QUARTER, points: [cut, ...points.slice(i)] },
  ];
}

export const PATHWAYS: readonly Pathway[] = [
  // -- From the rack: network room → south wall sleeve → annex trunk.
  { id: 'ANNEX_FEED', kind: 'tray', service: 'data', label: 'Rack to the south wall sleeve (PEN-3)', ...BASKET_WIDE, points: [p(14.44, 30.1, H_ROOM), p(12.9, 30.1, 2.5), p(12.9, 32.6, 2.5)] },
  { id: 'ANNEX_W', kind: 'plastic', service: 'data', label: 'Annex, west branch', ...PLASTIC, points: [p(12.9, Y_ANNEX_FLUSH, H_ANNEX), p(5.0, Y_ANNEX_FLUSH, H_ANNEX)] },
  { id: 'ANNEX_E1', kind: 'tray', service: 'data', label: 'Annex trunk, to the west pier of the aisle opening', ...BASKET, points: [p(12.9, 32.6, H_ANNEX), p(X_PIER_W, 32.6, H_ANNEX)] },
  { id: 'ANNEX_E2', kind: 'tray', service: 'data', label: 'Annex trunk, hung across the aisle opening under the lintel', ...BASKET, points: [p(X_PIER_W, 32.6, H_ANNEX), p(X_PIER_E, 32.6, H_ANNEX)] },
  { id: 'ANNEX_E3', kind: 'plastic', service: 'data', label: 'Annex, east branch', ...PLASTIC, points: [p(X_PIER_E, Y_ANNEX_FLUSH, H_ANNEX), p(37.4, Y_ANNEX_FLUSH, H_ANNEX)] },
  // -- Up the west pier, over the west stand along the back wall, along the west wall and the north wall to the IDF.
  { id: 'RISER_W', kind: 'emt', service: 'data', label: 'Riser at the west pier, through the opening and up the back wall', ...EMT_ONE_QUARTER, points: [p(X_PIER_W, 32.6, H_LINTEL), p(X_PIER_W, Y_BACK, H_LINTEL), p(X_PIER_W, Y_BACK, H_HIGH)] },
  { id: 'BACK_W', kind: 'emt', service: 'data', label: 'Back wall over the west stand', ...EMT_ONE_QUARTER, points: [p(X_PIER_W, Y_BACK, H_HIGH), p(X_WEST, Y_BACK, H_HIGH)] },
  { id: 'WEST', kind: 'emt', service: 'data', label: 'West wall, above the stand and the courts (2 Cat6 + the OM3 backbone)', ...EMT_ONE, points: [p(X_WEST, Y_BACK, H_HIGH), p(X_WEST, Y_NORTH, H_HIGH)] },
  { id: 'NORTH_A', kind: 'emt', service: 'data', label: 'North wall, west part, up to the IDF', ...EMT_ONE_QUARTER, points: [p(X_WEST, Y_NORTH, H_HIGH), p(X_IDF, Y_NORTH, H_HIGH)] },
  // -- Up the east pier, along the back wall over the east stand and down its end wall to M12.
  { id: 'RISER_E', kind: 'emt', service: 'data', label: 'Riser at the east pier, through the opening and up the back wall', ...EMT_ONE_QUARTER, points: [p(X_PIER_E, 32.6, H_LINTEL), p(X_PIER_E, Y_BACK, H_LINTEL), p(X_PIER_E, Y_BACK, H_HIGH)] },
  { id: 'BACK_E', kind: 'emt', service: 'data', label: 'Back wall over the east stand and its end wall', ...EMT_ONE_QUARTER, points: [p(X_PIER_E, Y_BACK, H_HIGH), p(X_ENDWALL, Y_BACK, H_HIGH), p(X_ENDWALL, 28.2, H_HIGH)] },
  // -- North IDF: copper from the IDF to the north wall, west wall, stage and offices.
  { id: 'IDF_UP', kind: 'emt', service: 'data', label: 'IDF cabinet up to the north wall tray', ...EMT_ONE_HALF, points: [p(X_IDF, Y_NORTH, IDF.position.h), p(X_IDF, Y_NORTH, H_HIGH)] },
  { id: 'ID_W', kind: 'emt', service: 'data', label: 'Copper west from the IDF along the north wall tray', ...EMT_ONE_QUARTER, physical: 'NORTH_A', points: [p(X_IDF, Y_NORTH, H_HIGH), p(X_WEST, Y_NORTH, H_HIGH)] },
  { id: 'NORTH_B', kind: 'emt', service: 'data', label: 'North wall, east part up to the M18 wall', ...EMT_ONE, points: [p(X_IDF, Y_NORTH, H_HIGH), p(X_M18_WALL, Y_NORTH, H_HIGH)] },
  { id: 'BR_M18', kind: 'emt', service: 'data', label: 'Branch down the north wall and along the face of the M18 wall', ...EMT_HALF, points: [p(X_M18_WALL, Y_NORTH, H_HIGH), p(X_M18_WALL, Y_NORTH, H_M18), p(48.156, 4.03, H_M18)] },
  { id: 'NORTH_C', kind: 'emt', service: 'data', label: 'North wall, stage corner', ...EMT_HALF, points: [p(X_M18_WALL, Y_NORTH, H_HIGH), p(X_EAST, Y_NORTH, H_HIGH)] },
  // -- Offices and stage south: fed from the rack, down the end wall of the east stand (no tray on the stage east wall).
  { id: 'OFFICES_IN', kind: 'emt', service: 'data', label: 'East stand end wall, down to the offices sleeve', ...EMT_THREE_QUARTER, points: [p(X_ENDWALL, 28.2, H_HIGH), p(X_ENDWALL, 28.2, H_PEN7)] },
  { id: 'PEN7', kind: 'conduit', service: 'data', label: 'Offices west wall sleeve (PEN-7)', ...SLEEVE_4IN, points: [p(X_ENDWALL, 28.2, H_PEN7), p(X_OFFICES_W, 28.2, H_PEN7)] },
  { id: 'OFF_IN', kind: 'plastic', service: 'data', label: 'Inside the offices, down to the wall raceways', ...PLASTIC, points: [p(X_OFFICES_FLUSH, 28.2, H_PEN7), p(X_OFFICES_FLUSH, 28.2, H_OFFICES)] },
  { id: 'OFF_S', kind: 'plastic', service: 'data', label: 'Offices west wall, south end', ...PLASTIC, points: [p(X_OFFICES_FLUSH, 28.2, H_OFFICES), p(X_OFFICES_FLUSH, 30.0, H_OFFICES)] },
  { id: 'OFF_N', kind: 'plastic', service: 'data', label: 'Offices west and north walls', ...PLASTIC, points: [p(X_OFFICES_FLUSH, 28.2, H_OFFICES), p(X_OFFICES_FLUSH, Y_OFFICES_N_FLUSH, H_OFFICES), p(46.5, Y_OFFICES_N_FLUSH, H_OFFICES)] },
  // -- Stage side (CAM05, M17): outside the offices, on the face of the offices north wall, fed from the top of the east stand end wall.
  { id: 'STAGE_A', kind: 'emt', service: 'data', label: 'East stand end wall, around the corner and along the offices north wall', ...EMT_ONE, points: [p(X_ENDWALL, 28.2, H_HIGH), p(X_ENDWALL, Y_STAGE_FACE, H_HIGH), ...kickOut(X_AUDIO_CLIMB, H_HIGH), p(X_STAGE_RISER, Y_STAGE_FACE, H_HIGH)] },
  { id: 'STAGE_B', kind: 'emt', service: 'data', label: 'Offices north wall, stage side, to the stage corner (CAM05, CAM15)', ...EMT_THREE_QUARTER, points: [p(X_STAGE_RISER, Y_STAGE_FACE, H_HIGH), p(X_EAST, Y_STAGE_FACE, H_HIGH)] },
  { id: 'STAGE_R', kind: 'emt', service: 'data', label: 'Down the offices north wall to the M17 branch', ...EMT_HALF, points: dropOver(X_STAGE_RISER, H_HIGH, H_M17) },
  { id: 'STAGE_M', kind: 'emt', service: 'data', label: 'Branch along the face of the wall that carries M17', ...EMT_HALF, points: [p(X_STAGE_RISER, Y_AUDIO_CLEAR, H_M17), p(46.395, Y_AUDIO_CLEAR, H_M17), p(46.395, Y_AUDIO_CLEAR, H_M17_TOP), p(48.066, 20.67, H_M17_TOP)] },
  // -- Exterior cameras at the west corners (CAM17, CAM18): a sleeve through the outer wall at the height of the conduit, then a short drop up the outside face.
  { id: 'PEN8', kind: 'conduit', service: 'data', label: 'West wall sleeve at the north-west corner (PEN-8), to CAM17', ...SLEEVE_2IN, points: [p(X_WEST, 0.8, H_HIGH), p(-0.25, 0.8, H_HIGH)] },
  { id: 'PEN9', kind: 'conduit', service: 'data', label: 'South wall sleeve at the south-west corner (PEN-9), to CAM18', ...SLEEVE_2IN, points: [p(1.0, Y_BACK, H_HIGH), p(1.0, 32.45, H_HIGH)] },
  // -- Audio (see src/data/audio.ts for the exact routes): EMT above 2 m, rigid conduit below it.
  ...AUDIO_RUNS.flatMap((r): Pathway[] => audioPathways(r.line, r.points)),
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
  { id: 'PEN-8', kind: 'wall', description: 'West wall, north-west corner → exterior camera CAM17', position: p(-0.1, 0.8, H_HIGH), sleeves: 1, diameterMm: 50, pathway: 'PEN8', thicknessM: 0.2 },
  { id: 'PEN-9', kind: 'wall', description: 'South wall, south-west corner → exterior camera CAM18', position: p(1.0, 32.3, H_HIGH), sleeves: 1, diameterMm: 50, pathway: 'PEN9', thicknessM: 0.2 },
  { id: 'PEN-7', kind: 'wall', description: 'Offices west wall (east stand end wall side) → offices', position: p(42.58, 28.2, H_PEN7), sleeves: 2, diameterMm: 100, pathway: 'PEN7', thicknessM: 0.2 },
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
  // CAM16 hangs at 2.05 m on the east wall of the network room (locked, nobody walks under it): the cable crosses the room from the top of the rack.
  { id: 'CAM16', kind: 'drop', maxFarM: 2.0, support: 'Locked network room: the cable crosses the room from the rack top to the camera, held by cable ties on a ladder rack to be set on site.' },
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
/** Stage side: stays outside the offices, along the same high tray as the east stand end wall. */
const FROM_RACK_STAGE = [...FROM_RACK_E, 'BACK_E'] as const;
const FROM_RACK_OFFICES = [...FROM_RACK_E, 'BACK_E', 'OFFICES_IN', 'PEN7', 'OFF_IN'] as const;
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
  M06: { hub: 'rack', chain: [...FROM_RACK_W, 'BACK_W', 'WEST'] },
  CAM04: { hub: 'idf', chain: ['IDF_UP', 'NORTH_B', 'NORTH_C'] },
  M18: { hub: 'idf', chain: ['IDF_UP', 'NORTH_B', 'BR_M18'] },
  // Rack: offices and stage south, through the east stand end wall.
  CAM05: { hub: 'rack', chain: [...FROM_RACK_STAGE, 'STAGE_A', 'STAGE_B'] },
  // Stage east end (watches the mixer): shares the CAM05 conduit.
  CAM15: { hub: 'rack', chain: [...FROM_RACK_STAGE, 'STAGE_A', 'STAGE_B'] },
  // Inside the network room: the cable leaves the rack by the room tray.
  CAM16: { hub: 'rack', chain: ['ANNEX_FEED'] },
  // Exterior cameras at the west corners: along the back wall conduit (and the west wall conduit for CAM17), then through a sleeve.
  CAM17: { hub: 'rack', chain: [...FROM_RACK_W, 'BACK_W', 'WEST', 'PEN8'] },
  CAM18: { hub: 'rack', chain: [...FROM_RACK_W, 'BACK_W', 'PEN9'] },
  M17: { hub: 'rack', chain: [...FROM_RACK_STAGE, 'STAGE_A', 'STAGE_R', 'STAGE_M'] },
  M16: { hub: 'rack', chain: [...FROM_RACK_OFFICES, 'OFF_N'] },
  CAM07: { hub: 'rack', chain: [...FROM_RACK_OFFICES, 'OFF_S'] },
};

const routeOf = (id: string) => {
  const r = ROUTE_BY_ID[id];
  if (!r) throw new Error(`no cabling route for ${id}`);
  return r;
};

export const CABLE_DEVICES: readonly CableDevice[] = [
  ...MODEL_ACCESS_POINTS.map((a): CableDevice => ({ id: a.id, kind: 'AP', position: a.position, ...routeOf(a.id) })),
  ...PROJECT_CAMERAS.filter((c) => !c.hidden).map((c): CableDevice => ({ id: c.id, kind: 'camera', position: c.position, ...routeOf(c.id) })),
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

// ---------- junction boxes of the EMT and plastic branches ----------

/** Longest conduit run between pull points (TIA-569, secondary sources: 30 m / 100 ft). */
export const MAX_PULL_M = 30;

export interface Junction {
  readonly pathway: string;
  /** `entry`: where the cables leave the tray or the previous run. `device`: where a drop leaves. `pull`: breaks a long run. */
  readonly kind: 'entry' | 'device' | 'pull';
  readonly at: PlanPoint;
  readonly device?: string;
}

const alongPoint = (points: readonly PlanPoint[], s: number): PlanPoint => {
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const len = dist(a, b);
    if (s <= acc + len || i === points.length - 1) {
      const f = len === 0 ? 0 : Math.min(1, Math.max(0, (s - acc) / len));
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, h: a.h + (b.h - a.h) * f };
    }
    acc += len;
  }
  return points[0]!;
};

/** Most degrees of bends between two boxes (NEC 358.26 / 344.26: four quarter bends). */
export const MAX_BEND_DEG = 360;

/** Turning angle, degrees, at vertex `i` of a polyline. */
function bendAt(points: readonly PlanPoint[], i: number): number {
  const a = points[i - 1]!;
  const b = points[i]!;
  const c = points[i + 1]!;
  const u = [b.x - a.x, b.y - a.y, b.h - a.h] as const;
  const v = [c.x - b.x, c.y - b.y, c.h - b.h] as const;
  const cos = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}

/** Speaker boxes on the floor run of an audio line: one where each speaker's cable leaves the conduit. */
const speakerMarks = (w: Pathway): { s: number; junction: Junction }[] =>
  w.service === 'audio' && w.kind === 'rmc'
    ? SPEAKERS.filter((k) => `AUDIO_${k.line}_LOW` === w.id).map((k) => {
        const at = p(k.position.x, FLOOR_RUN_Y, FLOOR_RUN_H);
        return { s: attachPoint(w, at).along, junction: { pathway: w.id, kind: 'device', at, device: k.id } };
      })
    : [];

/**
 * Entry box, one box per drop (device or speaker), the pull boxes a 30 m run needs and one wherever the bends
 * would pass 360 degrees without a box, for every conduit (EMT, RMC) and plastic pathway.
 */
export const JUNCTIONS: readonly Junction[] = PATHWAYS.filter((w) => (w.kind === 'emt' || w.kind === 'rmc' || w.kind === 'plastic') && !w.physical).flatMap((w) => {
  const total = pathLength(w.points);
  const marks: { s: number; junction: Junction }[] = [{ s: 0, junction: { pathway: w.id, kind: 'entry', at: w.points[0]! } }, ...speakerMarks(w)];
  const twins = PATHWAYS.filter((x) => x.physical === w.id).map((x) => x.id);
  for (const r of DEVICE_ROUTES.filter((x) => [w.id, ...twins].includes(x.chain[x.chain.length - 1]!))) {
    marks.push({ s: attachPoint(w, r.device.position).along, junction: { pathway: w.id, kind: 'device', at: r.attach, device: r.device.id } });
  }
  marks.sort((a, b) => a.s - b.s);
  const placed: { s: number; junction: Junction }[] = [];
  let last = 0;
  for (const m of [...marks, { s: total, junction: null as unknown as Junction }]) {
    while (m.s - last > MAX_PULL_M) {
      last += MAX_PULL_M;
      placed.push({ s: last, junction: { pathway: w.id, kind: 'pull', at: alongPoint(w.points, last) } });
    }
    if (m.junction) {
      placed.push(m);
      last = m.s;
    }
  }
  // Bends: walk the run; a box resets the count, and a vertex that would take it past the limit gets a pull box.
  const events: { s: number; box: boolean; angle: number; i: number }[] = placed.map((m) => ({ s: m.s, box: true, angle: 0, i: -1 }));
  let acc = 0;
  for (let i = 1; i < w.points.length - 1; i++) {
    acc += pathLength(w.points.slice(i - 1, i + 1));
    events.push({ s: acc, box: false, angle: bendAt(w.points, i), i });
  }
  events.sort((a, b) => a.s - b.s || Number(b.box) - Number(a.box));
  let bends = 0;
  for (const e of events) {
    if (e.box) bends = 0;
    else {
      bends += e.angle;
      if (bends > MAX_BEND_DEG) {
        placed.push({ s: e.s, junction: { pathway: w.id, kind: 'pull', at: w.points[e.i]! } });
        bends = 0;
      }
    }
  }
  return placed.sort((a, b) => a.s - b.s).map((m) => m.junction);
});

export const junctionsOf = (id: string): readonly Junction[] => JUNCTIONS.filter((j) => j.pathway === id);

/** Fiber backbone: it rides the same pathways as the copper, so it takes room in them. */
export const carriesFiber = (id: string): boolean => BACKBONE_FIBER_CHAIN.includes(id);
