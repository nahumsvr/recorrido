/** Pure helpers for the offline STL → GLB pipeline. */

export interface IndexedMesh {
  /** xyz per vertex. */
  readonly vertices: Float32Array;
  /** 3 indices per triangle. */
  readonly indices: Uint32Array;
}

const HEADER_BYTES = 80;
const TRIANGLE_BYTES = 50;

/** Parses a binary STL into flat triangle positions (9 floats per triangle). */
export function parseBinaryStl(buf: Uint8Array): Float32Array {
  if (buf.byteLength < HEADER_BYTES + 4) throw new Error('STL too small');
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const count = view.getUint32(HEADER_BYTES, true);
  const expected = HEADER_BYTES + 4 + count * TRIANGLE_BYTES;
  if (expected !== buf.byteLength) {
    throw new Error(`Not a binary STL: header says ${count} triangles (${expected} bytes), file has ${buf.byteLength}`);
  }
  const out = new Float32Array(count * 9);
  for (let t = 0; t < count; t++) {
    // Skip the 12-byte stored normal: SketchUp normals are unreliable, we recompute.
    const base = HEADER_BYTES + 4 + t * TRIANGLE_BYTES + 12;
    for (let k = 0; k < 9; k++) out[t * 9 + k] = view.getFloat32(base + k * 4, true);
  }
  return out;
}

/** Merges vertices that coincide after quantizing to `step` meters. */
export function weld(triangles: Float32Array, step = 1e-4): IndexedMesh {
  const map = new Map<string, number>();
  const verts: number[] = [];
  const indices = new Uint32Array(triangles.length / 3);
  for (let v = 0; v < indices.length; v++) {
    const x = triangles[v * 3]!;
    const y = triangles[v * 3 + 1]!;
    const z = triangles[v * 3 + 2]!;
    const key = `${Math.round(x / step)},${Math.round(y / step)},${Math.round(z / step)}`;
    let id = map.get(key);
    if (id === undefined) {
      id = verts.length / 3;
      map.set(key, id);
      verts.push(x, y, z);
    }
    indices[v] = id;
  }
  return { vertices: new Float32Array(verts), indices };
}

export interface CleanResult {
  readonly indices: Uint32Array;
  readonly degenerate: number;
  readonly duplicates: number;
}

/** Drops zero-area triangles and exact duplicates (same 3 vertices, any order/winding). */
export function cleanTriangles(mesh: IndexedMesh, minArea = 1e-8): CleanResult {
  const { vertices: p, indices } = mesh;
  const seen = new Set<string>();
  const kept: number[] = [];
  let degenerate = 0;
  let duplicates = 0;
  for (let t = 0; t < indices.length / 3; t++) {
    const a = indices[t * 3]!;
    const b = indices[t * 3 + 1]!;
    const c = indices[t * 3 + 2]!;
    if (a === b || b === c || a === c || triangleArea(p, a, b, c) < minArea) {
      degenerate++;
      continue;
    }
    const key = [a, b, c].sort((m, n) => m - n).join(',');
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    kept.push(a, b, c);
  }
  return { indices: new Uint32Array(kept), degenerate, duplicates };
}

export function triangleArea(p: Float32Array, a: number, b: number, c: number): number {
  const ux = p[b * 3]! - p[a * 3]!;
  const uy = p[b * 3 + 1]! - p[a * 3 + 1]!;
  const uz = p[b * 3 + 2]! - p[a * 3 + 2]!;
  const vx = p[c * 3]! - p[a * 3]!;
  const vy = p[c * 3 + 1]! - p[a * 3 + 1]!;
  const vz = p[c * 3 + 2]! - p[a * 3 + 2]!;
  const cx = uy * vz - uz * vy;
  const cy = uz * vx - ux * vz;
  const cz = ux * vy - uy * vx;
  return Math.hypot(cx, cy, cz) / 2;
}

/** Labels each triangle with its connected component (shared vertices). */
export function triangleComponents(indices: Uint32Array, vertexCount: number): Int32Array {
  const parent = new Int32Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) parent[i] = i;
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]!]!;
      x = parent[x]!;
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let t = 0; t < indices.length / 3; t++) {
    union(indices[t * 3]!, indices[t * 3 + 1]!);
    union(indices[t * 3]!, indices[t * 3 + 2]!);
  }
  const out = new Int32Array(indices.length / 3);
  for (let t = 0; t < out.length; t++) out[t] = find(indices[t * 3]!);
  return out;
}

export interface Box3 {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

/** Marks triangles whose whole connected component lies inside `box`. */
export function componentsInsideBox(mesh: IndexedMesh, triComp: Int32Array, box: Box3): Uint8Array {
  const { vertices: p, indices } = mesh;
  const outside = new Set<number>();
  for (let t = 0; t < triComp.length; t++) {
    const comp = triComp[t]!;
    if (outside.has(comp)) continue;
    for (let k = 0; k < 3; k++) {
      const v = indices[t * 3 + k]!;
      for (let axis = 0; axis < 3; axis++) {
        const value = p[v * 3 + axis]!;
        if (value < box.min[axis]! || value > box.max[axis]!) {
          outside.add(comp);
          break;
        }
      }
      if (outside.has(comp)) break;
    }
  }
  const inside = new Uint8Array(triComp.length);
  for (let t = 0; t < triComp.length; t++) inside[t] = outside.has(triComp[t]!) ? 0 : 1;
  return inside;
}
