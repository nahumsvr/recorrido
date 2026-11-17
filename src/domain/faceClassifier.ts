import type { Vec3Tuple } from './coords.ts';

export type FaceClass =
  | 'courtFloor'
  | 'floor'
  | 'stage'
  | 'stands'
  | 'platform'
  | 'wallNS'
  | 'wallEW'
  | 'ceiling'
  | 'roof';

export interface ClassifierLayout {
  readonly courtWidth: number;
  readonly courtDepth: number;
  readonly stageFloorH: number;
  readonly roofStartH: number;
}

const WALL_MAX_ABS_NY = 0.3;
const GROUND_MAX_H = 0.05;

/**
 * Classifies a face by its unit normal and centroid, both in three.js world
 * coordinates (x = plan X, y = h, z = plan Y). Normals may point either way
 * because SketchUp winding is inconsistent, so walls use |n| and floors vs
 * ceilings use the sign of n.y only after excluding walls.
 */
export function classifyFace(normal: Vec3Tuple, centroid: Vec3Tuple, layout: ClassifierLayout): FaceClass {
  const [nx, ny, nz] = normal;
  const [x, h, y] = centroid;

  if (h > layout.roofStartH) return 'roof';

  if (Math.abs(ny) < WALL_MAX_ABS_NY) {
    // A wall facing ±X runs north-south.
    return Math.abs(nx) >= Math.abs(nz) ? 'wallNS' : 'wallEW';
  }

  if (ny < 0) return 'ceiling';

  const insideCourts = x >= 0 && x <= layout.courtWidth && y >= 0 && y <= layout.courtDepth;
  if (h < GROUND_MAX_H) return insideCourts ? 'courtFloor' : 'floor';

  if (x > layout.courtWidth - 0.5 && Math.abs(h - layout.stageFloorH) < 0.3) return 'stage';
  if (y > layout.courtDepth - 0.5 && x < layout.courtWidth) return 'stands';
  return 'platform';
}
