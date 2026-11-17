export interface Alignment {
  readonly x0: number;
  readonly y0: number;
}

/** Floor-plan point: X east, Y south, h up (meters). */
export interface PlanPoint {
  readonly x: number;
  readonly y: number;
  readonly h: number;
}

export type Vec3Tuple = [number, number, number];

/** SketchUp STL (Z up, +Y north) → floor plan. */
export function stlToPlan(x: number, y: number, z: number, a: Alignment): PlanPoint {
  return { x: x - a.x0, y: a.y0 - y, h: z };
}

/** Floor plan → three.js world (Y up). Plan Y (south) maps to +Z. */
export function planToThree(p: PlanPoint): Vec3Tuple {
  return [p.x, p.h, p.y];
}

/** three.js world → floor plan. */
export function threeToPlan(x: number, y: number, z: number): PlanPoint {
  return { x, y: z, h: y };
}

/**
 * STL → three.js world in one step. It is a proper rotation (det +1) plus a
 * translation, so triangle winding is preserved.
 */
export function stlToThree(x: number, y: number, z: number, a: Alignment): Vec3Tuple {
  return [x - a.x0, z, a.y0 - y];
}
