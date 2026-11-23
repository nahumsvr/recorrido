import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three';
import { PROJECT_CAMERAS } from '../data/projectCameras.ts';
import type { Obstacle } from '../player/obstacles.ts';

/** Clear distance between the auditorium's south wall and the neighboring building, meters. */
export const NEIGHBOR_GAP_M = 5;
/** Footprint of the placeholder block (X east-west, Z north-south), meters. */
const NEIGHBOR_WIDTH_M = 16;
const NEIGHBOR_DEPTH_M = 18;
/** Three floors of 3.5 m. */
export const NEIGHBOR_HEIGHT_M = 3 * 3.5;

/** West face of the block: the imaginary line running south from CAM18, the camera at the south-west corner. */
const NEIGHBOR_WEST_X = PROJECT_CAMERAS.find((c) => c.id === 'CAM18')!.position.x;

/** What we need of the auditorium bounds (three.js world: X east, Z south). */
export interface AuditoriumBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly maxZ: number;
}

/** Axis-aligned box of the neighbor: west face on the CAM18 line, `NEIGHBOR_GAP_M` south of the south wall. */
export function neighborBox(b: AuditoriumBounds): { minX: number; maxX: number; minZ: number; maxZ: number } {
  const minZ = b.maxZ + NEIGHBOR_GAP_M;
  return { minX: NEIGHBOR_WEST_X, maxX: NEIGHBOR_WEST_X + NEIGHBOR_WIDTH_M, minZ, maxZ: minZ + NEIGHBOR_DEPTH_M };
}

/** Solid footprint for the player controller. */
export function neighborObstacle(b: AuditoriumBounds): Obstacle {
  return { ...neighborBox(b), maxY: NEIGHBOR_HEIGHT_M };
}

/** A big white block standing for the neighboring building. It never takes part in picking. */
export function createNeighborBuilding(b: AuditoriumBounds): Mesh {
  const box = neighborBox(b);
  const mesh = new Mesh(
    new BoxGeometry(box.maxX - box.minX, NEIGHBOR_HEIGHT_M, box.maxZ - box.minZ),
    new MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.9, metalness: 0 }),
  );
  mesh.name = 'neighborBuilding';
  mesh.position.set((box.minX + box.maxX) / 2, NEIGHBOR_HEIGHT_M / 2, (box.minZ + box.maxZ) / 2);
  mesh.raycast = () => {};
  return mesh;
}
