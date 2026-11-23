import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { JUNCTIONS, PATHWAYS, PENETRATIONS } from '../../src/data/cabling.ts';
import { infoCardFor } from '../../src/data/infoCards.ts';
import { RACK_DEVICES, rackDeviceCenterH } from '../../src/data/networkRack.ts';
import { ROOM_CABLES } from '../../src/data/networkRoomWiring.ts';
import { ISP_DEPTH_M, ISP_ENTRY_H, ISP_ODF, ISP_SOURCE_Y, ISP_X, ispDuctPoints, ispDuctLengthM } from '../../src/data/undergroundLink.ts';
import type { PlanPoint } from '../../src/domain/coords.ts';
import { neighborBox } from '../../src/world/neighborBuilding.ts';
import { loadBuildingBvh } from '../helpers/realModel.ts';

const BOUNDS = { minX: 0, maxX: 54.8, maxZ: 36.6 };
const sample = (pts: readonly PlanPoint[], step = 0.05): PlanPoint[] => {
  const out: PlanPoint[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y, b.h - a.h) / step));
    for (let k = 0; k <= n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n, h: a.h + ((b.h - a.h) * k) / n });
  }
  return out;
};

describe('underground ISP link', () => {
  const nb = neighborBox(BOUNDS);
  const duct = ispDuctPoints(nb.minZ);
  const riser = PATHWAYS.find((w) => w.id === 'ISP_RISER')!;
  const sleeve = PATHWAYS.find((w) => w.id === 'PEN10')!;

  it('leaves the white building face at depth and runs straight to the network room wall', () => {
    expect(duct[0]).toEqual({ x: ISP_X, y: nb.minZ, h: -ISP_DEPTH_M });
    // The neighbor spans the duct's line, so the duct really starts on its face.
    expect(ISP_X).toBeGreaterThanOrEqual(nb.minX);
    expect(ISP_X).toBeLessThanOrEqual(nb.maxX);
    for (const q of duct.slice(0, -1)) expect(q.h).toBeCloseTo(-ISP_DEPTH_M, 6);
    expect(duct.at(-1)!.h).toBeGreaterThanOrEqual(0);
    expect(ispDuctLengthM(nb.minZ)).toBeGreaterThan(nb.minZ - BOUNDS.maxZ);
  });

  it('rises on the annex face of the south wall in rigid conduit and goes through a sleeve at the ODF height', () => {
    expect(riser.kind).toBe('rmc');
    expect(riser.service).toBe('isp');
    expect(riser.points.at(-1)!.h).toBeCloseTo(ISP_ENTRY_H, 6);
    expect(sleeve.kind).toBe('conduit');
    expect(PENETRATIONS.some((p) => p.id === 'PEN-10' && p.pathway === 'PEN10' && Math.abs(p.position.h - ISP_ENTRY_H) < 1e-6)).toBe(true);
    expect(JUNCTIONS.some((j) => j.pathway === 'ISP_RISER' && j.kind === 'entry')).toBe(true);
  });

  it('keeps clear of every other conduit and lies on the wall', async () => {
    const mine = sample(riser.points);
    for (const o of PATHWAYS.filter((x) => x.id !== riser.id && x.id !== sleeve.id && !x.physical)) {
      let gap = Infinity;
      for (const p of mine) for (const q of sample(o.points)) gap = Math.min(gap, Math.hypot(p.x - q.x, p.y - q.y, p.h - q.h));
      expect(gap, `ISP_RISER vs ${o.id}`).toBeGreaterThanOrEqual(0.025);
    }
    const bvh = await loadBuildingBvh();
    for (const q of mine) {
      const hit = { point: new Vector3(), distance: 0, faceIndex: 0 };
      bvh.closestPointToPoint(new Vector3(q.x, q.h, q.y), hit);
      expect(hit.distance, `at ${q.y.toFixed(2)},${q.h.toFixed(2)}`).toBeGreaterThan(0.005);
    }
  });

  it('ends in the ODF on the inner face of the wall, patched to the router', () => {
    expect(ISP_ODF.position.y + ISP_ODF.size.d / 2).toBeCloseTo(32.2, 2);
    const cord = ROOM_CABLES.find((c) => c.id === 'LAN_ODF_ER8411')!;
    expect(cord.kind).toBe('data');
    expect(cord.from).toBe(ISP_ODF.id);
    expect(cord.to).toBe('ER8411');
    const router = rackDeviceCenterH(RACK_DEVICES.find((d) => d.id === 'ER8411')!);
    expect(cord.points[0]!.x).toBeCloseTo(ISP_ODF.position.x, 2);
    expect(Math.abs(cord.points.at(-1)!.h - router)).toBeLessThan(0.05);
  });

  it('has a card for the duct, the riser and the ODF', () => {
    for (const id of ['UG_ISP', 'ISP_RISER', ISP_ODF.id]) expect(infoCardFor({ type: 'isp', id })?.title, id).toBe(id);
  });
});

describe('underground ISP link placement', () => {
  it('matches the placed white block: the duct starts on its north face', async () => {
    const bvh = await loadBuildingBvh();
    bvh.geometry.computeBoundingBox();
    const bb = bvh.geometry.boundingBox!;
    const nb = neighborBox({ minX: bb.min.x, maxX: bb.max.x, maxZ: bb.max.z });
    expect(nb.minZ).toBeCloseTo(ISP_SOURCE_Y, 1);
  });
});
