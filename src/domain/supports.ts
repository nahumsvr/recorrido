import type { PlanPoint } from './coords.ts';

/** Unit direction in plan space (X east, Y south, h up). */
export interface Dir {
  readonly x: number;
  readonly y: number;
  readonly h: number;
}

/** First solid met from `origin` along `dir`: distance to it and its thickness (distance to the next face). */
export interface ProbeHit {
  readonly distance: number;
  readonly thickness: number;
}
export type Probe = (origin: PlanPoint, dir: Dir) => ProbeHit | null;

export type AnchorKind = 'wall' | 'ceiling' | 'floor' | 'none';
/** `ok`: solid surface. `thin`: surface under MIN_SOLID_M, anchoring to be confirmed. `none`: nothing within reach. */
export type AnchorStatus = 'ok' | 'thin' | 'none';

export interface Support {
  /** Point on the pathway that the support carries. */
  readonly at: PlanPoint;
  readonly kind: AnchorKind;
  readonly status: AnchorStatus;
  /** Where the arm or rod meets the surface (equals `at` when there is none). */
  readonly anchor: PlanPoint;
  /** Unit direction from `at` toward the surface. */
  readonly dir: Dir;
  /** Unit direction of the run at `at`; set on conduit straps, which wrap the tube across it. */
  readonly run?: Dir;
}

/** Largest span between supports of a wire-basket tray (manufacturer tables start at 1.5 m). */
export const TRAY_SPACING_M = 1.5;
/** Fixings of the 30 mm audio raceway. */
export const RACEWAY_SPACING_M = 1.0;
/** EMT and RMC: a support every 3 m at most and within 0.9 m of each box (NEC 358.30 and 344.30, secondary sources). */
export const EMT_SPACING_M = 3.0;
/** Plastic surface raceway: fixings about every 0.6 m (manufacturer tables vary). */
export const PLASTIC_SPACING_M = 0.6;

/** Largest span between supports for a pathway kind. */
export function spacingFor(kind: string): number {
  if (kind === 'tray') return TRAY_SPACING_M;
  if (kind === 'emt' || kind === 'rmc') return EMT_SPACING_M;
  if (kind === 'plastic') return PLASTIC_SPACING_M;
  return RACEWAY_SPACING_M;
}
/** Longest bracket arm or hanger rod. */
export const SUPPORT_REACH_M = 0.4;
/** Thinner than this, a surface is not trusted to carry anchors until the site survey says so. */
export const MIN_SOLID_M = 0.1;

const DIRS: readonly { dir: Dir; kind: AnchorKind }[] = [
  { dir: { x: -1, y: 0, h: 0 }, kind: 'wall' },
  { dir: { x: 1, y: 0, h: 0 }, kind: 'wall' },
  { dir: { x: 0, y: -1, h: 0 }, kind: 'wall' },
  { dir: { x: 0, y: 1, h: 0 }, kind: 'wall' },
  { dir: { x: 0, y: 0, h: 1 }, kind: 'ceiling' },
  { dir: { x: 0, y: 0, h: -1 }, kind: 'floor' },
];
/** Toward an outside wall corner: a bracket at a bend in a run holds on to the corner of the wall it wraps around. */
const D = Math.SQRT1_2;
const CORNER_DIRS: readonly { dir: Dir; kind: AnchorKind }[] = [
  { dir: { x: D, y: D, h: 0 }, kind: 'wall' },
  { dir: { x: D, y: -D, h: 0 }, kind: 'wall' },
  { dir: { x: -D, y: D, h: 0 }, kind: 'wall' },
  { dir: { x: -D, y: -D, h: 0 }, kind: 'wall' },
];

const lerp = (a: PlanPoint, b: PlanPoint, f: number): PlanPoint => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, h: a.h + (b.h - a.h) * f });

/**
 * Anchor for one point of a run heading along `run` (a unit vector). Along the run nothing can hold a
 * point, except at an end: a tray that stops at a wall (through its sleeve) is held by that wall.
 */
