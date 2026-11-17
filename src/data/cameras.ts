import type { PlanPoint } from '../domain/coords.ts';

export type CameraKind = 'dome' | 'bullet';

/** Fixed lenses of the VIGI C240I (2.8 / 4 mm) and C340I (2.8 / 4 / 6 mm); angles in degrees. */
export type LensMm = 2.8 | 4 | 6;

export interface LensSpec {
  readonly mm: LensMm;
  readonly hfov: number;
  readonly vfov: number;
  readonly dfov: number;
}

/** Source: TP-Link / Omada VIGI C240I V1 and C340I V1 specification pages (checked 2026-11-16). */
export const LENSES: Record<LensMm, LensSpec> = {
  2.8: { mm: 2.8, hfov: 88.8, vfov: 48.9, dfov: 106.5 },
  4: { mm: 4, hfov: 75.1, vfov: 41.5, dfov: 88.7 },
  6: { mm: 6, hfov: 47.7, vfov: 26.5, dfov: 56 },
};

export interface ModelSpec {
  readonly name: string;
  readonly resolution: string;
  readonly aspect: number;
  readonly fps: number;
  readonly codec: string;
  readonly irRangeM: number;
  readonly protection: string;
  readonly sensor: string;
}

const COMMON = { resolution: '2560×1440', aspect: 2560 / 1440, fps: 30, codec: 'H.265+', sensor: '1/3" CMOS' } as const;

export const MODEL_SPECS: Record<CameraKind, ModelSpec> = {
  dome: { ...COMMON, name: 'VIGI C240I', irRangeM: 30, protection: 'IP67 / IK10' },
  bullet: { ...COMMON, name: 'VIGI C340I', irRangeM: 50, protection: 'IP67' },
};

export interface SecurityCamera {
  readonly id: string;
  readonly kind: CameraKind;
  readonly model: string;
  readonly lens: LensSpec;
  /** Horizontal turn from the wall normal, degrees; + is counter-clockwise on the plan (north up). */
  readonly panDeg: number;
  /** Downward tilt of the aim from horizontal, degrees. */
  readonly tiltDeg: number;
  /** Temporarily taken out (marker, cone, minimap and monitor) to judge whether the camera is needed. */
  readonly hidden: boolean;
  /** Mounting point in plan coordinates (X east, Y south, h up, meters). */
  readonly position: PlanPoint;
  readonly zone: string;
  /** Why this type was chosen, shown in the label tooltip. */
  readonly note?: string;
}

/** Default downward tilt of wall-mounted cameras. */
export const DEFAULT_TILT_DEG = 28;

export const MODEL_BY_KIND: Record<CameraKind, string> = {
  dome: 'TP-Link VIGI C240I',
  bullet: 'TP-Link VIGI C340I',
};

/**
 * Mounting heights (absolute h) chosen per zone from the model floors: courts
 * floor 0, stage floor 1.18, top stand row ~3.8, pasillo roof underside ~3.3.
 * Always >= 2.4 m above the walking surface, out of casual reach.
 */
const H_COURTS = 3.5;
const H_STAGE = 4.0;
const H_OFFICES = 3.0;
const H_STANDS_TOP = 5.5;
const H_PASILLO = 2.8;
/** Exterior corner cameras: out of reach, just under the wall top. */
const H_EXTERIOR = 6.2;

interface CamExtra {
  readonly note?: string;
  readonly panDeg?: number;
  readonly tiltDeg?: number;
  readonly hidden?: boolean;
}

const cam = (
  id: string,
  kind: CameraKind,
  x: number,
  y: number,
  h: number,
  zone: string,
  lensMm: LensMm,
  extra: CamExtra = {},
): SecurityCamera => ({
  id,
  kind,
  model: MODEL_BY_KIND[kind],
  lens: LENSES[lensMm],
  panDeg: extra.panDeg ?? 0,
  tiltDeg: extra.tiltDeg ?? DEFAULT_TILT_DEG,
  hidden: extra.hidden ?? false,
  position: { x, y, h },
  zone,
  note: extra.note,
});

