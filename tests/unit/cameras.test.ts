import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { findMountingWall } from '../../src/aps/mounting.ts';
import { CAMERAS } from '../../src/data/cameras.ts';
import { loadBuildingBvh } from '../helpers/realModel.ts';

describe('camera data', () => {
  it('has the 7 cameras kept from the 14 positions marked on the plan, with unique ids', () => {
    expect(CAMERAS.map((c) => c.id)).toEqual(['CAM02', 'CAM04', 'CAM05', 'CAM07', 'CAM10', 'CAM11', 'CAM12']);
    expect(CAMERAS.some((c) => c.hidden)).toBe(false);
  });

  it('uses bullets only in the pasillo and domes everywhere else', () => {
    const bullets = CAMERAS.filter((c) => c.kind === 'bullet').map((c) => c.id);
    expect(bullets).toEqual(['CAM11', 'CAM12']);
    expect(CAMERAS.filter((c) => c.kind === 'dome')).toHaveLength(5);
  });

  it('mounts every camera at least 2.4 m above the lowest floor (out of reach)', () => {
    for (const c of CAMERAS) expect(c.position.h).toBeGreaterThanOrEqual(2.4);
  });
});

describe('cameras against the real model', () => {
  it('finds a wall within 1 m of every camera position', async () => {
    const bvh = await loadBuildingBvh();
    for (const c of CAMERAS) {
      const mount = findMountingWall(bvh, new Vector3(c.position.x, c.position.h, c.position.y), 1);
      expect(mount, `${c.id} has no wall within 1 m`).not.toBeNull();
    }
  });
});