export function anchorAt(at: PlanPoint, run: Dir, probe: Probe, atEnd = false, reachM = SUPPORT_REACH_M): Support {
  let best: { s: Support; solid: boolean; d: number } | null = null;
  for (const { dir, kind } of atEnd ? [...DIRS, ...CORNER_DIRS] : DIRS) {
    if (!atEnd && Math.abs(dir.x * run.x + dir.y * run.y + dir.h * run.h) > 0.7) continue;
    const hit = probe(at, dir);
    if (!hit || hit.distance > reachM) continue;
    const solid = hit.thickness >= MIN_SOLID_M;
    if (best && (best.solid && !solid ? true : best.solid === solid && best.d <= hit.distance)) continue;
    best = {
      solid,
      d: hit.distance,
      s: {
        at,
        kind,
        status: solid ? 'ok' : 'thin',
        anchor: { x: at.x + dir.x * hit.distance, y: at.y + dir.y * hit.distance, h: at.h + dir.h * hit.distance },
        dir,
      },
    };
  }
  return best?.s ?? { at, kind: 'none', status: 'none', anchor: at, dir: { x: 0, y: 0, h: 0 } };
}

/** Supports along a polyline, at most `spacingM` apart, with one at every end. */
export function planSupports(points: readonly PlanPoint[], probe: Probe, spacingM = TRAY_SPACING_M): Support[] {
  const out: Support[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y, b.h - a.h);
    if (len < 0.01) continue;
    const run = { x: (b.x - a.x) / len, y: (b.y - a.y) / len, h: (b.h - a.h) / len };
    const n = Math.max(1, Math.ceil(len / spacingM));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) out.push(anchorAt(lerp(a, b, k / n), run, probe, k === 0 || k === n));
  }
  return out;
}

export interface SupportStats {
  readonly total: number;
  readonly thin: number;
  readonly none: number;
}

export function tally(supports: readonly Support[]): SupportStats {
  return {
    total: supports.length,
    thin: supports.filter((s) => s.status === 'thin').length,
    none: supports.filter((s) => s.status === 'none').length,
  };
}

/** A conduit strap wraps a tube that already lies on the wall, so it only reaches a few centimeters. */
export const STRAP_REACH_M = 0.12;
/** NEC 358.30: a support within 0.9 m of every box or termination. Straps go a third of that from each one. */
export const STRAP_FROM_BOX_M = 0.3;
export const EMT_BOX_REACH_M = 0.9;
/** Straps closer than this are one strap. */
const MIN_STRAP_GAP_M = 0.15;

/**
 * Distances along an EMT run where straps go: `STRAP_FROM_BOX_M` on each side of every box or termination
 * (`boxes` are distances along the run, ends included), then more wherever two neighbours are more than
 * `spacingM` apart. Nothing else is needed: the code asks for a support at the boxes and every 3 m.
 */
export function strapStations(length: number, boxes: readonly number[], spacingM = EMT_SPACING_M): number[] {
  const wanted: number[] = [];
  for (const b of boxes) for (const d of [b - STRAP_FROM_BOX_M, b + STRAP_FROM_BOX_M]) if (d > 0.001 && d < length - 0.001) wanted.push(d);
  if (wanted.length === 0) wanted.push(length / 2);
  wanted.sort((a, b) => a - b);
  const merged: number[] = [];
  for (const d of wanted) {
    const last = merged[merged.length - 1];
    if (last !== undefined && d - last < MIN_STRAP_GAP_M) merged[merged.length - 1] = (last + d) / 2;
    else merged.push(d);
  }
  const out: number[] = [];
  merged.forEach((d, i) => {
    out.push(d);
    const next = merged[i + 1];
    if (next === undefined) return;
    const extra = Math.ceil((next - d) / spacingM) - 1;
    for (let k = 1; k <= extra; k++) out.push(d + ((next - d) * k) / (extra + 1));
  });
  return out;
}

/** Point and direction of a polyline at distance `s` from its start. */
function alongPolyline(points: readonly PlanPoint[], s: number): { at: PlanPoint; run: Dir } {
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y, b.h - a.h);
    if (len < 0.01) continue;
    if (s <= acc + len || i === points.length - 1) {
      const f = Math.min(1, Math.max(0, (s - acc) / len));
      return { at: lerp(a, b, f), run: { x: (b.x - a.x) / len, y: (b.y - a.y) / len, h: (b.h - a.h) / len } };
    }
    acc += len;
  }
  return { at: points[0]!, run: { x: 1, y: 0, h: 0 } };
}

/** Straps of an EMT run: see `strapStations`; each one is anchored to the wall the tube lies on. */
export function planStraps(points: readonly PlanPoint[], boxesAlong: readonly number[], probe: Probe): Support[] {
  const length = points.slice(1).reduce((sum, q, i) => sum + Math.hypot(q.x - points[i]!.x, q.y - points[i]!.y, q.h - points[i]!.h), 0);
  return strapStations(length, boxesAlong).map((s) => {
    const { at, run } = alongPolyline(points, s);
    return { ...anchorAt(at, run, probe, false, STRAP_REACH_M), run };
  });
}
