import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { IDF, IDF_BOARD, JUNCTIONS, PATHWAYS } from '../../src/data/cabling.ts';
import { infoCardFor } from '../../src/data/infoCards.ts';
import type { PlanPoint } from '../../src/domain/coords.ts';
import { loadBuildingBvh } from '../helpers/realModel.ts';

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

describe('IDF-N power', () => {
  const run = PATHWAYS.find((w) => w.id === 'PWR_IDF')!;

  it('feeds the cabinet from board TA-N on the same wall, in its own EMT ending at the cabinet side', () => {
    expect(run.service).toBe('power');
    expect(run.kind).toBe('emt');
    const first = run.points[0]!;
    const last = run.points.at(-1)!;
    // Starts at the board's cabinet-facing side, ends on the cabinet's east face at a height the cabinet covers.
    expect(Math.abs(first.x - (IDF_BOARD.position.x - IDF_BOARD.size.w / 2))).toBeLessThan(0.01);
    expect(Math.abs(last.x - (IDF.position.x + IDF.size.w / 2))).toBeLessThan(0.01);
    expect(Math.abs(last.h - IDF.position.h)).toBeLessThanOrEqual(IDF.size.h / 2);
    expect(JUNCTIONS.some((j) => j.pathway === 'PWR_IDF' && j.kind === 'entry')).toBe(true);
  });

  it('never touches another conduit and lies on the wall', async () => {
    const mine = sample(run.points);
    for (const o of PATHWAYS.filter((x) => x.id !== run.id && !x.physical)) {
      const other = sample(o.points);
      let gap = Infinity;
      for (const p of mine) for (const q of other) gap = Math.min(gap, Math.hypot(p.x - q.x, p.y - q.y, p.h - q.h));
      expect(gap, `PWR_IDF vs ${o.id}`).toBeGreaterThanOrEqual(0.025);
    }
    const bvh = await loadBuildingBvh();
    for (const q of mine) {
      const hit = { point: new Vector3(), distance: 0, faceIndex: 0 };
      bvh.closestPointToPoint(new Vector3(q.x, q.h, q.y), hit);
      expect(hit.distance, `at ${q.x.toFixed(2)},${q.y.toFixed(2)},${q.h.toFixed(2)}`).toBeGreaterThan(0.005);
    }
  });

  it('stays out of reach of the balls and has a card for the run and the board', () => {
    expect(Math.min(...run.points.map((q) => q.h))).toBeGreaterThanOrEqual(3.0);
    expect(infoCardFor({ type: 'power', id: 'PWR_IDF' })?.title).toBe('PWR_IDF');
    expect(infoCardFor({ type: 'power', id: IDF_BOARD.id })?.title).toBe(IDF_BOARD.id);
  });

  it('lists the power feed on the IDF card, still unbudgeted', () => {
    const card = infoCardFor({ type: 'idf' })!;
    expect(card.specs.some(([k, v]) => k === 'Alimentación' && v.includes(IDF_BOARD.id))).toBe(true);
    expect(card.checks.find((c) => c.standard === 'Alimentación')?.verdict).toBe('fail');
  });
});
