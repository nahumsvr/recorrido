export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Largest rectangle with the stream aspect centered in the window (letterbox/pillarbox). */
export function letterbox(windowW: number, windowH: number, aspect: number): Rect {
  let width = windowW;
  let height = windowW / aspect;
  if (height > windowH) {
    height = windowH;
    width = windowH * aspect;
  }
  return { left: (windowW - width) / 2, top: (windowH - height) / 2, width, height };
}

/**
 * Vertical field of view (degrees) of a rectilinear image with the given
 * horizontal FOV and aspect ratio. The horizontal angle is the one the
 * datasheet quotes for coverage, so it is the one preserved.
 */
export function verticalFov(hfovDeg: number, aspect: number): number {
  const half = Math.atan(Math.tan((hfovDeg * Math.PI) / 360) / aspect);
  return (half * 360) / Math.PI;
}

const pad = (n: number): string => String(n).padStart(2, '0');
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/** On-screen display timestamp, e.g. `2026-11-16 MON 20:45:12`. */
export function formatTimestamp(d: Date): string {
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `${date} ${WEEKDAYS[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
