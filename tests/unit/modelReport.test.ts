import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LAYOUT } from '../../src/config/alignment.ts';

/** Produced by `npm run prepare-model`. Guards alignment and model weight. */
const report = JSON.parse(readFileSync('src/assets/model-report.json', 'utf8')) as {
  buildingTriangles: number;
  propsTrianglesAfter: number;
  glbBytes: number;
  stageEdgeX: number;
  wallPlanes: Record<string, number>;
  apWallDistance: Record<string, number | null>;
};

/**
 * APs whose table coordinates are not next to a wall in the model (2026-11-16).
 * Pending confirmation of the real mounting spot; remove from this list once fixed.
 */
const KNOWN_UNMOUNTED = ['AP06', 'AP07', 'AP14'];

function hasWallPlane(axis: 'X' | 'Y', value: number, tolerance = 0.15): boolean {
  return Object.keys(report.wallPlanes).some((key) => {
    const [a, v] = key.split('=');
    return a === axis && Math.abs(Number(v) - value) <= tolerance;
  });
}

describe('prepared model', () => {
  it('places the interior north-west corner of the courts at the plan origin', () => {
    expect(hasWallPlane('X', 0)).toBe(true);
    expect(hasWallPlane('Y', 0)).toBe(true);
  });

  it('places the stands front at Y = courtDepth and the inner east wall at X = 54.6', () => {
    expect(hasWallPlane('Y', LAYOUT.courtDepth)).toBe(true);
    expect(hasWallPlane('X', LAYOUT.buildingWidth - 0.4)).toBe(true);
  });

  it('places the stage edge near X = courtWidth (model is 0.17 m short of the plan)', () => {
    expect(Math.abs(report.stageEdgeX - LAYOUT.courtWidth)).toBeLessThanOrEqual(0.25);
  });

  it('mounts every AP within 0.6 m of a wall, except the known unmounted ones', () => {
    const far = Object.entries(report.apWallDistance)
      .filter(([, d]) => d === null || d > 0.6)
      .map(([id]) => id);
    expect(far).toEqual(KNOWN_UNMOUNTED);
  });

  it('keeps 15 of the 19 devices in the SketchUp model as APs, each on a wall or ceiling', () => {
    const modelAps = JSON.parse(readFileSync('src/assets/model-aps.json', 'utf8')) as { id: string; mount: string | null }[];
    const all = Array.from({ length: 19 }, (_, i) => `M${String(i + 1).padStart(2, '0')}`);
    // M05, M08, M11 and M19 were removed by the user; the rest keep their numbers.
    expect(modelAps.map((a) => a.id)).toEqual(all.filter((id) => !['M05', 'M08', 'M11', 'M19'].includes(id)));
    expect(modelAps.filter((a) => a.mount === null)).toEqual([]);
  });

  it('keeps the model light enough for mobile', () => {
    expect(report.buildingTriangles).toBeLessThan(40_000);
    expect(report.propsTrianglesAfter).toBeLessThan(20_000);
    expect(report.glbBytes).toBeLessThan(1_500_000);
  });
});
