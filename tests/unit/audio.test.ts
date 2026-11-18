import { Ray, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { AUDIO_RUNS, AUDIO_TRAY_H, EAST_WALL_X, EON715_COVERAGE, FOH, SPEAKERS, STANDS_MIRROR_X, WEST_WALL_X, coverageEars, offAxisDeg } from '../../src/data/audio.ts';
import { MODEL_ACCESS_POINTS } from '../../src/data/modelAps.ts';
import { loadBuildingBvh } from '../helpers/realModel.ts';

const cast = async (origin: [number, number, number], dir: [number, number, number], far = 20) => {
  const bvh = await loadBuildingBvh();
  const ray = new Ray(new Vector3(...origin), new Vector3(...dir).normalize());
  const hit = bvh.raycastFirst(ray as never, 2 as never) as { point: Vector3; distance: number } | null;
  return hit && hit.distance <= far ? hit : null;
};

describe('audio: speakers', () => {
  const west = SPEAKERS.find((x) => x.stand === 'west')!;
  const east = SPEAKERS.find((x) => x.stand === 'east')!;

  it('has one JBL EON715 per stand (2 of the 4 budgeted)', () => {
    expect(SPEAKERS).toHaveLength(2);
    expect(new Set(SPEAKERS.map((s) => s.model))).toEqual(new Set(['JBL EON715']));
    expect(west).toBeDefined();
    expect(east).toBeDefined();
  });

  it('the east one mirrors the west one about the aisle axis', () => {
    expect(east.position.x).toBeCloseTo(2 * STANDS_MIRROR_X - west.position.x + (EAST_WALL_X - (2 * STANDS_MIRROR_X - WEST_WALL_X)), 5);
    expect(east.position.y).toBe(west.position.y);
    expect(east.position.h).toBe(west.position.h);
    expect(east.aim.x).toBeCloseTo(2 * STANDS_MIRROR_X - west.aim.x, 5);
  });

  it('west line is L and east line is R', () => {
    for (const s of SPEAKERS) expect(s.line).toBe(s.stand === 'west' ? 'L' : 'R');
  });

  it('keeps 3 m from every model AP', () => {
    for (const s of SPEAKERS) {
      for (const ap of MODEL_ACCESS_POINTS) {
        const d = Math.hypot(s.position.x - ap.position.x, s.position.y - ap.position.y, s.position.h - ap.position.h);
        expect(d, `${s.id} vs ${ap.id}`).toBeGreaterThan(3);
      }
    }
  });

  it('hangs 0.45 m off the end wall of its stand, at 3 m, out of the way', async () => {
    for (const s of SPEAKERS) {
      expect(Math.abs(s.position.x - s.wallX)).toBeCloseTo(0.45, 5);
      expect(s.position.h).toBe(3);
      // The wall is really there: a ray from the speaker toward its wall hits it at wallX.
      const dir: [number, number, number] = [Math.sign(s.wallX - s.position.x), 0, 0];
      const wall = await cast([s.position.x, s.position.h, s.position.y], dir, 1);
      expect(wall, `${s.id} wall`).not.toBeNull();
      expect(wall!.point.x).toBeCloseTo(s.wallX, 1);
    }
  });

  it('is aimed at the stand it covers (into the stand, toward its middle)', () => {
    for (const s of SPEAKERS) {
      const inward = Math.sign(s.aim.x - s.position.x);
      expect(inward, s.id).toBe(s.stand === 'west' ? 1 : -1);
      expect(s.aim.y).toBeGreaterThan(s.position.y);
    }
  });

  it('covers the far end and the middle of its stand inside the EON715 pattern (±45° H, ±30° V)', () => {
    for (const s of SPEAKERS) {
      for (const ear of coverageEars(s.stand)) {
        const o = offAxisDeg(s, ear);
        expect(o.horizontal, `${s.id} H ${ear.x},${ear.y}`).toBeLessThanOrEqual(EON715_COVERAGE.horizontalHalfDeg);
        expect(o.vertical, `${s.id} V ${ear.x},${ear.y}`).toBeLessThanOrEqual(EON715_COVERAGE.verticalHalfDeg);
      }
    }
  });
});

describe('audio: operator table on the stage', () => {
  const { center, length, depth } = FOH.table;
  const corners = [
    [center.x - length / 2, center.y - depth / 2],
    [center.x + length / 2, center.y - depth / 2],
    [center.x - length / 2, center.y + depth / 2],
    [center.x + length / 2, center.y + depth / 2],
  ] as const;

  it('stands on the stage floor (h 1.18), 0.3 m clear of the stair head (stair X 45.7-47, Y up to 23.5)', async () => {
    expect(center.y - depth / 2).toBeGreaterThanOrEqual(23.5 + 0.3);
    for (const [x, y] of corners) {
      const floor = await cast([x, FOH.floorH + 1.5, y], [0, -1, 0], 3);
      expect(floor, `${x},${y}`).not.toBeNull();
      expect(floor!.point.y).toBeCloseTo(FOH.floorH, 1);
    }
  });

  it('puts the wall panel on the north face of the offices block', async () => {
    const wall = await cast([FOH.panel.x, FOH.panel.h, FOH.panel.y - 0.6], [0, 0, 1], 1);
    expect(wall).not.toBeNull();
    expect(wall!.point.z).toBeCloseTo(FOH.panel.y, 1);
  });
});

describe('audio: cable runs', () => {
  const len = (pts: readonly { x: number; y: number; h: number }[]) =>
    pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - pts[i]!.x, p.y - pts[i]!.y, p.h - pts[i]!.h), 0);
  const run = (line: 'L' | 'R') => AUDIO_RUNS.find((r) => r.line === line)!.points;

  it('never crosses the central aisle mouth (X 18.5-24.5) below 5 m, and nothing runs on the floor', () => {
    for (const r of AUDIO_RUNS) {
      r.points.slice(1).forEach((p, i) => {
        const q = r.points[i]!;
        const crosses = Math.min(p.x, q.x) < 24.5 && Math.max(p.x, q.x) > 18.5;
        if (crosses) expect(Math.min(p.h, q.h), `${r.line} segment ${i}`).toBeGreaterThan(5);
        expect(Math.min(p.h, q.h), `${r.line} segment ${i} height`).toBeGreaterThanOrEqual(FOH.panel.h - 1e-9);
      });
    }
  });

  it('keeps the high run above the last row (floor 3.77) with room to spare and under the roof (6.85)', () => {
    expect(AUDIO_TRAY_H).toBeGreaterThan(3.77 + 2);
    expect(AUDIO_TRAY_H).toBeLessThan(6.85);
  });

  it('ends each line on the end wall of its stand, at the height of its speaker, beside it', () => {
    for (const line of ['L', 'R'] as const) {
      const end = run(line).at(-1)!;
      const spk = SPEAKERS.find((s) => s.line === line)!;
      expect(end.h, line).toBe(spk.position.h);
      expect(Math.abs(end.x - spk.wallX), line).toBeLessThan(0.05);
      expect(Math.abs(end.y - spk.position.y), line).toBeLessThan(0.5);
    }
  });

  it('is about 70 m for L and 7 m for R (budget basis)', () => {
    expect(len(run('L'))).toBeGreaterThan(65);
    expect(len(run('L'))).toBeLessThan(76);
    expect(len(run('R'))).toBeGreaterThan(5);
    expect(len(run('R'))).toBeLessThan(10);
  });
});
