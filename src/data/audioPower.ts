import type { PlanPoint } from '../domain/coords.ts';
import { EAST_WALL_X, SPEAKERS, WEST_WALL_X } from './audio.ts';

/**
 * Mains power for the two active speakers (EON715: amplifier inside, 120 V). Each speaker has its own EMT, apart from
 * the audio conduit, but side by side with it: it follows the audio route 0.07 m above it, each in its own metal
 * conduit, strapped to the wall. Power and communications may share a route in separate raceways (NEC art. 800; the
 * 0.3 m of the earlier version was a project criterion, not a code limit). It ends in a box with a protected outlet
 * beside the speaker.
 *
 * The source is the audio board TA-1, at the east end of the stage wall: that circuit is outside the 3D model.
 * Assumption to confirm in the site survey: no other mains point is within reach of the stands.
 */
export interface PowerRun {
  readonly id: 'PWR_R' | 'PWR_L';
  readonly speaker: string;
  readonly label: string;
  /** EMT ½" inner diameter 15.8 mm (3 conductors, 12 AWG). */
  readonly trade: string;
  readonly points: readonly PlanPoint[];
}

/** Audio board TA-1 (source): wall box on the offices north wall, east of the operator panel. */
export const AUDIO_BOARD = { id: 'TA-1', position: { x: 48.5, y: 24.425, h: 3.6 }, size: { w: 0.34, h: 0.5, d: 0.15 } } as const;

/** Distance from each power conduit to the audio conduit it rides with, axis to axis: room for both straps. */
export const BUNDLE_GAP_M = 0.07;
/** Audio route values (see audio.ts), repeated here: the power conduit follows them. */
const WALL_OFF = 0.025;
const Y_R = 24.5 - WALL_OFF;
/** Audio L lies 3.5 cm further out than R so it can climb across it. */
const Y_L = Y_R - 0.035;
const X_EAST = EAST_WALL_X - WALL_OFF;
const Y_BACK = 32.2 - WALL_OFF;
const X_WEST = WEST_WALL_X + WALL_OFF;
const H_RUN = 3.0;
const H_TOP = 6.6;
const X_CLIMB = 42.9;
/** Audio L comes down the west wall at this Y; power comes down 0.07 m south of it. */
const Y_DESCENT = 24.6;
/** Offset bend around the data conduit at 5.7 m on the west wall (same bend as the audio). */
const H_DATA = 5.7;
const KICK_M = 0.1;
const KICK_RUN_M = KICK_M / Math.tan(Math.PI / 6);
const KICK_HALF_PLATEAU_M = 0.07;
/** The outlet boxes sit 0.18 m north of the audio end boxes, so the two never touch. */
const END_Y = 24.72;

const p = (x: number, y: number, h: number): PlanPoint => ({ x, y, h });
const H_P = H_RUN + BUNDLE_GAP_M;
const H_P_TOP = H_TOP + BUNDLE_GAP_M;
const yPowerDescent = Y_DESCENT + BUNDLE_GAP_M;
const BOARD_WEST_X = AUDIO_BOARD.position.x - AUDIO_BOARD.size.w / 2;

export const POWER_RUNS: readonly PowerRun[] = [
  {
    id: 'PWR_R',
    speaker: 'SPK-E1',
    label: 'Power to SPK-E1: board TA-1, along the offices wall over the audio R and down the east end wall',
    trade: '½"',
    points: [p(BOARD_WEST_X, Y_R, H_P), p(X_EAST, Y_R, H_P), p(X_EAST, END_Y, H_P)],
  },
  {
    id: 'PWR_L',
    speaker: 'SPK-W1',
    label: 'Power to SPK-W1: board TA-1, over the audio L along the offices wall, east end wall, back wall and down the west wall',
    trade: '½"',
    points: [
      p(BOARD_WEST_X, Y_L, H_P),
      p(X_CLIMB + BUNDLE_GAP_M, Y_L, H_P),
      p(X_CLIMB + BUNDLE_GAP_M, Y_L, H_P_TOP),
      p(X_EAST, Y_L, H_P_TOP),
      p(X_EAST, Y_BACK, H_P_TOP),
      p(X_WEST, Y_BACK, H_P_TOP),
      p(X_WEST, yPowerDescent, H_P_TOP),
      p(X_WEST, yPowerDescent, H_DATA + KICK_HALF_PLATEAU_M + KICK_RUN_M),
      p(X_WEST + KICK_M, yPowerDescent, H_DATA + KICK_HALF_PLATEAU_M),
      p(X_WEST + KICK_M, yPowerDescent, H_DATA - KICK_HALF_PLATEAU_M),
      p(X_WEST, yPowerDescent, H_DATA - KICK_HALF_PLATEAU_M - KICK_RUN_M),
      p(X_WEST, yPowerDescent, H_P),
      p(X_WEST, END_Y, H_P),
    ],
  },
];

/** Outlet box at the end of each run, one per speaker: protected duplex (GFCI). */
export const SPEAKER_OUTLETS = SPEAKERS.map((s) => ({
  id: `OUT-${s.id}`,
  speaker: s.id,
  position: POWER_RUNS.find((r) => r.speaker === s.id)!.points.at(-1)!,
}));
