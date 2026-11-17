import { DoubleSide, Ray, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { MODEL_ACCESS_POINTS } from '../../src/data/modelAps.ts';
import { CABLE_DEVICES, DEVICE_ROUTES, FREE_SPANS, HUG_DISTANCE_M, PATHWAYS, PENETRATIONS, cablesOn, pathLength, pathway } from '../../src/data/cabling.ts';
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

const near = (a: P, b: P, r: number) => Math.hypot(a.x - b.x, a.y - b.y, a.h - b.h) <= r;

describe('cabling: pathways vs the real model', () => {
  it('every solid crossed by a pathway is a declared penetration of that pathway', async () => {
    const undeclared: string[] = [];
    for (const w of PATHWAYS.filter((x) => x.service === 'data')) {
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
    for (const pen of PENETRATIONS.filter((x) => !['M12'].includes(x.pathway))) {
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
  it('covers the 15 APs and 7 cameras, once each', () => {
    expect(CABLE_DEVICES.filter((d) => d.kind === 'AP')).toHaveLength(15);
    expect(CABLE_DEVICES.filter((d) => d.kind === 'camera')).toHaveLength(7);
    expect(new Set(CABLE_DEVICES.map((d) => d.id)).size).toBe(22);
  });

  it('chains are connected: each pathway starts where the previous one ends', () => {
    for (const r of DEVICE_ROUTES) {
      r.chain.slice(1).forEach((id, i) => {
        const prev = pathway(r.chain[i]!).points.at(-1)!;
        const cur = pathway(id).points[0]!;
        expect(near(prev, cur, 0.8), `${r.device.id}: ${r.chain[i]} → ${id}`).toBe(true);
      });
    }
  });

  it('keeps every permanent link within 90 m (TIA-568.2) and the cut length within the 100 m channel plus slack', () => {
    for (const r of DEVICE_ROUTES) expect(r.linkM, r.device.id).toBeLessThanOrEqual(90);
  });

  it('drops never go through a wall (except the declared M12 sleeve) and stay within 10 m', async () => {
    cachedBvh = await loadBuildingBvh();
    const m12 = PENETRATIONS.find((x) => x.pathway === 'M12')!.position;
    for (const r of DEVICE_ROUTES) {
      expect(r.dropM, r.device.id).toBeLessThanOrEqual(10);
      const ceiling = MODEL_ACCESS_POINTS.find((x) => x.id === r.device.id)?.mountHint?.kind === 'ceiling';
      const d = ceiling ? { ...r.device.position, h: r.device.position.h - 0.1 } : r.device.position;
      const count = (a: P, b: P) => {
        const hits = crossingsSync(a, b).filter((c) => !near(c.at, d, 0.35) && !(r.device.id === 'M12' && near(c.at, m12, 0.7)));
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
    for (const w of PATHWAYS.filter((x) => x.service === 'data' && x.kind === 'tray')) {
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
    const used = new Set(DEVICE_ROUTES.flatMap((r) => r.chain));
    for (const w of PATHWAYS.filter((x) => x.service === 'data')) expect(used.has(w.id), w.id).toBe(true);
  });

  it('total data tray + conduit length is what the budget uses', () => {
    const total = PATHWAYS.filter((w) => w.service === 'data').reduce((s, w) => s + pathLength(w.points), 0);
    expect(total).toBeGreaterThan(150);
    expect(total).toBeLessThan(260);
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
    for (const w of PATHWAYS) {
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
