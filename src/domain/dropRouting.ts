import type { PlanPoint } from './coords.ts';

type Axis = 'h' | 'x' | 'y';
/** Axis orders tried for an axis-aligned conduit drop, in order of preference. */
const ORDERS: readonly (readonly Axis[])[] = [
  ['h', 'x', 'y'],
  ['h', 'y', 'x'],
  ['x', 'y', 'h'],
  ['y', 'x', 'h'],
  ['x', 'h', 'y'],
  ['y', 'h', 'x'],
];

export interface DropPlan {
  readonly points: readonly PlanPoint[];
  /** Solid crossings left on the best order (0 = clear). */
  readonly blocked: number;
}

/**
 * Axis-aligned conduit from `from` (on the tray) to `to` (the device). Picks the
 * first axis order that crosses no solid; `crossings(a, b)` counts the solids
 * between two points (the caller decides what to ignore near the device).
 */
export function planDrop(from: PlanPoint, to: PlanPoint, crossings: (a: PlanPoint, b: PlanPoint) => number): DropPlan {
  let best: DropPlan | null = null;
  for (const order of ORDERS) {
    const pts: PlanPoint[] = [from];
    let cur = from;
    let blocked = 0;
    for (const axis of order) {
      const next: PlanPoint = { ...cur, [axis]: to[axis] };
      if (next.x === cur.x && next.y === cur.y && next.h === cur.h) continue;
      blocked += crossings(cur, next);
      pts.push(next);
      cur = next;
    }
    if (!best || blocked < best.blocked) best = { points: pts, blocked };
    if (blocked === 0) break;
  }
  return best!;
}
