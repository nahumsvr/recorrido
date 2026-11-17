/** Axis-aligned footprint (three.js world X/Z) of a solid object up to `maxY`. */
export interface Obstacle {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
  readonly maxY: number;
}

export interface Push {
  x: number;
  z: number;
}

/**
 * Pushes a vertical cylinder (center `x`,`z`, `radius`, feet at `feetY`) out of
 * the obstacle footprint. Writes the displacement into `out`; returns true when
 * the cylinder was overlapping. Objects the feet already stand above are ignored.
 */
export function pushOutOfObstacle(
  o: Obstacle,
  x: number,
  z: number,
  radius: number,
  feetY: number,
  out: Push,
): boolean {
  out.x = 0;
  out.z = 0;
  if (feetY >= o.maxY) return false;
  const nx = Math.min(Math.max(x, o.minX), o.maxX);
  const nz = Math.min(Math.max(z, o.minZ), o.maxZ);
  const dx = x - nx;
  const dz = z - nz;
  const d = Math.hypot(dx, dz);
  if (d >= radius) return false;
  if (d > 1e-6) {
    out.x = (dx / d) * (radius - d);
    out.z = (dz / d) * (radius - d);
    return true;
  }
  // Center inside the box: leave through the nearest face.
  const toMinX = x - o.minX;
  const toMaxX = o.maxX - x;
  const toMinZ = z - o.minZ;
  const toMaxZ = o.maxZ - z;
  const m = Math.min(toMinX, toMaxX, toMinZ, toMaxZ);
  if (m === toMinX) out.x = -(toMinX + radius);
  else if (m === toMaxX) out.x = toMaxX + radius;
  else if (m === toMinZ) out.z = -(toMinZ + radius);
  else out.z = toMaxZ + radius;
  return true;
}
