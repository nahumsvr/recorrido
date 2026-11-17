import { describe, expect, it } from 'vitest';
import { joystickVector } from '../../src/input/joystick.ts';

describe('joystickVector', () => {
  it('maps drag up to forward and drag right to strafe right', () => {
    expect(joystickVector(0, -50, 50).forward).toBeCloseTo(1);
    expect(joystickVector(50, 0, 50).right).toBeCloseTo(1);
  });

  it('ignores small movements inside the dead zone', () => {
    expect(joystickVector(3, -3, 50)).toEqual({ forward: 0, right: 0, magnitude: 0 });
  });

  it('clamps beyond the radius to magnitude 1 keeping direction', () => {
    const v = joystickVector(300, -300, 50);
    expect(v.magnitude).toBeCloseTo(1);
    expect(v.forward).toBeCloseTo(Math.SQRT1_2);
    expect(v.right).toBeCloseTo(Math.SQRT1_2);
  });

  it('rescales after the dead zone so speed starts from zero', () => {
    const v = joystickVector(0, -25, 50, 0.1);
    expect(v.magnitude).toBeCloseTo((0.5 - 0.1) / 0.9);
  });
});
