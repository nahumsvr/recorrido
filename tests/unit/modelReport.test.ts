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
};

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

  it('keeps the model light enough for mobile', () => {
    expect(report.buildingTriangles).toBeLessThan(40_000);
    expect(report.propsTrianglesAfter).toBeLessThan(20_000);
    expect(report.glbBytes).toBeLessThan(1_500_000);
  });
});
