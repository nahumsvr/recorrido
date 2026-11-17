import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { TELEPORTS } from '../../src/data/teleports.ts';
import { PlayerController } from '../../src/player/playerController.ts';
import { loadBuildingBvh } from '../helpers/realModel.ts';

const IDLE = { forward: 0, right: 0, yaw: 0, run: false, jump: false };

describe('teleports against the real model', () => {
  const ready = TELEPORTS.filter((t) => t.position);

  it.each(ready.map((t) => [t.id, t] as const))('%s lands on a floor within 0.5 m of the target', async (_, t) => {
    const bvh = await loadBuildingBvh();
    const p = t.position!;
    const player = new PlayerController(bvh, { safetyFloor: 0 });
    player.teleport(new Vector3(p.x, p.h, p.y), true);
    for (let i = 0; i < 120; i++) player.step(IDLE, 1 / 120);
    expect(player.onGround).toBe(true);
    expect(Math.hypot(player.position.x - p.x, player.position.z - p.y)).toBeLessThan(0.5);
    expect(player.position.y).toBeLessThanOrEqual(p.h + 0.36);
    expect(player.position.y).toBeGreaterThan(p.h - 1);
  });

  it('has coordinates for every destination', () => {
    expect(TELEPORTS.filter((t) => !t.position).map((t) => t.id)).toEqual([]);
  });
});
