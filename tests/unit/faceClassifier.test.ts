import { describe, expect, it } from 'vitest';
import { classifyFace } from '../../src/domain/faceClassifier.ts';
import { LAYOUT } from '../../src/config/alignment.ts';

const up: [number, number, number] = [0, 1, 0];
const down: [number, number, number] = [0, -1, 0];

describe('classifyFace', () => {
  it('detects the court floor inside the court rectangle at ground level', () => {
    expect(classifyFace(up, [20, 0, 10], LAYOUT)).toBe('courtFloor');
  });

  it('detects ground floor outside the courts', () => {
    expect(classifyFace(up, [50, 0, 30], LAYOUT)).toBe('floor');
  });

  it('detects the stage top', () => {
    expect(classifyFace(up, [50, 1.2, 15], LAYOUT)).toBe('stage');
  });

  it('detects stand steps south of the courts', () => {
    expect(classifyFace(up, [20, 1.3, 26], LAYOUT)).toBe('stands');
  });

  it('classifies walls by orientation regardless of normal sign', () => {
    expect(classifyFace([1, 0, 0], [0, 3, 10], LAYOUT)).toBe('wallNS');
    expect(classifyFace([-1, 0, 0], [0, 3, 10], LAYOUT)).toBe('wallNS');
    expect(classifyFace([0, 0, -1], [10, 3, 0], LAYOUT)).toBe('wallEW');
  });

  it('detects ceilings (downward faces) and roof (above roof start)', () => {
    expect(classifyFace(down, [10, 3.3, 28], LAYOUT)).toBe('ceiling');
    expect(classifyFace(down, [10, 8, 10], LAYOUT)).toBe('roof');
    expect(classifyFace([1, 0, 0], [10, 7.5, 10], LAYOUT)).toBe('roof');
  });

  it('falls back to platform for other raised floors', () => {
    expect(classifyFace(up, [47, 3.9, 28], LAYOUT)).toBe('platform');
  });
});
