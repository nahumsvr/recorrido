/**
 * Small workstation in the network room, against the east wall (inner face
 * X 16.44), 1.1 m from the rack side. The user sits on the west side, facing
 * the wall; the monitor faces west into the room.
 */
export const DESK_PLACEMENT = {
  /** Footprint center, plan coordinates (X east, Y south). */
  center: { x: 16.1, y: 30.5 },
  /** Along the wall (plan Y). */
  length: 1.2,
  /** Away from the wall (plan X). */
  depth: 0.6,
  topHeight: 0.74,
} as const;
