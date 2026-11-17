/** Plan-space rectangle shown by the minimap (north up, east right). */
export interface MapBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

/** Plan (X east, Y south) → minimap pixels (u right, v down). */
export function planToMinimap(x: number, y: number, b: MapBounds, width: number, height: number): { u: number; v: number } {
  return {
    u: ((x - b.minX) / (b.maxX - b.minX)) * width,
    v: ((y - b.minY) / (b.maxY - b.minY)) * height,
  };
}

/**
 * Unit view direction on the minimap for a three.js yaw (0 looks north = up,
 * -π/2 looks east = right). Returned as (du, dv) in canvas axes.
 */
export function headingVector(yaw: number): { du: number; dv: number } {
  return { du: -Math.sin(yaw), dv: -Math.cos(yaw) };
}
