import { describe, expect, it } from 'vitest';
import { RACK_PLACEMENT } from '../../src/data/networkRack.ts';
import { deskObstacle } from '../../src/world/networkDesk.ts';

describe('network room desk', () => {
  const desk = deskObstacle();

  it('stays inside the room (X 12.44-16.44, Y 28.64-32.2)', () => {
    expect(desk.minX).toBeGreaterThan(12.44);
    expect(desk.maxX).toBeLessThanOrEqual(16.44);
    expect(desk.minZ).toBeGreaterThanOrEqual(28.64);
    expect(desk.maxZ).toBeLessThan(32.2);
  });

  it('keeps at least 0.9 m between the rack side and the desk', () => {
    const rackEast = RACK_PLACEMENT.center.x + RACK_PLACEMENT.width / 2;
    expect(desk.minX - rackEast).toBeGreaterThanOrEqual(0.9);
  });

  it('leaves the doorway (X 14.42-15.34) clear', () => {
    const overlapsDoorX = desk.minX < 15.34 && desk.maxX > 14.42;
    expect(overlapsDoorX && desk.maxZ > 31.2).toBe(false);
  });
});
