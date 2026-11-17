import { describe, expect, it } from 'vitest';
import { componentStats, matchesSignature } from '../../scripts/lib/devices.ts';
import { triangleComponents, weld } from '../../scripts/lib/stl.ts';

/** Axis-aligned box as 12 triangles. */
function boxTris(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): number[] {
  const v = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ];
  const f = [
    [0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6], [0, 4, 5], [0, 5, 1],
    [1, 5, 6], [1, 6, 2], [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0],
  ];
  return f.flatMap((tri) => tri.flatMap((i) => v[i]!));
}

describe('device detection', () => {
  const tris = new Float32Array([
    ...boxTris(0, 0, 0, 0.03, 0.2, 0.16), // device body
    ...boxTris(5, 0, 0, 5.2, 0.03, 0.16), // same body, rotated 90°
    ...boxTris(10, 0, 0, 10.5, 0.5, 0.5), // something else
  ]);
  const mesh = weld(tris);
  const comp = triangleComponents(mesh.indices, mesh.vertices.length / 3);
  const stats = componentStats(mesh, comp);

  it('collects triangle count, bounds and center per component', () => {
    expect(stats).toHaveLength(3);
    const body = stats.find((s) => s.center[0] < 1)!;
    expect(body.triangles).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(body.center[1]).toBeCloseTo(0.1);
  });

  it('matches a signature by triangle count and sorted size, ignoring orientation', () => {
    const signature = { triangles: 12, size: [0.03, 0.16, 0.2] as const, tolerance: 0.01 };
    const matched = stats.filter((s) => matchesSignature(s, signature)).map((s) => Math.round(s.center[0]));
    expect(matched.sort((a, b) => a - b)).toEqual([0, 5]);
  });

  it('tolerates a few triangles lost in cleanup when asked to', () => {
    const body = stats.find((s) => s.center[0] < 1)!;
    const strict = { triangles: 13, size: [0.03, 0.16, 0.2] as const, tolerance: 0.01 };
    expect(matchesSignature(body, strict)).toBe(false);
    expect(matchesSignature(body, { ...strict, triangleTolerance: 2 })).toBe(true);
  });
});
