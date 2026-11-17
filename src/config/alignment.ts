/**
 * Alignment between the SketchUp STL (meters, Z up, +Y north) and the floor-plan
 * coordinate system (X east, Y south, h up, origin at the interior north-west
 * corner of the courts).
 *
 * Derived from the STL wall planes (see odd/tasks/recorrido-3d.md, Log):
 * - west wall inner face at x_stl = -28.34
 * - north wall inner face at y_stl = 11.36
 * Changing these values requires `npm run prepare-model` because the model is
 * baked in plan coordinates.
 */
export const ALIGNMENT = {
  x0: -28.34,
  y0: 11.36,
} as const;

/** Reference dimensions from the floor plan, in meters. */
export const LAYOUT = {
  buildingWidth: 55,
  buildingDepth: 32.6,
  courtWidth: 45.8,
  courtDepth: 24.7,
  stageFloorH: 1.2,
  roofStartH: 6.85,
} as const;

/**
 * Bounding box (STL coordinates) of the highly detailed stage props that make up
 * ~95% of the triangles. Connected components fully inside it are split out,
 * simplified and excluded from collisions.
 */
export const STAGE_PROPS_BOX_STL = {
  min: [19.0, 7.5, 1.1],
  max: [25.3, 10.7, 2.7],
} as const;
