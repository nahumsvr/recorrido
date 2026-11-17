import { describe, expect, it } from 'vitest';
import { RACK_DEVICES, RACK_PLACEMENT, RACK_UNITS } from '../../src/data/networkRack.ts';

describe('network rack data', () => {
  it('keeps every device inside the 42U frame', () => {
    for (const d of RACK_DEVICES) {
      expect(d.u).toBeGreaterThanOrEqual(1);
      expect(d.u + d.units - 1).toBeLessThanOrEqual(RACK_UNITS);
    }
  });

  it('never overlaps two devices on the same rack unit', () => {
    const used = new Set<number>();
    for (const d of RACK_DEVICES) {
      for (let u = d.u; u < d.u + d.units; u += 1) {
        expect(used.has(u), `U${u} used twice (${d.id})`).toBe(false);
        used.add(u);
      }
    }
  });

  it('matches the budget quantities', () => {
    const count = (kind: string): number => RACK_DEVICES.filter((d) => d.kind === kind).length;
    expect(count('switch')).toBe(2);
    expect(count('patch')).toBe(2);
    expect(count('organizer')).toBe(4);
    expect(count('pdu')).toBe(2);
    expect(count('router') + count('controller') + count('nvr') + count('ups')).toBe(4);
  });

  it('fits inside the network room footprint (X 12.44-16.44, Y 28.64-32.2)', () => {
    const { center, width, depth } = RACK_PLACEMENT;
    expect(center.x - width / 2).toBeGreaterThan(12.44);
    expect(center.x + width / 2).toBeLessThan(16.44);
    expect(center.y - depth / 2).toBeGreaterThanOrEqual(28.64);
    expect(center.y + depth / 2).toBeLessThan(32.2);
  });

  it('leaves at least 0.6 m of rear access (TIA-569) and 1 m in front before the door', () => {
    const { center, depth } = RACK_PLACEMENT;
    expect(center.y - depth / 2 - 28.64).toBeGreaterThanOrEqual(0.6);
    expect(32.2 - (center.y + depth / 2)).toBeGreaterThanOrEqual(1.0);
  });
});
