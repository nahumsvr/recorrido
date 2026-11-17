import type { PlanPoint } from '../domain/coords.ts';

export interface Teleport {
  readonly id: string;
  readonly label: string;
  /**
   * Feet position in plan coordinates; `h` is an upper bound, the player drops
   * onto the first floor at most one step above it. null = coordinates pending.
   */
  readonly position: PlanPoint | null;
  /** View direction (three.js yaw): 0 north, π/2 west, -π/2 east, π south. */
  readonly yaw: number;
  readonly note?: string;
}

const NORTH = 0;
const WEST = Math.PI / 2;
const EAST = -Math.PI / 2;

export const TELEPORTS: readonly Teleport[] = [
  { id: 'entranceD05', label: 'Entrance D05', position: null, yaw: NORTH, note: 'Coordinates pending' },
  { id: 'courts', label: 'Court center', position: { x: 22.9, y: 12.35, h: 0 }, yaw: EAST },
  { id: 'stands', label: 'Stands', position: { x: 10, y: 30.5, h: 4 }, yaw: NORTH },
  { id: 'stage', label: 'Stage', position: { x: 50.4, y: 12, h: 1.2 }, yaw: WEST },
  {
    id: 'gym',
    label: 'Gym',
    position: { x: 51, y: 2.6, h: 1.2 },
    yaw: WEST,
    note: 'Gym level is not modeled; lands on the stage under AP13',
  },
  { id: 'offices', label: 'Offices', position: { x: 46.6, y: 27.8, h: 0 }, yaw: NORTH },
  { id: 'networkRoom', label: 'Network room', position: null, yaw: NORTH, note: 'Coordinates pending' },
];
