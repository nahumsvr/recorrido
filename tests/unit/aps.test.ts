import { describe, expect, it } from 'vitest';
import { BoxGeometry, Mesh, Vector3 } from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { findMountingWall } from '../../src/aps/mounting.ts';
import { nearestAp, panelApId } from '../../src/aps/selection.ts';
import { ACCESS_POINTS } from '../../src/data/aps.ts';

function wallBvh(): MeshBVH {
  // Wall slab with faces at x = 0 and x = 0.2.
  const g = new BoxGeometry(0.2, 6, 10);
  const m = new Mesh(g);
  m.position.set(0.1, 3, 0);
  m.updateMatrixWorld();
  return new MeshBVH(g.applyMatrix4(m.matrixWorld));
}

describe('findMountingWall', () => {
  it('finds the nearest wall face and a normal pointing toward the AP', () => {
    const mount = findMountingWall(wallBvh(), new Vector3(-0.4, 4.5, 0), 2);
    expect(mount).not.toBeNull();
    expect(mount!.distance).toBeCloseTo(0.4, 2);
    expect(mount!.point.x).toBeCloseTo(0, 3);
    expect(mount!.normal.x).toBeCloseTo(-1, 3);
    expect(mount!.normal.y).toBe(0);
  });

  it('returns null when no wall is within range', () => {
    expect(findMountingWall(wallBvh(), new Vector3(-5, 4.5, 0), 2)).toBeNull();
  });
});

describe('AP selection', () => {
  const items = ACCESS_POINTS.slice(0, 2).map((ap) => ({ ap, position: new Vector3(ap.position.x, ap.position.h, ap.position.y) }));

  it('picks the nearest AP within the radius', () => {
    expect(nearestAp(items, new Vector3(7, 1.65, 3), 4)?.ap.id).toBe('AP01');
    expect(nearestAp(items, new Vector3(16, 1.65, 3), 4)?.ap.id).toBe('AP02');
  });

  it('returns null when every AP is farther than the radius', () => {
    expect(nearestAp(items, new Vector3(11.5, 1.65, 12), 4)).toBeNull();
  });

  it('shows a pinned AP over the nearby one', () => {
    expect(panelApId({ pinned: 'AP05', nearby: 'AP01' })).toBe('AP05');
    expect(panelApId({ pinned: null, nearby: 'AP01' })).toBe('AP01');
    expect(panelApId({ pinned: null, nearby: null })).toBeNull();
  });
});

describe('AP table', () => {
  it('has AP01..AP14 with the EAP773 model', () => {
    expect(ACCESS_POINTS.map((a) => a.id)).toEqual(Array.from({ length: 14 }, (_, i) => `AP${String(i + 1).padStart(2, '0')}`));
    expect(new Set(ACCESS_POINTS.map((a) => a.model))).toEqual(new Set(['TP-Link EAP773']));
  });
});
