import { LAYOUT } from '../config/alignment.ts';

/** Offices block (plan meters), measured from the model walls. */
const OFFICES = { minX: 42.4, maxX: 50.8, minY: 24.4, maxY: 31.1 } as const;
/** Inner face of the south wall behind the stands. */
const SOUTH_WALL_Y = 32.2;
/** Inner face of the east wall. */
const EAST_WALL_X = LAYOUT.buildingWidth - 0.4;
const WALL_BAND = 1;

/** Human-readable zone for a plan position (X east, Y south). */
export function zoneOf(x: number, y: number): string {
  if (x >= OFFICES.minX && x <= OFFICES.maxX && y >= OFFICES.minY && y <= OFFICES.maxY) return 'Offices';
  if (y > SOUTH_WALL_Y + 0.25) return 'South annex';
  if (y >= SOUTH_WALL_Y - WALL_BAND) return 'Stands - south wall';
  if (y > LAYOUT.courtDepth && x >= OFFICES.minX - WALL_BAND && x < OFFICES.minX) return 'Stands - east wall';
  if (x >= EAST_WALL_X - WALL_BAND) return 'Stage - east wall';
  if (x >= LAYOUT.courtWidth - 0.2) return 'Stage';
  if (y <= WALL_BAND) return 'Courts - north wall';
  if (x <= WALL_BAND) return y > LAYOUT.courtDepth ? 'Stands - west wall' : 'Courts - west wall';
  return y > LAYOUT.courtDepth ? 'Stands' : 'Courts';
}
