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
  /** Point the cabinet face is aimed at (the middle of its stand, at seated head height). */
  readonly aim: PlanPoint;
  /** The wall that holds it: the end wall of its stand, at this X. */
  readonly wallX: number;
}

export const SPEAKER_MODEL = 'JBL EON715';
export const MIXER_MODEL = 'Yamaha MG12XU';

/** Axis of symmetry of the two stands (center of the central aisle). */
export const STANDS_MIRROR_X = 21.5;
/** Face of the first riser of both stands (the court boundary). */
export const STAND_FRONT_Y = 24.7;
/** JBL EON715: 15" active two-way, 0.43 (w) × 0.70 (h) × 0.37 (d) m. */
export const SPEAKER_DIM = { w: 0.43, h: 0.7, d: 0.37 } as const;
/** EON715 coverage: 90° horizontal × 60° vertical, so ±45° and ±30° around the axis. */
export const EON715_COVERAGE = { horizontalHalfDeg: 45, verticalHalfDeg: 30 } as const;

/** End walls of the stands (inner faces): the west wall of the west stand and the east end wall of the east stand. */
export const WEST_WALL_X = 0;
export const EAST_WALL_X = 42.48;
/** Cabinet center: 0.45 m off the end wall on a bracket, 3.0 m up (above heads), at the front of the stand and 3 m clear of the AP M12 on the same wall. */
const SPEAKER_OFF_M = 0.45;
export const SPEAKER_Y = 25.3;
export const SPEAKER_H = 3.0;
/** Aim: the middle of the stand, 29.0 m south, at the head height of a seated spectator (floor 3.03 + 1.15). */
const AIM_Y = 29.0;
const AIM_H = 4.2;
const WEST_AIM_X = 9.0;

/** Yaw (plan angle from +X, degrees, toward +Y) and pitch (up, degrees) of the direction from `from` to `to`. */
export function bearing(from: PlanPoint, to: PlanPoint): { readonly yawDeg: number; readonly pitchDeg: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return { yawDeg: (Math.atan2(dy, dx) * 180) / Math.PI, pitchDeg: (Math.atan2(to.h - from.h, Math.hypot(dx, dy)) * 180) / Math.PI };
}

/** Horizontal and vertical angle (absolute, degrees) between the speaker axis and the direction to a seated ear point. */
export function offAxisDeg(spk: Speaker, ear: PlanPoint): { readonly horizontal: number; readonly vertical: number } {
  const axis = bearing(spk.position, spk.aim);
  const toEar = bearing(spk.position, ear);
  const wrap = (d: number) => Math.abs(((d + 540) % 360) - 180);
  return { horizontal: wrap(toEar.yawDeg - axis.yawDeg), vertical: Math.abs(toEar.pitchDeg - axis.pitchDeg) };
}

/**
 * Seated ear points (floor + 1.15 m) used to check the coverage: the far end and the middle of each stand, front and
 * back row. The seats right under the speaker, along the same wall, are out of its pattern (see the speaker card).
 */
export function coverageEars(stand: StandId): readonly PlanPoint[] {
  const far = stand === 'west' ? 17.7 : 25.3;
  const mid = stand === 'west' ? 9.0 : 34.0;
  return [
    { x: far, y: 25.4, h: 1.97 },
    { x: far, y: 31.4, h: 4.92 },
    { x: mid, y: 25.4, h: 1.97 },
    { x: mid, y: 31.4, h: 4.92 },
  ];
}

