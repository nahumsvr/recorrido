/**
 * Devices in the SketchUp model that are NOT access points, matched by plan
 * position (meters) so the exclusion survives re-exports and renumbering.
 * `formerId` is the id they had when excluded; the remaining APs keep their ids.
 */
export const EXCLUDED_MODEL_APS = [
  { formerId: 'M05', x: 0, y: 8.41, h: 3.31 },
  { formerId: 'M08', x: 9.0, y: 32.28, h: 5.42 },
  { formerId: 'M11', x: 33.48, y: 32.28, h: 5.27 },
  { formerId: 'M19', x: 54.59, y: 12.25, h: 3.33 },
] as const;

/** A detected device within this distance of an excluded position is dropped. */
export const EXCLUSION_TOLERANCE_M = 0.3;
