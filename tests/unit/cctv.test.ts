import { describe, expect, it } from 'vitest';
import { formatTimestamp, letterbox, verticalFov } from '../../src/cameras/cctvMath.ts';
import { CAMERAS, LENSES, MODEL_SPECS } from '../../src/data/cameras.ts';

describe('letterbox', () => {
  it('pillarboxes a window wider than the stream', () => {
    const r = letterbox(2000, 900, 16 / 9);
    expect(r.height).toBe(900);
    expect(r.width).toBeCloseTo(1600);
    expect(r.left).toBeCloseTo(200);
    expect(r.top).toBe(0);
  });

  it('letterboxes a window narrower than the stream', () => {
    const r = letterbox(800, 800, 16 / 9);
    expect(r.width).toBe(800);
    expect(r.height).toBeCloseTo(450);
    expect(r.top).toBeCloseTo(175);
  });
});

describe('verticalFov', () => {
  it('keeps the horizontal FOV of a 16:9 image', () => {
    const v = verticalFov(75.1, 16 / 9);
    const back = 2 * Math.atan(Math.tan((v * Math.PI) / 360) * (16 / 9)) * (180 / Math.PI);
    expect(back).toBeCloseTo(75.1, 4);
  });

  it('is narrower than the horizontal FOV', () => {
    expect(verticalFov(88.8, 16 / 9)).toBeLessThan(88.8);
  });
});

describe('formatTimestamp', () => {
  it('prints date, weekday and 24 h time', () => {
    expect(formatTimestamp(new Date(2026, 10, 16, 8, 5, 9))).toBe('2026-11-16 MON 08:05:09');
  });
});

describe('camera specs', () => {
  it('uses datasheet lens angles', () => {
    expect(LENSES[2.8].hfov).toBe(88.8);
    expect(LENSES[4].hfov).toBe(75.1);
    expect(LENSES[6].hfov).toBe(47.7);
  });

  it('never assigns a lens the model does not offer (C240I has no 6 mm)', () => {
    for (const c of CAMERAS.filter((x) => x.kind === 'dome')) expect([2.8, 4]).toContain(c.lens.mm);
  });

  it('keeps the model IR ranges of the datasheets', () => {
    expect(MODEL_SPECS.dome.irRangeM).toBe(30);
    expect(MODEL_SPECS.bullet.irRangeM).toBe(50);
  });
});
