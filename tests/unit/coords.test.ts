import { describe, expect, it } from 'vitest';
import { planToThree, stlToPlan, stlToThree, threeToPlan } from '../../src/domain/coords.ts';

const a = { x0: -28.34, y0: 11.36 };

describe('coords', () => {
  it('maps the interior north-west corner of the courts to the plan origin', () => {
    const p = stlToPlan(-28.34, 11.36, 0, a);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(p.h).toBe(0);
  });

  it('turns STL north (+Y) into plan south (+Y) decreasing', () => {
    expect(stlToPlan(0, 10, 0, a).y).toBeLessThan(stlToPlan(0, 0, 0, a).y);
  });

  it('maps plan (X, Y, h) to three (X, h, Y) and back', () => {
    expect(planToThree({ x: 6, y: 0.4, h: 4.5 })).toEqual([6, 4.5, 0.4]);
    expect(threeToPlan(6, 4.5, 0.4)).toEqual({ x: 6, y: 0.4, h: 4.5 });
  });

  it('composes STL → plan → three consistently', () => {
    const p = stlToPlan(3, -5, 2, a);
    expect(stlToThree(3, -5, 2, a)).toEqual(planToThree(p));
  });

  it('preserves handedness (proper rotation)', () => {
    const o = stlToThree(0, 0, 0, a);
    const ex = stlToThree(1, 0, 0, a).map((v, i) => v - o[i]!);
    const ey = stlToThree(0, 1, 0, a).map((v, i) => v - o[i]!);
    const ez = stlToThree(0, 0, 1, a).map((v, i) => v - o[i]!);
    const det =
      ex[0]! * (ey[1]! * ez[2]! - ey[2]! * ez[1]!) -
      ex[1]! * (ey[0]! * ez[2]! - ey[2]! * ez[0]!) +
      ex[2]! * (ey[0]! * ez[1]! - ey[1]! * ez[0]!);
    expect(det).toBe(1);
  });
});
