import { describe, expect, it } from 'vitest';
import {
  applyOverrides,
  diffOverrides,
  loadLocalOverrides,
  sanitizeOverrides,
  saveLocalOverrides,
  STORAGE_KEY,
  toOverride,
} from '../../src/cameras/cameraOverrides.ts';
import { CAMERAS } from '../../src/data/cameras.ts';

const memory = (): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
};

/** Five stand-in cameras (CAM01..CAM05; CAM03 hidden) so these tests do not depend on the real list. */
const FIXTURES = [1, 2, 3, 4, 5].map((n) => ({
  ...CAMERAS[0]!,
  id: `CAM0${n}`,
  hidden: n === 3,
  position: { ...CAMERAS[0]!.position, x: n },
}));

const valid = { kind: 'dome', lensMm: 4, x: 10, y: 5, h: 3.5, panDeg: 10, tiltDeg: 30 };

describe('sanitizeOverrides', () => {
  it('keeps a well-formed entry', () => {
    expect(sanitizeOverrides({ CAM03: valid }).CAM03).toEqual(valid);
  });

  it('drops bad ids, bad types and non-objects', () => {
    expect(sanitizeOverrides({ nope: valid, CAM3: valid, CAM04: { ...valid, x: 'a' }, CAM05: null })).toEqual({});
    expect(sanitizeOverrides(null)).toEqual({});
    expect(sanitizeOverrides([valid])).toEqual({});
  });

  it('clamps out-of-range numbers', () => {
    const o = sanitizeOverrides({ CAM01: { ...valid, x: 999, h: -4, panDeg: 400, tiltDeg: 200 } }).CAM01!;
    expect([o.x, o.h, o.panDeg, o.tiltDeg]).toEqual([60, 0, 90, 70]);
  });

  it('replaces a lens the model is not sold with (C240I has no 6 mm)', () => {
    expect(sanitizeOverrides({ CAM02: { ...valid, kind: 'dome', lensMm: 6 } }).CAM02!.lensMm).toBe(4);
    expect(sanitizeOverrides({ CAM11: { ...valid, kind: 'bullet', lensMm: 6 } }).CAM11!.lensMm).toBe(6);
  });
});

describe('hidden cameras', () => {
  // CAM02 is visible by default; CAM03 is hidden by default.
  const visible = FIXTURES[1]!;
  const hiddenByDefault = FIXTURES[2]!;

  it('keeps the flag only when true and applies it', () => {
    expect(sanitizeOverrides({ CAM02: valid }).CAM02).not.toHaveProperty('hidden');
    expect(sanitizeOverrides({ CAM02: { ...valid, hidden: 'yes' } }).CAM02).not.toHaveProperty('hidden');
    const o = sanitizeOverrides({ CAM02: { ...valid, hidden: true } });
    expect(o.CAM02!.hidden).toBe(true);
    expect(applyOverrides([visible], o)[0]!.hidden).toBe(true);
  });

  it('shows up in the diff and can be undone', () => {
    const hiddenCams = applyOverrides(FIXTURES, { CAM02: { ...toOverride(visible), hidden: true } });
    expect(diffOverrides(FIXTURES, hiddenCams).CAM02!.hidden).toBe(true);
    expect(diffOverrides(hiddenCams, FIXTURES).CAM02).toBeDefined();
    expect(diffOverrides(FIXTURES, applyOverrides(hiddenCams, { CAM02: toOverride(visible) }))).toEqual({});
  });

  it('a camera hidden by default can be shown again with an override', () => {
    const shown = applyOverrides([hiddenByDefault], { CAM03: { ...toOverride(hiddenByDefault), hidden: false } });
    expect(shown[0]!.hidden).toBe(false);
  });
});

describe('applyOverrides / diffOverrides', () => {
  it('applies an override and rebuilds model and lens', () => {
    const [cam] = applyOverrides(FIXTURES.slice(0, 1), { CAM01: { ...valid, kind: 'dome', lensMm: 2.8 } });
    expect(cam!.kind).toBe('dome');
    expect(cam!.model).toBe('TP-Link VIGI C240I');
    expect(cam!.lens.hfov).toBe(88.8);
    expect(cam!.position).toEqual({ x: 10, y: 5, h: 3.5 });
  });

  it('diff is empty when nothing changed and lists only changed cameras', () => {
    expect(diffOverrides(FIXTURES, FIXTURES)).toEqual({});
    const changed = applyOverrides(FIXTURES, { CAM05: { ...toOverride(FIXTURES[4]!), h: 4.4 } });
    expect(Object.keys(diffOverrides(FIXTURES, changed))).toEqual(['CAM05']);
  });
});

describe('local storage', () => {
  it('round-trips and clears when empty', () => {
    const s = memory();
    saveLocalOverrides({ CAM03: valid as never }, s);
    expect(loadLocalOverrides(s).CAM03).toEqual(valid);
    saveLocalOverrides({}, s);
    expect(s.data.has(STORAGE_KEY)).toBe(false);
  });

  it('ignores corrupted JSON and a missing storage', () => {
    const s = memory();
    s.data.set(STORAGE_KEY, '{not json');
    expect(loadLocalOverrides(s)).toEqual({});
    expect(loadLocalOverrides(null)).toEqual({});
  });
});
