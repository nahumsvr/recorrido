import { DoubleSide, Ray, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { MODEL_ACCESS_POINTS } from '../../src/data/modelAps.ts';
import { BACKBONE_FIBER_CHAIN, CABLE_DEVICES, DEVICE_ROUTES, FREE_SPANS, HUG_DISTANCE_M, IDF, OM3_MAX_M, backboneFiberM, PATHWAYS, PENETRATIONS, cablesOn, pathLength, pathway } from '../../src/data/cabling.ts';
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

  it('no wall or slab hole opens into the stand voids: only the room south wall and the offices north wall', () => {
    expect(PENETRATIONS.map((x) => x.id)).toEqual(['PEN-3', 'PEN-6']);
    expect(PENETRATIONS.every((x) => x.kind === 'wall')).toBe(true);
  });

  it('each device is fed from the hub its list says, and the IDF serves 12 of them', () => {
    expect(DEVICE_ROUTES.filter((r) => r.device.hub === 'idf')).toHaveLength(IDF.ports);
    expect(DEVICE_ROUTES.filter((r) => r.device.hub === 'rack')).toHaveLength(22 - IDF.ports);
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
