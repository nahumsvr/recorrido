export interface JoystickVector {
  /** -1..1, positive when the knob is pushed up. */
  readonly forward: number;
  /** -1..1, positive when the knob is pushed right. */
  readonly right: number;
  /** 0..1 after dead zone rescaling. */
  readonly magnitude: number;
}

/**
 * Converts a knob offset (screen pixels, y down) into movement intent.
 * Offsets beyond `radius` are clamped; the dead zone is removed and the rest
 * rescaled so movement starts smoothly from zero.
 */
export function joystickVector(dx: number, dy: number, radius: number, deadZone = 0.12): JoystickVector {
  const len = Math.hypot(dx, dy);
  const raw = Math.min(len / radius, 1);
  if (raw <= deadZone || len === 0) return { forward: 0, right: 0, magnitude: 0 };
  const magnitude = (raw - deadZone) / (1 - deadZone);
  return { forward: (-dy / len) * magnitude, right: (dx / len) * magnitude, magnitude };
}
