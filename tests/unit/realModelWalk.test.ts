import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { PlayerController, type PlayerInput } from '../../src/player/playerController.ts';
import { loadBuildingBvh } from '../helpers/realModel.ts';

const NORTH = 0;
const SOUTH = Math.PI;

async function walk(from: Vector3, yaw: number, seconds: number): Promise<PlayerController> {
  const p = new PlayerController(await loadBuildingBvh(), { safetyFloor: 0 });
  p.teleport(from, true);
  const input: PlayerInput = { forward: 1, right: 0, yaw, run: false, jump: false };
  for (let t = 0; t < seconds; t += 1 / 120) p.step(input, 1 / 120);
  return p;
}

describe('walking in the real model', () => {
  it('stops at the inner north wall (Y = 0) keeping the capsule radius', async () => {
    const p = await walk(new Vector3(20, 0, 5), NORTH, 6);
    expect(p.position.z).toBeCloseTo(0.3, 1);
  });

  it('climbs the north stage stairs onto the stage (h ≈ 1.18)', async () => {
    const p = await walk(new Vector3(46.3, 0, 0.4), SOUTH, 4);
    expect(p.position.y).toBeCloseTo(1.18, 1);
  });

  it('climbs the south stage stairs onto the stage', async () => {
    const p = await walk(new Vector3(46.3, 0, 24.15), NORTH, 4);
    expect(p.position.y).toBeCloseTo(1.18, 1);
  });

  it('is blocked by the 0.8 m stands front without jumping', async () => {
    const p = await walk(new Vector3(10, 0, 22), SOUTH, 4);
    expect(p.position.z).toBeCloseTo(24.4, 1);
    expect(p.position.y).toBeCloseTo(0, 2);
  });
});
