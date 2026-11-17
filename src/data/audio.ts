import type { PlanPoint } from '../domain/coords.ts';

/** Stand (grada) a speaker covers; the two stands mirror each other about X = STANDS_MIRROR_X. */
export type StandId = 'west' | 'east';
/** Balanced output of the mixer feeding the speaker: L feeds the west stand, R the east stand. */
export type AudioLine = 'L' | 'R';

export interface Speaker {
  readonly id: string;
  readonly stand: StandId;
  readonly line: AudioLine;
  readonly model: string;
  /** Center of the cabinet in plan coordinates (X east, Y south, h up, meters). */
  readonly position: PlanPoint;
  /** Upward tilt of the cabinet axis, degrees; the cabinet faces south, toward the seats. */
  readonly tiltUpDeg: number;
}

export const SPEAKER_MODEL = 'JBL EON715';
export const MIXER_MODEL = 'Yamaha MG12XU';

/** Axis of symmetry of the two stands (center of the central aisle). */
export const STANDS_MIRROR_X = 21.5;
/** Face of the first riser of both stands (the court boundary). */
export const STAND_FRONT_Y = 24.7;
/**
 * Cabinet center: 0.45 m in front of the riser (the tilted cabinet leans toward
 * it) and 0.5 m above the court floor, so the cabinet spans h 0.1-0.9.
 */
export const SPEAKER_Y = STAND_FRONT_Y - 0.45;
export const SPEAKER_H = 0.5;
/**
 * Seated ear points (floor + 1.15 m) of the first and last row. From the
 * cabinet they are 57° and 33° up, so a 42° tilt keeps both inside ±30° of the
 * axis (EON715 vertical coverage: 60°).
 */
export const FRONT_ROW_EAR = { y: 25.4, h: 1.97 } as const;
export const BACK_ROW_EAR = { y: 31.4, h: 4.92 } as const;
const TILT_UP_DEG = 42;

const spk = (id: string, stand: StandId, x: number): Speaker => ({
  id,
  stand,
  line: stand === 'west' ? 'L' : 'R',
  model: SPEAKER_MODEL,
  position: { x, y: SPEAKER_Y, h: SPEAKER_H },
  tiltUpDeg: TILT_UP_DEG,
});

/** Two per stand, on the front face of the stand, at ¼ and ¾ of its width; east positions mirror the west ones about X = 21.5. */
export const SPEAKERS: readonly Speaker[] = [
  spk('SPK-W1', 'west', 4.5),
  spk('SPK-W2', 'west', 13.0),
  spk('SPK-E1', 'east', 30.0),
  spk('SPK-E2', 'east', 38.5),
];

/**
 * Stage floor height; the operator table stands on the stage. Its south-west edge is
 * diagonal (stair foot): the floor reaches X 46.95 at Y 23.9, so the table starts at X 47.0.
 */
const STAGE_FLOOR_H = 1.18;

/**
 * Operator position on the stage, at its south edge: a small table against the
 * north face of the offices block (Y 24.5) with the wall panel above it. The
 * mixer is portable: it only plugs into the panel and can be taken away.
 */
export const FOH = {
  floorH: STAGE_FLOOR_H,
  table: { center: { x: 47.6, y: 24.2 }, length: 1.2, depth: 0.6, topHeight: 0.75 },
  /** Wall panel with two XLR outputs (L / R) and a protected outlet; `h` is absolute (1.05 m above the stage floor). */
  panel: { x: 47.6, y: 24.5, h: STAGE_FLOOR_H + 1.05, width: 0.34, height: 0.16 },
} as const;

/**
 * Audio cable runs, plan coordinates. Both leave the panel along the offices
 * wall at h 3.0 m (above the lintel of the opening and the post at X 46.5, which reaches h 2.9 m) to the front
 * corner of the east stand. Nothing crosses the central aisle mouth on the
 * floor, so it cannot be stepped on:
 * - R (east stand): comes down at the corner and follows the foot of the stand
 *   in a floor raceway to its two speakers (≈ 12 m).
 * - L (west stand): climbs the corner to h 6.6 m, follows the east end wall and
 *   the back wall above the aisle gap to the west end, runs along the west end
 *   wall, comes down at its front corner and follows the foot of the stand to
 *   its two speakers.
 * Separate from the data trays (≥ 0.3 m) and from power.
 */
export const AUDIO_TRAY_H = 6.6;
const WALL_RUN_H = 3.0;
export const FLOOR_RUN_H = 0.08;
export const FLOOR_RUN_Y = STAND_FRONT_Y - 0.15;
const BACK_TRAY_Y = 32.12;
/** 0.32 m off the west wall: clear of the data tray (X 0.15-0.25) the riser crosses at right angles. */
const WEST_END_X = 0.32;
const EAST_END_X = 42.4;
const RISER = { x: 42.3, y: 24.48 } as const;
const toCorner = (): PlanPoint[] => [
  { x: FOH.panel.x, y: FOH.panel.y - 0.02, h: FOH.panel.h },
  { x: FOH.panel.x, y: FOH.panel.y - 0.02, h: WALL_RUN_H },
  { x: RISER.x, y: RISER.y, h: WALL_RUN_H },
];
const eastFoot = (x: number): PlanPoint[] => [
  ...toCorner(),
  { x: RISER.x, y: RISER.y, h: FLOOR_RUN_H },
  { x: RISER.x, y: FLOOR_RUN_Y, h: FLOOR_RUN_H },
  { x, y: FLOOR_RUN_Y, h: FLOOR_RUN_H },
];
const overTheTop = (x: number): PlanPoint[] => [
  ...toCorner(),
  { x: RISER.x, y: RISER.y, h: AUDIO_TRAY_H },
  { x: EAST_END_X, y: BACK_TRAY_Y, h: AUDIO_TRAY_H },
  { x: WEST_END_X, y: BACK_TRAY_Y, h: AUDIO_TRAY_H },
  { x: WEST_END_X, y: RISER.y, h: AUDIO_TRAY_H },
  { x: WEST_END_X, y: RISER.y, h: FLOOR_RUN_H },
  { x: WEST_END_X, y: FLOOR_RUN_Y, h: FLOOR_RUN_H },
  { x, y: FLOOR_RUN_Y, h: FLOOR_RUN_H },
];
export const AUDIO_RUNS: readonly { readonly line: AudioLine; readonly points: readonly PlanPoint[] }[] = [
  { line: 'R', points: eastFoot(30.0) },
  { line: 'L', points: overTheTop(13.0) },
];
