import { describe, expect, it } from 'vitest';
import { headingVector, planToMinimap } from '../../src/ui/minimapMath.ts';

const b = { minX: 0, maxX: 55, minY: 0, maxY: 36.8 };

describe('minimap math', () => {
  it('maps the plan origin to the top-left and the far corner to the bottom-right', () => {
    expect(planToMinimap(0, 0, b, 220, 147)).toEqual({ u: 0, v: 0 });
    const far = planToMinimap(55, 36.8, b, 220, 147);
    expect(far.u).toBeCloseTo(220);
    expect(far.v).toBeCloseTo(147);
  });

  it('points north up, east right, south down, west left', () => {
    const n = headingVector(0);
    expect(n.du).toBeCloseTo(0);
    expect(n.dv).toBeCloseTo(-1);
    const e = headingVector(-Math.PI / 2);
    expect(e.du).toBeCloseTo(1);
    expect(e.dv).toBeCloseTo(0);
    expect(headingVector(Math.PI).dv).toBeCloseTo(1);
    expect(headingVector(Math.PI / 2).du).toBeCloseTo(-1);
  });
});