const west: Speaker = {
  id: 'SPK-W1',
  stand: 'west',
  line: 'L',
  model: SPEAKER_MODEL,
  position: { x: WEST_WALL_X + SPEAKER_OFF_M, y: SPEAKER_Y, h: SPEAKER_H },
  aim: { x: WEST_AIM_X, y: AIM_Y, h: AIM_H },
  wallX: WEST_WALL_X,
};
/** One per stand, on its end wall, aimed along the stand; the east one mirrors the west one about X = 21.5. */
export const SPEAKERS: readonly Speaker[] = [
  west,
  {
    id: 'SPK-E1',
    stand: 'east',
    line: 'R',
    model: SPEAKER_MODEL,
    position: { x: EAST_WALL_X - SPEAKER_OFF_M, y: SPEAKER_Y, h: SPEAKER_H },
    aim: { x: 2 * STANDS_MIRROR_X - WEST_AIM_X, y: AIM_Y, h: AIM_H },
    wallX: EAST_WALL_X,
  },
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
 * Audio cable runs, plan coordinates. Each line runs in its own steel conduit that lies on the wall, held by
 * straps (the same rules as the data conduit). Both leave the panel along the offices wall at h 3.0 m (above the
 * lintel of the opening and the post at X 46.5, which reaches h 2.9 m) to the front corner of the east stand.
 * Nothing runs on the floor or crosses the central aisle mouth, so nothing can be stepped on. Each line ends at
 * the speaker on the end wall of its stand, at h 3.0 m:
 * - R (east stand): follows the east end wall from the corner to the speaker.
 * - L (west stand): climbs the offices wall to h 6.6 m, follows the east end wall and the back wall above the
 *   aisle gap to the west end, runs along the west end wall and comes down to the speaker.
 * Separate from the data conduit (≥ 0.3 m, except for the right-angle crossings) and from power.
 */
export const AUDIO_TRAY_H = 6.6;
const WALL_RUN_H = 3.0;
/** Conduit axis to the wall face: ¾" EMT (23.4 mm) with its strap. */
export const AUDIO_WALL_OFF_M = 0.025;
/** Faces the audio conduit lies on: offices north wall (Y 24.5), east end wall (X 42.48), back wall (Y 32.2), west wall (X 0). */
const NORTH_FACE_Y = 24.5;
const END_WALL_X = 42.48;
const BACK_WALL_Y = 32.2;
const Y_WALL = NORTH_FACE_Y - AUDIO_WALL_OFF_M;
/** Line L lies 3.5 cm further out than R where both run side by side, so L can climb across R without touching it. */
const L_OUT_M = 0.035;
const BACK_TRAY_Y = BACK_WALL_Y - AUDIO_WALL_OFF_M;
const WEST_END_X = AUDIO_WALL_OFF_M;
const EAST_END_X = END_WALL_X - AUDIO_WALL_OFF_M;
/** Where each line comes down to the court, on the open side of the walls (south of the offices wall tip, Y 24.5). */
const DESCENT_Y = 24.6;
/** The panel's two outputs: L on the left, R in the middle (see the panel label). */
const PANEL_L_X = FOH.panel.x - 0.1;
const PANEL_R_X = FOH.panel.x;
/**
 * Line L climbs on the offices north face, east of the wall tip, so the stage-side data conduit that wraps the
 * tip does not have to cross it twice.
 */
const L_CLIMB_X = 42.9;
/** Data conduit lies on the west wall at h 5.7: L comes down in front of it with an offset bend (two 30 degree bends). */
const DATA_WEST_H = 5.7;
const KICK_M = 0.1;
const KICK_RUN_M = KICK_M / Math.tan(Math.PI / 6);
const KICK_HALF_PLATEAU_M = 0.07;
/** Vertical run down the west wall from `top` to `bottom` with an offset bend in front of the data conduit. */
const westDrop = (y: number, top: number, bottom: number): PlanPoint[] => [
  { x: WEST_END_X, y, h: top },
  { x: WEST_END_X, y, h: DATA_WEST_H + KICK_HALF_PLATEAU_M + KICK_RUN_M },
  { x: WEST_END_X + KICK_M, y, h: DATA_WEST_H + KICK_HALF_PLATEAU_M },
  { x: WEST_END_X + KICK_M, y, h: DATA_WEST_H - KICK_HALF_PLATEAU_M },
  { x: WEST_END_X, y, h: DATA_WEST_H - KICK_HALF_PLATEAU_M - KICK_RUN_M },
  { x: WEST_END_X, y, h: bottom },
];
/** The conduit ends 0.4 m north of the speaker, where its box sits; a short flexible tail goes on to the cabinet. */
const CONDUIT_END_Y = SPEAKER_Y - 0.4;
const eastEnd = (): PlanPoint[] => [
  { x: PANEL_R_X, y: Y_WALL, h: FOH.panel.h },
  { x: PANEL_R_X, y: Y_WALL, h: WALL_RUN_H },
  { x: EAST_END_X, y: Y_WALL, h: WALL_RUN_H },
  { x: EAST_END_X, y: DESCENT_Y, h: WALL_RUN_H },
  { x: EAST_END_X, y: CONDUIT_END_Y, h: WALL_RUN_H },
];
const overTheTop = (): PlanPoint[] => [
  { x: PANEL_L_X, y: Y_WALL - L_OUT_M, h: FOH.panel.h },
  { x: PANEL_L_X, y: Y_WALL - L_OUT_M, h: WALL_RUN_H },
  { x: L_CLIMB_X, y: Y_WALL - L_OUT_M, h: WALL_RUN_H },
  { x: L_CLIMB_X, y: Y_WALL - L_OUT_M, h: AUDIO_TRAY_H },
  { x: EAST_END_X, y: Y_WALL - L_OUT_M, h: AUDIO_TRAY_H },
  { x: EAST_END_X, y: BACK_TRAY_Y, h: AUDIO_TRAY_H },
  { x: WEST_END_X, y: BACK_TRAY_Y, h: AUDIO_TRAY_H },
  ...westDrop(DESCENT_Y, AUDIO_TRAY_H, WALL_RUN_H),
  { x: WEST_END_X, y: CONDUIT_END_Y, h: WALL_RUN_H },
];
export const AUDIO_RUNS: readonly { readonly line: AudioLine; readonly points: readonly PlanPoint[] }[] = [
  { line: 'R', points: eastEnd() },
  { line: 'L', points: overTheTop() },
];
