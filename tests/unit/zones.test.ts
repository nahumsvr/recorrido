import { describe, expect, it } from 'vitest';
import { zoneOf } from '../../src/domain/zones.ts';

describe('zoneOf', () => {
  it.each([
    [4.7, 0.39, 'Courts - north wall'],
    [0, 8.41, 'Courts - west wall'],
    [0, 29.25, 'Stands - west wall'],
    [9, 32.28, 'Stands - south wall'],
    [21.24, 34.17, 'South annex'],
    [42.48, 28.47, 'Offices'],
    [42.18, 28.47, 'Stands - east wall'],
    [46.45, 24.78, 'Offices'],
    [48.27, 4.26, 'Stage'],
    [54.59, 12.25, 'Stage - east wall'],
    [22.9, 12.35, 'Courts'],
  ])('(%s, %s) → %s', (x, y, zone) => {
    expect(zoneOf(x, y)).toBe(zone);
  });
});
