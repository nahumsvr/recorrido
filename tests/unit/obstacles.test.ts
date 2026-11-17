import { describe, expect, it } from 'vitest';
import { pushOutOfObstacle, type Obstacle, type Push } from '../../src/player/obstacles.ts';

const BOX: Obstacle = { minX: 0, maxX: 1, minZ: 0, maxZ: 2, maxY: 2 };
const out = (): Push => ({ x: 0, z: 0 });

describe('pushOutOfObstacle', () => {
  it('ignores a cylinder that is far away', () => {
    expect(pushOutOfObstacle(BOX, 3, 1, 0.3, 0, out())).toBe(false);
  });

  it('pushes a cylinder touching a face straight out', () => {
    const p = out();
    expect(pushOutOfObstacle(BOX, 1.1, 1, 0.3, 0, p)).toBe(true);
    expect(p.x).toBeCloseTo(0.2);
    expect(p.z).toBeCloseTo(0);
  });

  it('pushes diagonally around a corner', () => {
    const p = out();
    expect(pushOutOfObstacle(BOX, 1.1, 2.1, 0.3, 0, p)).toBe(true);
    expect(Math.hypot(1.1 + p.x - 1, 2.1 + p.z - 2)).toBeCloseTo(0.3);
  });

  it('leaves through the nearest face when the center is inside', () => {
    const p = out();
    expect(pushOutOfObstacle(BOX, 0.9, 1, 0.3, 0, p)).toBe(true);
    expect(0.9 + p.x).toBeCloseTo(1.3);
  });

  it('ignores the obstacle when the feet are above it', () => {
    expect(pushOutOfObstacle(BOX, 0.5, 1, 0.3, 2.5, out())).toBe(false);
  });
});
