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
/** Two faces closer than this around a point mean the point sits inside a wall slab. */
const MAX_SLAB_THICKNESS = 0.35;
const SIDE_PROBE_OFFSET = 0.3;

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

/**
 * Ceiling (slab underside) holding a device whose center is within `reach`
 * of a horizontal face above or embedded in it. Returns the underside point.
 */
export function findCeilingMount(bvh: MeshBVH, center: Vector3, reach = 0.3): Vector3 | null {
  const from = center.clone().setY(center.y - reach);
  const hit = bvh.raycastFirst(new Ray(from, new Vector3(0, 1, 0)), DoubleSide, 0, reach * 2);
  if (!hit?.face || Math.abs(hit.face.normal.y) < 1 - MAX_WALL_ABS_NY) return null;
  return hit.point.clone();
}

/**
 * Wall mount of a device modeled by hand, whose center may be slightly inside
 * the wall slab. Returns the wall face on the room side with its normal
 * pointing into the room, or null when no wall is within `maxDistance`.
 *
 * Inside a slab both faces are candidates; the room side is the one with
 * something overhead (roof or slab: interior, not the open exterior) and,
 * among those, more free space in front.
 */
export function findDeviceMount(bvh: MeshBVH, center: Vector3, maxDistance = 1): WallMount | null {
  const near = findMountingWall(bvh, center, maxDistance);
  if (!near) return null;

  // Opposite face of the same slab, if the center is between two faces.
  const back = bvh.raycastFirst(new Ray(center.clone(), near.normal.clone()), DoubleSide, 0, MAX_SLAB_THICKNESS);
  const insideSlab = !!back && near.distance + back.distance <= MAX_SLAB_THICKNESS;
  if (!insideSlab || !back) return near;

  const candidates: WallMount[] = [
    // Face behind `near`: the room is on the far side of that face.
    { point: near.point.clone(), normal: near.normal.clone().negate(), distance: near.distance },
    { point: back.point.clone(), normal: near.normal.clone(), distance: back.distance },
  ];
  const score = (m: WallMount): number => {
    const probe = m.point.clone().addScaledVector(m.normal, SIDE_PROBE_OFFSET);
    const covered = !!bvh.raycastFirst(new Ray(probe, new Vector3(0, 1, 0)), DoubleSide);
    const free = bvh.raycastFirst(new Ray(probe, m.normal.clone()), DoubleSide)?.distance ?? 0;
    return (covered ? 1e6 : 0) + Math.min(free, 1e5);
  };
  return score(candidates[0]!) >= score(candidates[1]!) ? candidates[0]! : candidates[1]!;
}
