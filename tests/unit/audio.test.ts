import { Ray, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { AUDIO_RUNS, AUDIO_TRAY_H, BACK_ROW_EAR, FOH, FRONT_ROW_EAR, SPEAKERS, STANDS_MIRROR_X, STAND_FRONT_Y } from '../../src/data/audio.ts';
import { MODEL_ACCESS_POINTS } from '../../src/data/modelAps.ts';
import { loadBuildingBvh } from '../helpers/realModel.ts';

const cast = async (origin: [number, number, number], dir: [number, number, number], far = 20) => {
  const bvh = await loadBuildingBvh();
  const ray = new Ray(new Vector3(...origin), new Vector3(...dir).normalize());
  const hit = bvh.raycastFirst(ray as never, 2 as never) as { point: Vector3; distance: number } | null;
  return hit && hit.distance <= far ? hit : null;
};

describe('audio: speakers', () => {
  const byStand = (s: 'west' | 'east') => SPEAKERS.filter((x) => x.stand === s);

  it('has two speakers per stand (4 JBL EON715 as budgeted)', () => {
    expect(SPEAKERS).toHaveLength(4);
    expect(byStand('west')).toHaveLength(2);
    expect(byStand('east')).toHaveLength(2);
    expect(new Set(SPEAKERS.map((s) => s.model))).toEqual(new Set(['JBL EON715']));
  });

  it('east positions mirror the west ones about the aisle axis', () => {
    const west = byStand('west').map((s) => 2 * STANDS_MIRROR_X - s.position.x).sort((a, b) => a - b);
    const east = byStand('east').map((s) => s.position.x).sort((a, b) => a - b);
    east.forEach((x, i) => expect(x).toBeCloseTo(west[i]!, 5));
  });

  it('west line is L and east line is R', () => {
    for (const s of SPEAKERS) expect(s.line).toBe(s.stand === 'west' ? 'L' : 'R');
  });

  it('keeps 3 m from every model AP (M09 and M10 sit on the same wall)', () => {
    for (const s of SPEAKERS) {
      for (const ap of MODEL_ACCESS_POINTS) {
        const d = Math.hypot(s.position.x - ap.position.x, s.position.y - ap.position.y, s.position.h - ap.position.h);
        expect(d, `${s.id} vs ${ap.id}`).toBeGreaterThan(3);
      }
    }
  });

  it('stays inside its stand (west X 0.2-17.7, east X 25.3-42.5)', async () => {
    for (const s of SPEAKERS) {
      const [lo, hi] = s.stand === 'west' ? [0.2, 17.7] : [25.3, 42.5];
      expect(s.position.x).toBeGreaterThan(lo);
      expect(s.position.x).toBeLessThan(hi);
    }
  });

  it('stands on the court floor with the first riser right behind it', async () => {
    for (const s of SPEAKERS) {
      const floor = await cast([s.position.x, s.position.h, s.position.y], [0, -1, 0], 2);
      expect(floor, `${s.id} floor`).not.toBeNull();
      expect(floor!.point.y).toBeCloseTo(0, 1);
      const riser = await cast([s.position.x, s.position.h, s.position.y], [0, 0, 1], 1);
      expect(riser, `${s.id} riser`).not.toBeNull();
      expect(riser!.point.z).toBeCloseTo(STAND_FRONT_Y, 1);
    }
  });

  it('is tilted so the first and last row ears stay within ±30° of the axis (EON715: 60° vertical)', () => {
    const up = (ear: { y: number; h: number }, s: (typeof SPEAKERS)[number]) =>
      (Math.atan2(ear.h - s.position.h, ear.y - s.position.y) * 180) / Math.PI;
    for (const s of SPEAKERS) {
      expect(Math.abs(up(FRONT_ROW_EAR, s) - s.tiltUpDeg), `${s.id} front`).toBeLessThanOrEqual(30);
      expect(Math.abs(up(BACK_ROW_EAR, s) - s.tiltUpDeg), `${s.id} back`).toBeLessThanOrEqual(30);
    }
  });

  it('keeps the tilted cabinet clear of the riser (leaning corner ≤ 0.4 m ahead of the center)', () => {
    for (const s of SPEAKERS) {
      const a = (s.tiltUpDeg * Math.PI) / 180;
      const reach = 0.35 * Math.sin(a) + 0.185 * Math.cos(a);
      expect(STAND_FRONT_Y - s.position.y - reach).toBeGreaterThan(0.05);
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

  it('never crosses the central aisle mouth (X 18.5-24.5) on the floor', () => {
    for (const r of AUDIO_RUNS) {
      r.points.slice(1).forEach((p, i) => {
        const q = r.points[i]!;
        const crosses = Math.min(p.x, q.x) < 24.5 && Math.max(p.x, q.x) > 18.5;
        if (crosses) expect(Math.min(p.h, q.h), `${r.line} segment ${i}`).toBeGreaterThan(5);
      });
    }
  });

  it('keeps the high run above the last row (floor 3.77) with room to spare and under the roof (6.85)', () => {
    expect(AUDIO_TRAY_H).toBeGreaterThan(3.77 + 2);
    expect(AUDIO_TRAY_H).toBeLessThan(6.85);
  });

  it('ends each line at the foot of its stand, beside its last speaker', () => {
    const l = run('L').at(-1)!;
    const r = run('R').at(-1)!;
    expect(l.x).toBeCloseTo(Math.max(...SPEAKERS.filter((s) => s.line === 'L').map((s) => s.position.x)), 5);
    expect(r.x).toBeCloseTo(Math.min(...SPEAKERS.filter((s) => s.line === 'R').map((s) => s.position.x)), 5);
    expect(l.h).toBeLessThan(0.2);
    expect(r.h).toBeLessThan(0.2);
  });

  it('is about 86 m for L and 21 m for R (budget basis)', () => {
    expect(len(run('L'))).toBeGreaterThan(80);
    expect(len(run('L'))).toBeLessThan(92);
    expect(len(run('R'))).toBeGreaterThan(17);
    expect(len(run('R'))).toBeLessThan(23);
  });
});