/**
 * Positions come from the blue triangles of the AutoCAD plan (pixels converted
 * with the plan's 32.57 m dimension and the building walls), then snapped to the
 * nearest wall of the 3D model at runtime.
 */
/** Lenses each model is sold with (C240I: 2.8 / 4 mm; C340I: 2.8 / 4 / 6 mm). */
export const LENSES_BY_KIND: Record<CameraKind, readonly LensMm[]> = {
  dome: [2.8, 4],
  bullet: [2.8, 4, 6],
};

export const CAMERAS: readonly SecurityCamera[] = [
  cam('CAM02', 'dome', 0.25, 0.3, H_COURTS, 'Courts - NW corner', 4, { panDeg: -35, tiltDeg: 14 }),
  cam('CAM04', 'dome', 54.4, 0.25, H_STAGE, 'Stage - NE corner', 2.8, { panDeg: 33, tiltDeg: 41 }),
  cam('CAM05', 'dome', 54.15, 24.8, H_STAGE, 'Stage - SE corner', 2.8, { panDeg: -29, tiltDeg: 36 }),
  cam('CAM07', 'dome', 42.7, 30.7, H_OFFICES, 'Offices - west side', 2.8, { panDeg: 44, tiltDeg: 32 }),
  cam('CAM10', 'dome', 0.2, 32.2, H_STANDS_TOP, 'Stands - west end', 4, { panDeg: -36, tiltDeg: 13 }),
  cam('CAM11', 'bullet', 4.8, 32.55, H_PASILLO, 'Pasillo - NW', 4, { panDeg: -25, tiltDeg: 18 }),
  cam('CAM12', 'bullet', 37.4, 32.7, H_PASILLO, 'Pasillo - NE', 4, { panDeg: -57, tiltDeg: 23 }),
  // Watches the audio mixer (47.6, 24.2, about 2.05 m): stage face of the offices wall at its east end, next to CAM05 (which is on the offices face).
  cam('CAM15', 'dome', 54.0, 24.45, H_STAGE, 'Stage - audio mixer', 4, { panDeg: 62, tiltDeg: 29, note: 'Looks at the audio mixer on the operator table' }),
  // Inside the network room (X 12.44-16.44, Y 28.64-32.2): east wall by the door corner, looking at the rack front and the work area.
  cam('CAM16', 'dome', 16.38, 31.6, 2.05, 'Network room', 2.8, { panDeg: -37, tiltDeg: 31, note: 'Shows what is done inside the network room' }),
  // Exterior, at the top of the west corners (outside face of the wall, 0.7 m under the wall top at 6.9 m): they watch the west and south facades.
  cam('CAM17', 'dome', -0.25, 0.8, H_EXTERIOR, 'Exterior - NW corner', 2.8, { panDeg: 45, tiltDeg: 25, note: 'Exterior camera on the west wall' }),
  cam('CAM18', 'dome', 1.0, 32.45, H_EXTERIOR, 'Exterior - SW corner', 2.8, { panDeg: 45, tiltDeg: 25, note: 'Exterior camera on the south wall' }),
];

/*
 * Removed on 2026-11-16 after evaluating whether they were needed (ids are not
 * renumbered). Positions are plan meters (X, Y, h), kept to restore them:
 *   CAM01 dome   2.8 mm (-0.4, 0.1, 3.0)   West exterior door D08, pan 68, tilt 12
 *   CAM03 dome   4 mm   (21.6, 0.5, 3.5)   Courts north wall, pan -8, tilt 1
 *   CAM06 dome   2.8 mm (51.8, 25.3, 3.0)  Offices entrance D07/D08
 *   CAM08 dome   2.8 mm (49.9, 30.75, 3.0) Offices south side
 *   CAM09 dome   4 mm   (42.0, 32.2, 5.5)  Stands east end, pan 39, tilt 14
 *   CAM13 bullet 4 mm   (4.85, 36.2, 2.8)  Pasillo SW (D05)
 *   CAM14 dome   2.8 mm (37.3, 36.2, 2.8)  Pasillo SE (D05), pan 36, tilt 17
 */
