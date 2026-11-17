import {
  LENSES,
  LENSES_BY_KIND,
  MODEL_BY_KIND,
  type CameraKind,
  type LensMm,
  type SecurityCamera,
} from '../data/cameras.ts';

/** Editable part of a camera: what the user moves in the editor. */
export interface CameraOverride {
  readonly kind: CameraKind;
  readonly lensMm: LensMm;
  readonly x: number;
  readonly y: number;
  readonly h: number;
  readonly panDeg: number;
  readonly tiltDeg: number;
  /** Only present when true. */
  readonly hidden?: boolean;
}

export type OverrideMap = Record<string, CameraOverride>;

export const STORAGE_KEY = 'recorrido.cameraOverrides.v1';
const ID_PATTERN = /^CAM\d{2}$/;
const MAX_ENTRIES = 64;

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
const round = (v: number, digits: number): number => Math.round(v * 10 ** digits) / 10 ** digits;

/** Coordinates inside the building footprint (with margin) and sane angles. */
export const LIMITS = {
  x: [-5, 60],
  y: [-5, 42],
  h: [0, 12],
  pan: [-90, 90],
  tilt: [0, 70],
} as const;

function isKind(v: unknown): v is CameraKind {
  return v === 'dome' || v === 'bullet';
}

function isLens(v: unknown): v is LensMm {
  return v === 2.8 || v === 4 || v === 6;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Keeps only well-formed entries; clamps numbers; fixes a lens the model does not offer. */
export function sanitizeOverrides(raw: unknown): OverrideMap {
  const out: OverrideMap = {};
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return out;
  for (const [id, value] of Object.entries(raw as Record<string, unknown>).slice(0, MAX_ENTRIES)) {
    if (!ID_PATTERN.test(id) || typeof value !== 'object' || value === null) continue;
    const v = value as Record<string, unknown>;
    const x = num(v.x);
    const y = num(v.y);
    const h = num(v.h);
    const pan = num(v.panDeg);
    const tilt = num(v.tiltDeg);
    if (!isKind(v.kind) || x === null || y === null || h === null || pan === null || tilt === null) continue;
    const kind = v.kind;
    const lensMm = isLens(v.lensMm) && LENSES_BY_KIND[kind].includes(v.lensMm) ? v.lensMm : 4;
    out[id] = {
      kind,
      lensMm,
      x: round(clamp(x, ...LIMITS.x), 2),
      y: round(clamp(y, ...LIMITS.y), 2),
      h: round(clamp(h, ...LIMITS.h), 2),
      panDeg: round(clamp(pan, ...LIMITS.pan), 1),
      tiltDeg: round(clamp(tilt, ...LIMITS.tilt), 1),
      ...(v.hidden === true ? { hidden: true } : {}),
    };
  }
  return out;
}

export function toOverride(cam: SecurityCamera): CameraOverride {
  return {
    kind: cam.kind,
    lensMm: cam.lens.mm,
    x: cam.position.x,
    y: cam.position.y,
    h: cam.position.h,
    panDeg: cam.panDeg,
    tiltDeg: cam.tiltDeg,
    ...(cam.hidden ? { hidden: true } : {}),
  };
}

export function applyOverride(cam: SecurityCamera, o: CameraOverride): SecurityCamera {
  return {
    ...cam,
    kind: o.kind,
    model: MODEL_BY_KIND[o.kind],
    lens: LENSES[o.lensMm],
    panDeg: o.panDeg,
    tiltDeg: o.tiltDeg,
    hidden: o.hidden === true,
    position: { x: o.x, y: o.y, h: o.h },
  };
}

export function applyOverrides(cameras: readonly SecurityCamera[], map: OverrideMap): SecurityCamera[] {
  return cameras.map((c) => {
    const o = map[c.id];
    return o ? applyOverride(c, o) : c;
  });
}

const same = (a: CameraOverride, b: CameraOverride): boolean =>
  a.kind === b.kind &&
  a.lensMm === b.lensMm &&
  a.x === b.x &&
  a.y === b.y &&
  a.h === b.h &&
  a.panDeg === b.panDeg &&
  a.tiltDeg === b.tiltDeg &&
  (a.hidden === true) === (b.hidden === true);

/** Entries of `current` that differ from `base` (same ids), rounded like sanitized data. */
export function diffOverrides(base: readonly SecurityCamera[], current: readonly SecurityCamera[]): OverrideMap {
  const out: OverrideMap = {};
  const baseById = new Map(base.map((c) => [c.id, c]));
  const clean = sanitizeOverrides(Object.fromEntries(current.map((c) => [c.id, toOverride(c)])));
  for (const c of current) {
    const b = baseById.get(c.id);
    const cur = clean[c.id];
    if (!b || !cur) continue;
    const baseClean = sanitizeOverrides({ [b.id]: toOverride(b) })[b.id];
    if (baseClean && !same(baseClean, cur)) out[c.id] = cur;
  }
  return out;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function safeStorage(): StorageLike | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function loadLocalOverrides(storage: StorageLike | null = safeStorage()): OverrideMap {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? sanitizeOverrides(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function saveLocalOverrides(map: OverrideMap, storage: StorageLike | null = safeStorage()): void {
  try {
    if (!storage) return;
    if (Object.keys(map).length === 0) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage can be blocked (private window, quota): editing still works for this session.
  }
}
