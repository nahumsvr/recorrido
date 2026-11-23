import { describe, expect, it } from 'vitest';
import { PROJECT_CAMERAS } from '../../src/data/projectCameras.ts';
import { NEIGHBOR_GAP_M, NEIGHBOR_HEIGHT_M, neighborBox, neighborObstacle } from '../../src/world/neighborBuilding.ts';

const BOUNDS = { minX: 0, maxX: 54.6, maxZ: 32.6 };

describe('neighbor building', () => {
  it('stands 5 m south of the auditorium, about three floors tall', () => {
    const b = neighborBox(BOUNDS);
    expect(b.minZ - BOUNDS.maxZ).toBeCloseTo(NEIGHBOR_GAP_M, 6);
    expect(NEIGHBOR_GAP_M).toBe(5);
    expect(b.maxZ).toBeGreaterThan(b.minZ);
    expect(NEIGHBOR_HEIGHT_M).toBeGreaterThanOrEqual(9);
    expect(NEIGHBOR_HEIGHT_M).toBeLessThanOrEqual(12);
  });

  it('sits in the south-west corner: its west face lies on the line running south from CAM18', () => {
    const cam18 = PROJECT_CAMERAS.find((c) => c.id === 'CAM18')!;
    const b = neighborBox(BOUNDS);
    expect(b.minX).toBeCloseTo(cam18.position.x, 6);
    expect(b.maxX).toBeGreaterThan(b.minX);
  });

  it('is solid for the player up to its roof', () => {
    const o = neighborObstacle(BOUNDS);
    const b = neighborBox(BOUNDS);
    expect(o).toEqual({ minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ, maxY: NEIGHBOR_HEIGHT_M });
  });
});
