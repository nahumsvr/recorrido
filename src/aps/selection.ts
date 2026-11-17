import type { Vector3 } from 'three';
import type { AccessPoint } from '../data/aps.ts';

export interface ApWithPosition {
  readonly ap: AccessPoint;
  /** Marker position in world space. */
  readonly position: Vector3;
}

/** Nearest AP to `eye` within `radius` meters, or null. */
export function nearestAp<T extends ApWithPosition>(items: readonly T[], eye: Vector3, radius: number): T | null {
  let best: T | null = null;
  let bestD = radius;
  for (const item of items) {
    const d = item.position.distanceTo(eye);
    if (d <= bestD) {
      best = item;
      bestD = d;
    }
  }
  return best;
}

export interface PanelState {
  /** AP chosen by click/tap/E; stays until cleared. */
  readonly pinned: string | null;
  /** AP shown automatically because the player is close. */
  readonly nearby: string | null;
}

/** Which AP the info panel shows: a pinned choice wins over proximity. */
export function panelApId(state: PanelState): string | null {
  return state.pinned ?? state.nearby;
}
