import { DoubleSide, Ray, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { PATHWAYS } from '../../src/data/cabling.ts';
import { attachPoint, junctionsOf, pathLength } from '../../src/data/cabling.ts';
import { supportsOf } from '../../src/data/pathwaySupports.ts';
import { EMT_BOX_REACH_M, EMT_SPACING_M, TRAY_SPACING_M, planSupports, strapStations, tally, type Probe } from '../../src/domain/supports.ts';
import { loadBuildingBvh } from '../helpers/realModel.ts';

const probeOf = async (): Promise<Probe> => {
  const bvh = await loadBuildingBvh();
  return (o, d) => {
    const hits = (bvh.raycast(new Ray(new Vector3(o.x, o.h, o.y), new Vector3(d.x, d.h, d.y)) as never, DoubleSide as never) as { distance: number }[])
      .map((h) => h.distance)
      .filter((x) => x > 0.001)
      .sort((a, b) => a - b)
      .filter((x, i, all) => i === 0 || x - all[i - 1]! > 0.01);
    const first = hits[0];
    return first === undefined ? null : { distance: first, thickness: hits[1] === undefined ? Infinity : hits[1] - first };
  };
};

const stats = async (id: string) => {
  const w = PATHWAYS.find((x) => x.id === id)!;
  return tally(supportsOf(w, await probeOf()));
};

describe('planSupports', () => {
  it('places a support at every end and at most 1.5 m apart', async () => {
    const probe = await probeOf();
    const w = PATHWAYS.find((x) => x.id === 'WEST')!;
    const s = planSupports(w.points, probe);
    const last = w.points.at(-1)!;
    expect(s[0]!.at).toEqual(w.points[0]);
    expect(s.at(-1)!.at.y).toBeCloseTo(last.y, 9);
    expect(s.at(-1)!.at.h).toBeCloseTo(last.h, 9);
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1]!.at;
      const b = s[i]!.at;
      expect(Math.hypot(a.x - b.x, a.y - b.y, a.h - b.h)).toBeLessThanOrEqual(TRAY_SPACING_M + 1e-6);
    }
  });

  it('anchors the wall-mounted trays to solid wall', async () => {
    for (const id of ['WEST', 'NORTH_A', 'BACK_W', 'NORTH_B']) expect(await stats(id), id).toMatchObject({ thin: 0, none: 0 });
  });

  it('straps every EMT run within 0.9 m of each box and at most 3 m apart, and nothing more', async () => {
    const probe = await probeOf();
    for (const w of PATHWAYS.filter((x) => (x.kind === 'emt' || x.kind === 'rmc') && !x.physical)) {
      const length = pathLength(w.points);
      const boxes = [0, length, ...junctionsOf(w.id).map((j) => attachPoint(w, j.at).along)];
      const stations = strapStations(length, boxes);
      for (const b of boxes) expect(Math.min(...stations.map((s) => Math.abs(s - b))), `${w.id} box at ${b.toFixed(1)}`).toBeLessThanOrEqual(EMT_BOX_REACH_M);
      const all = [0, ...stations, length];
      // 3 m between straps; the ends are boxes, which hold the tube too.
      for (let i = 1; i < all.length; i++) if (i > 1 && i < all.length - 1) expect(all[i]! - all[i - 1]!, w.id).toBeLessThanOrEqual(EMT_SPACING_M + 1e-6);
      expect(supportsOf(w, probe), w.id).toHaveLength(stations.length);
    }
  });

  it('puts the straps on a tube that lies on the wall, with an ear on the wall within a few centimeters', async () => {
    const probe = await probeOf();
    for (const w of PATHWAYS.filter((x) => (x.kind === 'emt' || x.kind === 'rmc') && !x.physical)) {
      for (const s of supportsOf(w, probe)) {
        expect(s.run, w.id).toBeDefined();
        expect(Math.hypot(s.anchor.x - s.at.x, s.anchor.y - s.at.y, s.anchor.h - s.at.h), w.id).toBeLessThanOrEqual(0.12);
      }
    }
  });

  it('flags the aisle crossing as hung from a thin plate', async () => {
    expect((await stats('ANNEX_E2')).thin).toBeGreaterThan(0);
  });

  it('anchors the stage-side trays and the M17 branch to solid wall', async () => {
    for (const id of ['STAGE_A', 'STAGE_B', 'STAGE_R', 'STAGE_M']) expect(await stats(id), id).toMatchObject({ thin: 0, none: 0 });
  });

  it('holds both audio lines with straps on wall, none in free air', async () => {
    for (const id of ['AUDIO_R', 'AUDIO_R_LOW', 'AUDIO_L', 'AUDIO_L_LOW']) expect(await stats(id), id).toMatchObject({ thin: 0, none: 0 });
  });
});
