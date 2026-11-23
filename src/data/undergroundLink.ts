import type { PlanPoint } from '../domain/coords.ts';

/**
 * Internet access of the auditorium: the white neighboring building is the provider's handoff point. From it a
 * dielectric single-mode fiber (OS2, 12 strands) runs underground in a buried HDPE duct to the network room, rises
 * on the annex side of the south wall in rigid conduit, crosses the wall through a sleeve and ends in an ODF box,
 * patched to the router WAN port.
 *
 * Why fiber, and why in a duct: it carries no metal, so it brings no ground potential or lightning surge between the
 * two buildings, and a duct lets the cable be pulled or replaced without digging. Burial depth, duct type and the
 * transceiver type are assumptions to confirm in the site survey and with the provider.
 */
const p = (x: number, y: number, h: number): PlanPoint => ({ x, y, h });

/** Line the link follows (X): between the annex feed sleeve (12.9) and the network room door (14.42). */
export const ISP_X = 13.7;
/** North face of the white building (the model's south bound, Y 36.6, plus the 5 m gap): where the duct leaves it. A test keeps it equal to the placed block. */
export const ISP_SOURCE_Y = 41.6;
/** Burial depth of the duct, meters (landscaped and pedestrian ground, not a driveway). */
export const ISP_DEPTH_M = 0.6;
/** HDPE duct 2": outer diameter 63 mm. */
export const ISP_DUCT = { id: 'UG_ISP', trade: '2"', outerMm: 63, label: 'Fiber OS2 duct, white building to the network room' } as const;
/** The rigid riser hugs the annex face of the network room south wall (wall faces Y 32.2 and 32.4). */
export const ISP_RISER_Y = 32.43;
/** Height where the fiber crosses the wall, and where the ODF sits inside. */
export const ISP_ENTRY_H = 1.9;
/** Top of the floor slab: where the duct ends and the riser's base box sits. */
export const ISP_FLOOR_H = 0.05;
/** Fiber distribution box on the inner face of the wall (inner face Y 32.2), beside the rack. */
export const ISP_ODF = { id: 'ODF-ISP', position: p(ISP_X, 32.15, ISP_ENTRY_H), size: { w: 0.3, h: 0.2, d: 0.1 } } as const;

/** Duct axis: out of the neighbor's north face at depth, north to the wall, then up to the slab where the riser starts. */
export const ispDuctPoints = (neighborFaceY: number): readonly PlanPoint[] => [
  p(ISP_X, neighborFaceY, -ISP_DEPTH_M),
  p(ISP_X, ISP_RISER_Y, -ISP_DEPTH_M),
  p(ISP_X, ISP_RISER_Y, ISP_FLOOR_H),
];

export const ispDuctLengthM = (neighborFaceY: number): number => {
  const pts = ispDuctPoints(neighborFaceY);
  return pts.slice(1).reduce((s, q, i) => s + Math.hypot(q.x - pts[i]!.x, q.y - pts[i]!.y, q.h - pts[i]!.h), 0);
};
