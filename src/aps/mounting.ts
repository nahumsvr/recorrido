import { DoubleSide, Ray, Vector3 } from 'three';
import type { MeshBVH } from 'three-mesh-bvh';

export interface WallMount {
  /** Closest point on the wall surface. */
  readonly point: Vector3;
  /** Horizontal unit normal pointing from the wall toward the AP side. */
  readonly normal: Vector3;
  readonly distance: number;
}

const RAY_COUNT = 32;
const MAX_WALL_ABS_NY = 0.3;

/**
 * Finds the nearest wall around `position` with horizontal rays. Used to stick
 * AP markers to the wall they are mounted on and to flag table coordinates that
 * are not near any wall.
 */
export function findMountingWall(bvh: MeshBVH, position: Vector3, maxDistance: number): WallMount | null {
  const ray = new Ray(position.clone(), new Vector3());
  let best: WallMount | null = null;
  for (let i = 0; i < RAY_COUNT; i++) {
    const a = (i / RAY_COUNT) * Math.PI * 2;
    ray.direction.set(Math.cos(a), 0, Math.sin(a));
    const hit = bvh.raycastFirst(ray, DoubleSide, 0, maxDistance);
    if (!hit?.face || Math.abs(hit.face.normal.y) > MAX_WALL_ABS_NY) continue;
    if (best && hit.distance >= best.distance) continue;
    const normal = new Vector3(hit.face.normal.x, 0, hit.face.normal.z).normalize();
    // Face normals from SketchUp can point either way: face the AP.
    if (normal.dot(ray.direction) > 0) normal.negate();
    best = { point: hit.point.clone(), normal, distance: hit.distance };
  }
  return best;
}
