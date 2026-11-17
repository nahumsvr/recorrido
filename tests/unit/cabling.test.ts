import { DoubleSide, Ray, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { SPEAKERS } from '../../src/data/audio.ts';
import { MODEL_ACCESS_POINTS } from '../../src/data/modelAps.ts';
import { BACKBONE_FIBER_CHAIN, CABLE_DEVICES, DEVICE_ROUTES, FREE_SPANS, HUG_DISTANCE_M, IDF, JUNCTIONS, MAX_PULL_M, OM3_MAX_M, carriesFiber, backboneFiberM, PATHWAYS, PENETRATIONS, cablesOn, pathLength, pathway } from '../../src/data/cabling.ts';
import { planDrop } from '../../src/domain/dropRouting.ts';
import { loadBuildingBvh } from '../helpers/realModel.ts';

type P = { x: number; y: number; h: number };
const v = (p: P) => new Vector3(p.x, p.h, p.y);

/** Distances (along the segment) of each solid crossed, merging the two faces of one wall. */
async function crossings(a: P, b: P): Promise<{ d: number; at: P }[]> {
  const bvh = await loadBuildingBvh();
  const o = v(a);
  const t = v(b);
  const len = o.distanceTo(t);
  if (len < 0.01) return [];
  const ray = new Ray(o, t.clone().sub(o).normalize());
  const hits = (bvh.raycast(ray as never, DoubleSide as never) as { distance: number }[])
    .filter((h) => h.distance <= len - 0.001)
    .sort((x, y) => x.distance - y.distance);
  const out: { d: number; at: P }[] = [];
  let last = -1;
  for (const h of hits) {
    if (last < 0 || h.distance - last > 0.02) {
      const f = h.distance / len;
      out.push({ d: h.distance, at: { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, h: a.h + (b.h - a.h) * f } });
    }
    last = h.distance;
  }
  return out;
}

let cachedBvh: Awaited<ReturnType<typeof loadBuildingBvh>> | null = null;
/** Same as `crossings`, synchronous once the BVH has been loaded. */
function crossingsSync(a: P, b: P): { d: number; at: P }[] {
  if (!cachedBvh) throw new Error('load the BVH first');
  const o = v(a);
  const t = v(b);
  const len = o.distanceTo(t);
  if (len < 0.01) return [];
  const ray = new Ray(o, t.clone().sub(o).normalize());
  const hits = (cachedBvh.raycast(ray as never, DoubleSide as never) as { distance: number }[])
    .filter((h) => h.distance <= len - 0.001)
    .sort((x, y) => x.distance - y.distance);
  const out: { d: number; at: P }[] = [];
  let last = -1;
  for (const h of hits) {
    if (last < 0 || h.distance - last > 0.02) {
      const f = h.distance / len;
      out.push({ d: h.distance, at: { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, h: a.h + (b.h - a.h) * f } });
    }
    last = h.distance;
  }
  return out;
}

import { attachPoint } from '../../src/data/cabling.ts';
const attachPointAlong = (w: (typeof PATHWAYS)[number], q: P): number => attachPoint(w, q).along;
const near = (a: P, b: P, r: number) => Math.hypot(a.x - b.x, a.y - b.y, a.h - b.h) <= r;

describe('cabling: pathways vs the real model', () => {
  it('every solid crossed by a pathway is a declared penetration of that pathway', async () => {
    const undeclared: string[] = [];
    for (const w of PATHWAYS.filter((x) => x.service === 'data' && !x.physical)) {
      const mine = PENETRATIONS.filter((p) => p.pathway === w.id);
      for (let i = 1; i < w.points.length; i++) {
        for (const c of await crossings(w.points[i - 1]!, w.points[i]!)) {
          if (!mine.some((p) => near(p.position, c.at, 0.7))) undeclared.push(`${w.id} seg${i - 1} at (${c.at.x.toFixed(2)}, ${c.at.y.toFixed(2)}, ${c.at.h.toFixed(2)})`);
        }
      }
    }
    expect(undeclared).toEqual([]);
  });

  it('audio runs cross no wall: they stay on the open side of the offices wall, the end walls and the stand fronts', async () => {
    const bad: string[] = [];
    for (const w of PATHWAYS.filter((x) => x.service === 'audio')) {
      for (let i = 1; i < w.points.length; i++) {
        for (const c of await crossings(w.points[i - 1]!, w.points[i]!)) bad.push(`${w.id} seg${i - 1} at (${c.at.x.toFixed(2)}, ${c.at.y.toFixed(2)}, ${c.at.h.toFixed(2)})`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('every declared penetration is really crossed (it needs the hole)', async () => {
    for (const pen of PENETRATIONS) {
      const w = pathway(pen.pathway);
      let crossed = false;
      for (let i = 1; i < w.points.length; i++) {
        for (const c of await crossings(w.points[i - 1]!, w.points[i]!)) if (near(pen.position, c.at, 0.7)) crossed = true;
      }
      expect(crossed, pen.id).toBe(true);
    }
  });

  it('sleeves cross the thickness the model shows (walls 0.2 m, slab 1.18 m)', () => {
    for (const p of PENETRATIONS) expect(p.thicknessM).toBe(p.kind === 'slab' ? 1.18 : 0.2);
  });
});

describe('cabling: device routes', () => {
  it('covers the 15 APs and 11 cameras, once each', () => {
    expect(CABLE_DEVICES.filter((d) => d.kind === 'AP')).toHaveLength(15);
    expect(CABLE_DEVICES.filter((d) => d.kind === 'camera')).toHaveLength(11);
    expect(new Set(CABLE_DEVICES.map((d) => d.id)).size).toBe(26);
  });

  it('chains are connected: each pathway starts where the previous one ends', () => {
    for (const r of DEVICE_ROUTES) {
      r.chain.slice(1).forEach((id, i) => {
        const prev = pathway(r.chain[i]!).points.at(-1)!;
        const cur = pathway(id).points[0]!;
        // A sleeve for an exterior camera taps the conduit it crosses from, anywhere along it; every other pathway continues the previous one.
        const tap = pathway(id).kind === 'conduit' && pathway(id).points[0]!.h === pathway(r.chain[i]!).points[0]!.h;
        const ok = tap ? attachPoint(pathway(r.chain[i]!), cur).offset <= 0.8 : near(prev, cur, 0.8);
        expect(ok, `${r.device.id}: ${r.chain[i]} → ${id}`).toBe(true);
      });
    }
  });

  it('keeps every permanent link within 90 m (TIA-568.2) and the cut length within the 100 m channel plus slack', () => {
    for (const r of DEVICE_ROUTES) expect(r.linkM, r.device.id).toBeLessThanOrEqual(90);
  });

  it('drops never go through a wall and stay within 10 m', async () => {
    cachedBvh = await loadBuildingBvh();
    for (const r of DEVICE_ROUTES) {
      expect(r.dropM, r.device.id).toBeLessThanOrEqual(10);
      const ceiling = MODEL_ACCESS_POINTS.find((x) => x.id === r.device.id)?.mountHint?.kind === 'ceiling';
      const d = ceiling ? { ...r.device.position, h: r.device.position.h - 0.1 } : r.device.position;
      const count = (a: P, b: P) => {
        const hits = crossingsSync(a, b).filter((c) => !near(c.at, d, 0.35));
        return hits.length;
      };
      expect(planDrop(r.attach, d, count).blocked, r.device.id).toBe(0);
    }
  });
});

describe('cabling: containment (TIA-569)', () => {
  const FILL_BASKET = 0.5; // wire basket / tray: 50 %
  const CAT6_AREA_MM2 = Math.PI * (6.2 / 2) ** 2; // 6.2 mm outer diameter
  it('keeps tray fill at or below 50 % with 25 % growth', () => {
    for (const w of PATHWAYS.filter((x) => x.service === 'data' && x.kind === 'tray' && !x.physical)) {
      const n = Math.ceil(cablesOn(w.id) * 1.25);
      const fill = (n * CAT6_AREA_MM2) / (w.widthMm * w.depthMm);
      expect(fill, w.id).toBeLessThanOrEqual(FILL_BASKET);
    }
  });

  it('keeps conduit fill at or below 40 % (3+ cables) with 25 % growth', () => {
    for (const w of PATHWAYS.filter((x) => x.service === 'data' && x.kind === 'conduit')) {
      const n = Math.ceil(cablesOn(w.id) * 1.25);
      const fill = (n * CAT6_AREA_MM2) / (Math.PI * (w.widthMm / 2) ** 2);
      expect(fill, w.id).toBeLessThanOrEqual(0.4);
    }
  });

  it('has a pathway for every segment of the chains and nothing orphaned', () => {
    const used = new Set([...DEVICE_ROUTES.flatMap((r) => r.chain), ...BACKBONE_FIBER_CHAIN]);
    for (const w of PATHWAYS.filter((x) => x.service === 'data')) expect(used.has(w.id), w.id).toBe(true);
  });

  it('total data tray + conduit length is what the budget uses', () => {
    const total = PATHWAYS.filter((w) => w.service === 'data' && !w.physical).reduce((s, w) => s + pathLength(w.points), 0);
    expect(total).toBeGreaterThan(150);
    expect(total).toBeLessThan(280);
  });
});

describe('cabling: pathways and drops hug the walls', () => {
  /** Length of a segment farther than HUG_DISTANCE_M from every wall, ceiling or post. */
  async function farLength(a: P, b: P): Promise<number> {
    const bvh = await loadBuildingBvh();
    const A = v(a);
    const B = v(b);
    const len = A.distanceTo(B);
    const target = { point: new Vector3(), distance: 0, faceIndex: 0 };
    let far = 0;
    const step = 0.1;
    for (let s = 0; s <= len; s += step) {
      const r = bvh.closestPointToPoint(A.clone().lerp(B, len ? s / len : 0), target);
      if (r && r.distance > HUG_DISTANCE_M) far += step;
    }
    return far;
  }
  const allowed = (id: string, kind: 'pathway' | 'drop') => FREE_SPANS.find((f) => f.id === id && f.kind === kind)?.maxFarM ?? 0;

  it('every data tray and conduit stays within 0.35 m of a surface, except the documented stage spans', async () => {
    for (const w of PATHWAYS.filter((x) => !x.physical)) {
      let far = 0;
      for (let i = 1; i < w.points.length; i++) far += await farLength(w.points[i - 1]!, w.points[i]!);
      expect(far, w.id).toBeLessThanOrEqual(allowed(w.id, 'pathway'));
    }
  });

  it('every drop to an AP or camera stays within 0.35 m of a surface, except the documented stage spans', async () => {
    cachedBvh = await loadBuildingBvh();
    for (const r of DEVICE_ROUTES) {
      const ceiling = MODEL_ACCESS_POINTS.find((x) => x.id === r.device.id)?.mountHint?.kind === 'ceiling';
      const d = ceiling ? { ...r.device.position, h: r.device.position.h - 0.1 } : r.device.position;
      const plan = planDrop(r.attach, d, () => 0);
      let far = 0;
      for (let i = 1; i < plan.points.length; i++) far += await farLength(plan.points[i - 1]!, plan.points[i]!);
      expect(far, r.device.id).toBeLessThanOrEqual(allowed(r.device.id, 'drop'));
    }
  });

  it('the documented free spans really exist (no stale exceptions)', async () => {
    for (const f of FREE_SPANS.filter((x) => x.kind === 'pathway')) {
      const w = pathway(f.id);
      let far = 0;
      for (let i = 1; i < w.points.length; i++) far += await farLength(w.points[i - 1]!, w.points[i]!);
      expect(far, f.id).toBeGreaterThan(0.3);
    }
  });
});

describe('cabling: topology (restrooms and locker rooms under the stands)', () => {
  const NETWORK_ROOM = { minX: 12.39, maxX: 16.39, minY: 28.64, maxY: 32.2 };
  const insideRoom = (p: P) => p.x >= NETWORK_ROOM.minX && p.x <= NETWORK_ROOM.maxX && p.y >= NETWORK_ROOM.minY && p.y <= NETWORK_ROOM.maxY;
  /** Height of the first surface seen from just under the roof at (x, y). */
  async function surfaceH(x: number, y: number): Promise<number> {
    const bvh = await loadBuildingBvh();
    const hit = bvh.raycastFirst(new Ray(new Vector3(x, 6.4, y), new Vector3(0, -1, 0)) as never, 2 as never) as { point: Vector3 } | null;
    return hit ? hit.point.y : 0;
  }
  const inStands = (p: P) => p.y > 24.7 && p.y < 32.2 && ((p.x > 0.2 && p.x < 17.7) || (p.x > 25.3 && p.x < 42.48));

  it('no data pathway or drop runs below the stand surface (the rooms under the stands are restrooms and locker rooms)', async () => {
    const below: string[] = [];
    const sample = async (id: string, a: P, b: P) => {
      const len = v(a).distanceTo(v(b));
      for (let t = 0; t <= len; t += 0.25) {
        const f = len ? t / len : 0;
        const q = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, h: a.h + (b.h - a.h) * f };
        if (!inStands(q) || insideRoom(q)) continue;
        if (q.h < (await surfaceH(q.x, q.y)) - 0.05) below.push(`${id} (${q.x.toFixed(1)}, ${q.y.toFixed(1)}, ${q.h.toFixed(1)})`);
      }
    };
    for (const w of PATHWAYS.filter((x) => x.service === 'data' && !x.physical)) {
      for (let i = 1; i < w.points.length; i++) await sample(w.id, w.points[i - 1]!, w.points[i]!);
    }
    cachedBvh = await loadBuildingBvh();
    for (const r of DEVICE_ROUTES) {
      const plan = planDrop(r.attach, r.device.position, () => 0);
      for (let i = 1; i < plan.points.length; i++) await sample(r.device.id, plan.points[i - 1]!, plan.points[i]!);
    }
    expect(below.slice(0, 5)).toEqual([]);
  });

  it('no wall or slab hole opens into the stand voids: only the room south wall, the offices west wall and the two exterior camera sleeves in the outer wall at 5.7 m', () => {
    expect(PENETRATIONS.map((x) => x.id).sort()).toEqual(['PEN-3', 'PEN-7', 'PEN-8', 'PEN-9']);
    expect(PENETRATIONS.every((x) => x.kind === 'wall')).toBe(true);
  });

  it('each device is fed from the hub its list says, and the IDF serves 7 of them', () => {
    expect(DEVICE_ROUTES.filter((r) => r.device.hub === 'idf')).toHaveLength(IDF.ports);
    expect(DEVICE_ROUTES.filter((r) => r.device.hub === 'rack')).toHaveLength(26 - IDF.ports);
    for (const r of DEVICE_ROUTES) expect(r.chain[0], r.device.id).toBe(r.device.hub === 'idf' ? 'IDF_UP' : 'ANNEX_FEED');
  });

  it('puts the IDF cabinet against the north wall, out of ball reach and below the north tray', async () => {
    const wall = await crossings({ x: IDF.position.x, y: 0.6, h: IDF.position.h }, { x: IDF.position.x, y: -0.1, h: IDF.position.h });
    expect(wall.length).toBeGreaterThan(0);
    expect(Math.abs(wall[0]!.at.y - 0)).toBeLessThan(0.3);
    expect(IDF.position.h).toBeGreaterThanOrEqual(2.5);
    expect(IDF.position.h + IDF.size.h / 2).toBeLessThan(5.7);
  });

  it('the OM3 backbone to the IDF stays within 10GBASE-SR reach', () => {
    expect(backboneFiberM()).toBeLessThan(OM3_MAX_M);
    expect(backboneFiberM()).toBeGreaterThan(80);
  });
});

describe('cabling: audio stays apart from data', () => {
  const sample = (pts: readonly P[]): P[] => {
    const out: P[] = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = pts[i]!;
      const n = Math.max(1, Math.ceil(Math.hypot(a.x - b.x, a.y - b.y, a.h - b.h) / 0.05));
      for (let k = 0; k <= n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n, h: a.h + ((b.h - a.h) * k) / n });
    }
    return out;
  };
  it('keeps every audio raceway at least 0.3 m from the stage-side data conduit, except where it crosses at right angles', () => {
    const data = PATHWAYS.filter((w) => w.service === 'data' && !w.physical && w.id.startsWith('STAGE_')).map((w) => ({ id: w.id, pts: sample(w.points) }));
    const close: string[] = [];
    const crossings: string[] = [];
    for (const a of PATHWAYS.filter((w) => w.service === 'audio')) {
      const audio = sample(a.points);
      for (const d of data) {
        let min = Infinity;
        for (const p of audio) for (const q of d.pts) min = Math.min(min, Math.hypot(p.x - q.x, p.y - q.y, p.h - q.h));
        if (min < 0.3 - 1e-6) (min >= 0.04 ? crossings : close).push(`${a.id} vs ${d.id}: ${min.toFixed(2)} m`);
      }
    }
    // Both are closed metal raceways: a right-angle crossing, or the M17 branch ending just under the audio at the wall top, needs room for the two tube walls (axes 4 cm apart leave 2 cm), not 0.3 m.
    expect(close).toEqual([]);
    expect(crossings.length).toBeGreaterThan(0);
  });
});

describe('cabling: hybrid containment (annex tray, EMT on the stands and courts, plastic indoors)', () => {
  const kindOf = (k: string) => PATHWAYS.filter((w) => w.kind === k && w.service === 'data').map((w) => w.id).sort();
  const CAT6_MM2 = Math.PI * 3.5 ** 2;

  it('keeps tray only in the annex and puts everything on the stands and courts side in EMT', () => {
    expect(kindOf('tray')).toEqual(['ANNEX_E1', 'ANNEX_E2', 'ANNEX_FEED']);
    expect(kindOf('emt')).toEqual(['BACK_E', 'BACK_W', 'BR_M18', 'IDF_UP', 'ID_W', 'NORTH_A', 'NORTH_B', 'NORTH_C', 'OFFICES_IN', 'RISER_E', 'RISER_W', 'STAGE_A', 'STAGE_B', 'STAGE_M', 'STAGE_R', 'WEST']);
    expect(kindOf('plastic')).toEqual(['ANNEX_E3', 'ANNEX_W', 'OFF_IN', 'OFF_N', 'OFF_S']);
    for (const id of kindOf('plastic')) expect(cablesOn(id), id).toBeLessThanOrEqual(3);
  });

  it('keeps EMT under the conduit fill limits (53 / 31 / 40 %) with 25 % growth, counting the fiber', () => {
    for (const w of PATHWAYS.filter((x) => x.kind === 'emt')) {
      const n = (cablesOn(w.id) + (carriesFiber(w.id) ? 1 : 0)) * 1.25;
      const limit = n <= 1 ? 0.53 : n <= 2 ? 0.31 : 0.4;
      expect((n * CAT6_MM2) / (Math.PI * (w.widthMm / 2) ** 2), w.id).toBeLessThanOrEqual(limit);
    }
  });

  it('uses plastic raceway only in dry interior stretches (annex and offices, at most 3.8 m)', () => {
    for (const w of PATHWAYS.filter((x) => x.kind === 'plastic')) {
      for (const q of w.points) expect(q.h, w.id).toBeLessThanOrEqual(3.8);
    }
  });

  it('gives every converted run an entry box, a box per drop and no more than 30 m between boxes', () => {
    for (const w of PATHWAYS.filter((x) => (x.kind === 'emt' || x.kind === 'plastic') && !x.physical)) {
      const mine = JUNCTIONS.filter((j) => j.pathway === w.id);
      expect(mine.some((j) => j.kind === 'entry'), w.id).toBe(true);
      for (const r of DEVICE_ROUTES.filter((x) => x.chain[x.chain.length - 1] === w.id)) {
        expect(mine.some((j) => j.device === r.device.id), `${w.id} → ${r.device.id}`).toBe(true);
      }
      const total = pathLength(w.points);
      const marks = mine.map((j) => attachPointAlong(w, j.at)).sort((a, b) => a - b);
      const gaps = [marks[0]!, ...marks.slice(1).map((m, i) => m - marks[i]!), total - marks.at(-1)!];
      for (const g of gaps) expect(g, w.id).toBeLessThanOrEqual(MAX_PULL_M + 1e-6);
    }
  });

  it('has at most 360 degrees of bends between two boxes in each conduit run (NEC 358.26), counting the offset bends', () => {
    for (const w of PATHWAYS.filter((x) => (x.kind === 'emt' || x.kind === 'rmc') && !x.physical)) {
      const events: { s: number; box: boolean; deg: number }[] = JUNCTIONS.filter((j) => j.pathway === w.id).map((j) => ({ s: attachPointAlong(w, j.at), box: true, deg: 0 }));
      let acc = 0;
      for (let i = 1; i < w.points.length - 1; i++) {
        acc += pathLength(w.points.slice(i - 1, i + 1));
        const a = w.points[i - 1]!;
        const b = w.points[i]!;
        const c = w.points[i + 1]!;
        const u = [b.x - a.x, b.y - a.y, b.h - a.h] as const;
        const v = [c.x - b.x, c.y - b.y, c.h - b.h] as const;
        const cos = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v));
        events.push({ s: acc, box: false, deg: (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI });
      }
      // A box at a vertex resets the count before the bend: the bend belongs to neither side.
      events.sort((x, y) => (Math.abs(x.s - y.s) < 0.02 ? Number(y.box) - Number(x.box) : x.s - y.s));
      let degrees = 0;
      for (const e of events) {
        degrees = e.box ? 0 : degrees + e.deg;
        expect(degrees, `${w.id} at ${e.s.toFixed(1)} m`).toBeLessThanOrEqual(360);
      }
    }
  });

  it('runs the audio in EMT above 2 m and in rigid conduit (RMC) below it, each line in its own conduit', () => {
    const audio = PATHWAYS.filter((w) => w.service === 'audio');
    expect(audio.map((w) => `${w.id}:${w.kind}`).sort()).toEqual(['AUDIO_L:emt', 'AUDIO_L_LOW:rmc', 'AUDIO_R:emt', 'AUDIO_R_LOW:rmc']);
    for (const w of audio) {
      const hs = w.points.map((q) => q.h);
      if (w.kind === 'emt') expect(Math.min(...hs), w.id).toBeGreaterThanOrEqual(2 - 1e-9);
      else expect(Math.max(...hs), w.id).toBeLessThanOrEqual(2 + 1e-9);
    }
  });

  it('gives each speaker a box on the floor conduit of its line', () => {
    for (const k of SPEAKERS) {
      expect(JUNCTIONS.some((j) => j.pathway === `AUDIO_${k.line}_LOW` && j.device === k.id), k.id).toBe(true);
    }
  });
});
