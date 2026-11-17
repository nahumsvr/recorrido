import { describe, expect, it } from 'vitest';
import { cleanTriangles, componentsInsideBox, parseBinaryStl, triangleComponents, weld } from '../../scripts/lib/stl.ts';

function makeStl(tris: number[][]): Uint8Array {
  const buf = new Uint8Array(84 + tris.length * 50);
  const view = new DataView(buf.buffer);
  view.setUint32(80, tris.length, true);
  tris.forEach((t, i) => t.forEach((v, k) => view.setFloat32(84 + i * 50 + 12 + k * 4, v, true)));
  return buf;
}

const quad = [
  [0, 0, 0, 1, 0, 0, 1, 1, 0],
  [0, 0, 0, 1, 1, 0, 0, 1, 0],
];
const farTri = [10, 10, 10, 11, 10, 10, 10, 11, 10];

describe('parseBinaryStl', () => {
  it('reads triangle positions and ignores stored normals', () => {
    const out = parseBinaryStl(makeStl(quad));
    expect(Array.from(out)).toEqual(quad.flat());
  });

  it('rejects files whose size does not match the triangle count', () => {
    const buf = makeStl(quad).slice(0, 120);
    expect(() => parseBinaryStl(buf)).toThrow(/Not a binary STL/);
  });
});

describe('weld + cleanTriangles', () => {
  it('shares vertices and removes degenerate and duplicated (flipped) triangles', () => {
    const flipped = [0, 0, 0, 1, 1, 0, 1, 0, 0];
    const degenerate = [0, 0, 0, 0, 0, 0, 1, 0, 0];
    const mesh = weld(new Float32Array([...quad.flat(), ...flipped, ...degenerate]));
    expect(mesh.vertices.length / 3).toBe(4);
    const r = cleanTriangles(mesh);
    expect(r.indices.length / 3).toBe(2);
    expect(r.duplicates).toBe(1);
    expect(r.degenerate).toBe(1);
  });
});

describe('components', () => {
  it('splits disconnected parts and selects those fully inside a box', () => {
    const mesh = weld(new Float32Array([...quad.flat(), ...farTri]));
    const comp = triangleComponents(mesh.indices, mesh.vertices.length / 3);
    expect(comp[0]).toBe(comp[1]);
    expect(comp[0]).not.toBe(comp[2]);
    const inside = componentsInsideBox(mesh, comp, { min: [9, 9, 9], max: [12, 12, 12] });
    expect(Array.from(inside)).toEqual([0, 0, 1]);
  });
});
