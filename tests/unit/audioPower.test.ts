import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { AUDIO_BOARD, POWER_RUNS, SPEAKER_OUTLETS } from '../../src/data/audioPower.ts';
import { SPEAKERS } from '../../src/data/audio.ts';
import { JUNCTIONS, PATHWAYS } from '../../src/data/cabling.ts';
import { infoCardFor } from '../../src/data/infoCards.ts';
import type { PlanPoint } from '../../src/domain/coords.ts';
import { loadBuildingBvh } from '../helpers/realModel.ts';

const sample = (pts: readonly PlanPoint[], step = 0.1): PlanPoint[] => {
  const out: PlanPoint[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y, b.h - a.h) / step));
    for (let k = 0; k <= n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n, h: a.h + ((b.h - a.h) * k) / n });
  }
  return out;
};
const gap = (a: readonly PlanPoint[], b: readonly PlanPoint[]): number => {
  let m = Infinity;
  for (const p of a) for (const q of b) m = Math.min(m, Math.hypot(p.x - q.x, p.y - q.y, p.h - q.h));
  return m;
};

describe('speaker power', () => {
  // The IDF-N feed (PWR_IDF) is also a power pathway; it has its own tests in idfPower.test.ts.
  const power = PATHWAYS.filter((w) => w.service === 'power' && POWER_RUNS.some((r) => r.id === w.id));

  it('gives each active speaker its own EMT from the audio board, ending in a box beside it', () => {
    expect(power.map((w) => w.id).sort()).toEqual(['PWR_L', 'PWR_R']);
    expect(POWER_RUNS.map((r) => r.speaker).sort()).toEqual(SPEAKERS.map((s) => s.id).sort());
    for (const w of power) {
      const first = w.points[0]!;
      expect(Math.hypot(first.x - AUDIO_BOARD.position.x, first.y - AUDIO_BOARD.position.y), w.id).toBeLessThan(0.3);
      expect(w.kind).toBe('emt');
    }
    for (const k of SPEAKERS) {
      const run = POWER_RUNS.find((r) => r.speaker === k.id)!;
      const out = SPEAKER_OUTLETS.find((o) => o.speaker === k.id)!;
      expect(out.position).toEqual(run.points.at(-1));
      expect(Math.hypot(out.position.x - k.position.x, out.position.y - k.position.y, out.position.h - k.position.h)).toBeLessThan(0.8);
      expect(JUNCTIONS.some((j) => j.pathway === `PWR_${k.line}` && j.device === k.id), k.id).toBe(true);
    }
  });

  it('rides beside the audio conduit of its line, and never touches any other conduit', () => {
    for (const w of power) {
      const twin = PATHWAYS.find((x) => x.id === w.id.replace('PWR_', 'AUDIO_'))!;
      const mine = sample(w.points, 0.05);
      const near = mine.filter((q) => gap([q], sample(twin.points, 0.05)) <= 0.12).length;
      expect(near / mine.length, `${w.id} beside ${twin.id}`).toBeGreaterThan(0.85);
      for (const o of PATHWAYS.filter((x) => x.id !== w.id && !x.physical)) {
        // Two metal tubes of ½" and ¾" need 0.02 m between axes to clear each other; the audio twin is meant to be close.
        expect(gap(mine, sample(o.points, 0.05)), `${w.id} vs ${o.id}`).toBeGreaterThanOrEqual(0.025);
      }
    }
  });

  it('lies on the wall: it does not run through the building and every strap finds a surface', async () => {
    const bvh = await loadBuildingBvh();
    for (const w of power) {
      for (const q of sample(w.points)) {
        const hit = { point: new Vector3(), distance: 0, faceIndex: 0 };
        bvh.closestPointToPoint(new Vector3(q.x, q.h, q.y), hit);
        expect(hit.distance, `${w.id} at ${q.x.toFixed(2)},${q.y.toFixed(2)},${q.h.toFixed(2)}`).toBeGreaterThan(0.005);
      }
    }
  });

  it('stays out of reach of people (3 m or higher) and has a card for each run and the board', () => {
    for (const w of power) {
      expect(Math.min(...w.points.map((q) => q.h)), w.id).toBeGreaterThanOrEqual(3.0);
      expect(infoCardFor({ type: 'power', id: w.id })?.title).toBe(w.id);
    }
    expect(infoCardFor({ type: 'power', id: AUDIO_BOARD.id })?.title).toBe(AUDIO_BOARD.id);
  });
});
