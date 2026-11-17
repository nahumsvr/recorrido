import type { IndexedMesh } from './stl.ts';

export interface ComponentStats {
  readonly id: number;
  /** Triangle indices (into the mesh index buffer / 3) of this component. */
  readonly triangles: number[];
  readonly min: [number, number, number];
  readonly max: [number, number, number];
  readonly center: [number, number, number];
}

/** Repeated object recognized by its triangle count and bounding-box size. */
export interface DeviceSignature {
  readonly triangles: number;
  /** Cleanup may drop a few degenerate triangles from an instance. */
  readonly triangleTolerance?: number;
  /** Bounding-box size sorted ascending (orientation independent), meters. */
  readonly size: readonly [number, number, number];
  readonly tolerance: number;
}

/** Bounds and triangle list of every connected component. */
export function componentStats(mesh: IndexedMesh, triComp: Int32Array): ComponentStats[] {
  const byId = new Map<number, ComponentStats>();
  const p = mesh.vertices;
  for (let t = 0; t < triComp.length; t++) {
    const id = triComp[t]!;
    let s = byId.get(id);
    if (!s) {
      s = { id, triangles: [], min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity], center: [0, 0, 0] };
      byId.set(id, s);
    }
    s.triangles.push(t);
    for (let k = 0; k < 3; k++) {
      const v = mesh.indices[t * 3 + k]!;
      for (let a = 0; a < 3; a++) {
        s.min[a] = Math.min(s.min[a]!, p[v * 3 + a]!);
        s.max[a] = Math.max(s.max[a]!, p[v * 3 + a]!);
      }
    }
  }
  for (const s of byId.values()) for (let a = 0; a < 3; a++) s.center[a] = (s.min[a]! + s.max[a]!) / 2;
  return [...byId.values()];
}

export function matchesSignature(s: ComponentStats, sig: DeviceSignature): boolean {
  if (Math.abs(s.triangles.length - sig.triangles) > (sig.triangleTolerance ?? 0)) return false;
  const size = [0, 1, 2].map((a) => s.max[a]! - s.min[a]!).sort((m, n) => m - n);
  return size.every((v, i) => Math.abs(v - sig.size[i]!) <= sig.tolerance);
}
