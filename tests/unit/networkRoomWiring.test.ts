import { describe, expect, it } from 'vitest';
import { pathway } from '../../src/data/cabling.ts';
import { RACK_DEVICES, rackDeviceCenterH } from '../../src/data/networkRack.ts';
import { PC_TOWER, ROOM_CABLES, WALL_FIXTURES } from '../../src/data/networkRoomWiring.ts';
import { DESK_PLACEMENT } from '../../src/data/networkDesk.ts';

const cable = (id: string) => {
  const c = ROOM_CABLES.find((x) => x.id === id);
  if (!c) throw new Error(`no cable ${id}`);
  return c;
};
const powerTo = (to: string) => ROOM_CABLES.filter((c) => c.kind === 'power' && c.to === to);

describe('network room wiring', () => {
  it('keeps every cable and fixture inside the room (X 12.44-16.44, Y 28.64-32.2, under the 2.59 m ceiling)', () => {
    const pts = [...ROOM_CABLES.flatMap((c) => c.points), ...WALL_FIXTURES.map((f) => f.position)];
    for (const q of pts) {
      expect(q.x).toBeGreaterThan(12.44);
      expect(q.x).toBeLessThanOrEqual(16.44);
      expect(q.y).toBeGreaterThanOrEqual(28.64);
      expect(q.y).toBeLessThan(32.2);
      expect(q.h).toBeGreaterThanOrEqual(0);
      expect(q.h).toBeLessThanOrEqual(2.59);
    }
  });

  it('powers every active rack device exactly once (patch panels and organizers are passive)', () => {
    const active = RACK_DEVICES.filter((d) => !['patch', 'organizer', 'ups'].includes(d.kind));
    for (const d of active) {
      expect(powerTo(d.id), `${d.id} power feeds`).toHaveLength(1);
    }
    expect(powerTo('UPS')).toHaveLength(1);
  });

  it('feeds the UPS from a dedicated wall outlet and the PDUs from the UPS', () => {
    expect(cable('PWR_WALL_UPS').from).toBe('OUT-N1');
    expect(cable('PWR_UPS_PDU1').from).toBe('UPS');
    expect(cable('PWR_UPS_PDU2').from).toBe('UPS');
    expect(WALL_FIXTURES.find((f) => f.id === 'OUT-N1')?.kind).toBe('power');
  });

  it('connects every rack device end to the device height on the rack (no floating cables)', () => {
    const rackIds = new Set(RACK_DEVICES.map((d) => d.id));
    for (const c of ROOM_CABLES) {
      for (const [id, q] of [[c.from, c.points[0]!], [c.to, c.points[c.points.length - 1]!]] as const) {
        const d = RACK_DEVICES.find((x) => x.id === id);
        if (rackIds.has(id) && d) expect(q.h, `${c.id} at ${id}`).toBeCloseTo(rackDeviceCenterH(d), 3);
      }
    }
  });

  it('lands the router, the controller, the NVR and the desk on the switch', () => {
    for (const id of ['ER8411', 'OC300', 'NVR']) {
      expect(ROOM_CABLES.some((c) => c.kind === 'data' && c.from === id && c.to === 'SW48'), id).toBe(true);
    }
    expect(cable('LAN_JACK_SW48').to).toBe('SW48');
    expect(cable('LAN_PC_JACK').to).toBe('JACK-D1');
  });

  it('leaves the rack toward the existing room tray at its first point', () => {
    const start = pathway('ANNEX_FEED').points[0]!;
    for (const id of ['LAN_PP24_TRAY', 'LAN_PP48_TRAY']) {
      const end = cable(id).points.at(-1)!;
      expect(end).toEqual(start);
    }
  });

  it('wires the workstation: PC and monitor from the duplex outlet, video and network from the PC', () => {
    expect(cable('PWR_OUT_D1_PC').from).toBe('OUT-D1');
    expect(cable('PWR_OUT_D1_MON').from).toBe('OUT-D1');
    expect(cable('VID_PC_MON').to).toBe('MONITOR');
  });

  it('puts the PC tower under the desk, inside its footprint', () => {
    const { center, length, depth } = DESK_PLACEMENT;
    expect(PC_TOWER.y - PC_TOWER.size.w / 2).toBeGreaterThanOrEqual(center.y - length / 2);
    expect(PC_TOWER.y + PC_TOWER.size.w / 2).toBeLessThanOrEqual(center.y + length / 2);
    expect(PC_TOWER.x - PC_TOWER.size.d / 2).toBeGreaterThanOrEqual(center.x - depth / 2);
    expect(PC_TOWER.x + PC_TOWER.size.d / 2).toBeLessThanOrEqual(center.x + depth / 2);
  });
});
