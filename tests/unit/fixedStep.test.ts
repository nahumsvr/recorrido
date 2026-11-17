import { describe, expect, it } from 'vitest';
import { FixedStep } from '../../src/player/fixedStep.ts';

describe('FixedStep', () => {
  it('runs one step per period and carries the remainder', () => {
    const f = new FixedStep(1 / 120);
    expect(f.advance(1 / 60)).toBe(2);
    expect(f.advance(1 / 240)).toBe(0);
    expect(f.advance(1 / 240)).toBe(1);
  });

  it('clamps long frames so a hidden tab does not simulate seconds at once', () => {
    const f = new FixedStep(1 / 120, 0.1);
    expect(f.advance(5)).toBe(12);
  });

  it('ignores negative frame times', () => {
    expect(new FixedStep(1 / 120).advance(-1)).toBe(0);
  });
});
