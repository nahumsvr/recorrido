import { describe, expect, it } from 'vitest';
import { BoxGeometry, Mesh, Vector3 } from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { findCeilingMount, findDeviceMount, findMountingWall } from '../../src/aps/mounting.ts';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
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

describe('findDeviceMount', () => {
  /** Wall slab x ∈ [0, 0.2] with a roof only over the x > 0.2 side (the room). */
  function roomBvh(): MeshBVH {
    const parts = [
      [0.2, 6, 10, 0.1, 3, 0],
      [10, 0.2, 10, 5.2, 7, 0],
    ].map(([w, h, d, x, y, z]) => {
      const g = new BoxGeometry(w, h, d);
      const m = new Mesh(g);
      m.position.set(x!, y!, z!);
      m.updateMatrixWorld();
      return g.applyMatrix4(m.matrixWorld).toNonIndexed();
    });
    return new MeshBVH(mergeGeometries(parts));
  }

  it('keeps the side the device is on when it is outside the slab', () => {
    const mount = findDeviceMount(roomBvh(), new Vector3(-0.05, 4, 0));
    expect(mount!.point.x).toBeCloseTo(0, 3);
    expect(mount!.normal.x).toBeCloseTo(-1, 3);
  });

  it('picks the covered room side when the device center is inside the slab', () => {
    // Center 2 cm inside the face at x = 0: the nearest face is the exterior one.
    const mount = findDeviceMount(roomBvh(), new Vector3(0.02, 4, 0));
    expect(mount!.point.x).toBeCloseTo(0.2, 3);
    expect(mount!.normal.x).toBeCloseTo(1, 3);
  });

  it('returns null without a wall nearby', () => {
    expect(findDeviceMount(roomBvh(), new Vector3(-5, 4, 0))).toBeNull();
  });
});

describe('findCeilingMount', () => {
  it('finds the slab underside for a device embedded in it', () => {
    // Roof slab spans h 6.9..7.1 over x 0.2..10.2.
    const g = new BoxGeometry(10, 0.2, 10);
    const m = new Mesh(g);
    m.position.set(5.2, 7, 0);
    m.updateMatrixWorld();
    const bvh = new MeshBVH(g.applyMatrix4(m.matrixWorld));
    expect(findCeilingMount(bvh, new Vector3(5, 6.95, 0))!.y).toBeCloseTo(6.9, 3);
    expect(findCeilingMount(bvh, new Vector3(5, 4, 0))).toBeNull();
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
