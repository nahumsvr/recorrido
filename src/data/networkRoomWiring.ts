import type { PlanPoint } from '../domain/coords.ts';
import { pathway } from './cabling.ts';
import { RACK_DEVICES, RACK_PLACEMENT, rackDeviceCenterH } from './networkRack.ts';
import { DESK_PLACEMENT } from './networkDesk.ts';

/**
 * Wiring inside the network room (X 12.44-16.44, Y 28.64-32.2): power outlets, the power
 * feed of every rack device, the patch cords, and the desk workstation. Plan
 * coordinates (X east, Y south, h up, meters). It is separate from `PATHWAYS` on purpose: these
 * cables never leave the room, so they add nothing to the pathway quantities.
 *
 * Assumptions to confirm in the site survey: where the electrical panel is (the
 * dedicated circuit is not drawn beyond its outlet) and the exact plug type of the UPS.
 */
const p = (x: number, y: number, h: number): PlanPoint => ({ x, y, h });

export type WiringKind = 'power' | 'data' | 'video';

export interface WallFixture {
  readonly id: string;
  readonly kind: 'power' | 'data';
  readonly label: string;
  /** Center of the faceplate, on the inner face of the wall. */
  readonly position: PlanPoint;
  /** Wall it sits on; the plate faces into the room. */
  readonly wall: 'north' | 'east';
}

/** Inner faces of the room (north and east walls). */
const Y_NORTH_FACE = 28.64;
const X_EAST_FACE = 16.44;

export const WALL_FIXTURES: readonly WallFixture[] = [
  { id: 'OUT-N1', kind: 'power', label: 'Dedicated 120 V circuit for the UPS (NEMA L5-30R), behind the rack', position: p(RACK_PLACEMENT.center.x, Y_NORTH_FACE + 0.01, 0.5), wall: 'north' },
  { id: 'OUT-D1', kind: 'power', label: 'Duplex outlet for the workstation (PC and monitor)', position: p(X_EAST_FACE - 0.01, 30.25, 0.3), wall: 'east' },
  { id: 'JACK-D1', kind: 'data', label: 'Cat6A wall jack for the workstation', position: p(X_EAST_FACE - 0.01, 30.95, 0.35), wall: 'east' },
];

export interface RoomCable {
  readonly id: string;
  readonly kind: WiringKind;
  readonly label: string;
  /** Id of the rack device, wall fixture or desk piece where it starts. */
  readonly from: string;
  readonly to: string;
  readonly points: readonly PlanPoint[];
}

const RACK = RACK_PLACEMENT.center;
/** Rear of the equipment (the rack front faces south) and the plane of the rear cable management behind it. */
const Y_EQUIP_REAR = RACK.y + 0.02;
const Y_REAR_RUN = RACK.y - 0.15;
/** The front of the equipment; patch cords loop just in front of it. */
const Y_FRONT = RACK.y + 0.44;
const Y_FRONT_LOOP = Y_FRONT + 0.05;
/** Top of the room tray over the rack: where the existing ANNEX_FEED starts. */
const TRAY_START = pathway('ANNEX_FEED').points[0]!;

const device = (id: string) => {
  const d = RACK_DEVICES.find((x) => x.id === id);
  if (!d) throw new Error(`unknown rack device ${id}`);
  return rackDeviceCenterH(d);
};

/** Rear-to-rear run between two rack devices along a vertical lane at `x`. */
const rearRun = (x: number, fromH: number, toH: number): PlanPoint[] => [p(x, Y_EQUIP_REAR, fromH), p(x, Y_REAR_RUN, fromH), p(x, Y_REAR_RUN, toH), p(x, Y_EQUIP_REAR, toH)];
/** Front patch cord between two rack devices, looping out in front of the equipment. */
const frontLoop = (x: number, fromH: number, toH: number): PlanPoint[] => [p(x, Y_FRONT, fromH), p(x, Y_FRONT_LOOP, fromH), p(x, Y_FRONT_LOOP, toH), p(x, Y_FRONT, toH)];

/** Power lanes at the east side of the rear, data lanes at the west side, so they never cross. */
const POWER_X = (i: number): number => RACK.x + 0.1 + i * 0.025;
const DATA_X = (i: number): number => RACK.x - 0.2 + i * 0.025;

// ---- desk workstation ----
const { center: DESK, topHeight: DESK_TOP } = DESK_PLACEMENT;
/** The PC tower stands under the desk, back toward the wall; its ports are on the east face. */
export const PC_TOWER = { x: DESK.x + 0.05, y: DESK.y + 0.45, size: { w: 0.2, h: 0.42, d: 0.4 } } as const;
const PC_REAR_X = PC_TOWER.x + PC_TOWER.size.d / 2;
const MONITOR_STAND = p(DESK.x + 0.12, DESK.y, DESK_TOP + 0.08);
const OUT_D1 = WALL_FIXTURES[1]!.position;
const JACK_D1 = WALL_FIXTURES[2]!.position;
/** Where the cables to the monitor cross the desk, through a grommet at the back. */
const GROMMET = p(DESK.x + 0.2, DESK.y + 0.3, DESK_TOP);

export const ROOM_CABLES: readonly RoomCable[] = [
  // -- Power: wall → UPS → PDUs → equipment.
  { id: 'PWR_WALL_UPS', kind: 'power', label: 'Dedicated circuit to the UPS', from: 'OUT-N1', to: 'UPS', points: [p(RACK.x, Y_NORTH_FACE + 0.02, 0.5), p(RACK.x, Y_NORTH_FACE + 0.35, 0.42), p(RACK.x, Y_REAR_RUN, 0.25), p(RACK.x, Y_EQUIP_REAR, device('UPS'))] },
  { id: 'PWR_UPS_PDU1', kind: 'power', label: 'UPS to PDU 1', from: 'UPS', to: 'PDU1', points: rearRun(POWER_X(0), device('UPS'), device('PDU1')) },
  { id: 'PWR_UPS_PDU2', kind: 'power', label: 'UPS to PDU 2', from: 'UPS', to: 'PDU2', points: rearRun(POWER_X(1), device('UPS'), device('PDU2')) },
  { id: 'PWR_PDU1_NVR', kind: 'power', label: 'PDU 1 to the NVR', from: 'PDU1', to: 'NVR', points: rearRun(POWER_X(2), device('PDU1'), device('NVR')) },
  { id: 'PWR_PDU2_ER8411', kind: 'power', label: 'PDU 2 to the VPN router', from: 'PDU2', to: 'ER8411', points: rearRun(POWER_X(3), device('PDU2'), device('ER8411')) },
  { id: 'PWR_PDU2_OC300', kind: 'power', label: 'PDU 2 to the SDN controller', from: 'PDU2', to: 'OC300', points: rearRun(POWER_X(4), device('PDU2'), device('OC300')) },
  { id: 'PWR_PDU2_SW48', kind: 'power', label: 'PDU 2 to the PoE++ switch', from: 'PDU2', to: 'SW48', points: rearRun(POWER_X(5), device('PDU2'), device('SW48')) },
  // -- Data inside the rack: everything lands on the 48-port switch.
  { id: 'LAN_ER8411_SW48', kind: 'data', label: 'VPN router to the switch (uplink)', from: 'ER8411', to: 'SW48', points: rearRun(DATA_X(0), device('ER8411'), device('SW48')) },
  { id: 'LAN_OC300_SW48', kind: 'data', label: 'SDN controller to the switch', from: 'OC300', to: 'SW48', points: rearRun(DATA_X(1), device('OC300'), device('SW48')) },
  { id: 'LAN_NVR_SW48', kind: 'data', label: 'NVR to the switch (camera recording)', from: 'NVR', to: 'SW48', points: rearRun(DATA_X(2), device('NVR'), device('SW48')) },
  { id: 'LAN_SW48_PP24', kind: 'data', label: 'Patch cords, switch to patch panel 24p', from: 'SW48', to: 'PP24', points: frontLoop(RACK.x - 0.12, device('SW48'), device('PP24')) },
  { id: 'LAN_SW48_PP48', kind: 'data', label: 'Patch cords, switch to patch panel 48p', from: 'SW48', to: 'PP48', points: frontLoop(RACK.x + 0.12, device('SW48'), device('PP48')) },
  // -- The permanent links leave the patch panels by the rear, up to the room tray over the rack.
  { id: 'LAN_PP24_TRAY', kind: 'data', label: 'Patch panel 24p to the room tray (ANNEX_FEED)', from: 'PP24', to: 'ANNEX_FEED', points: [p(DATA_X(3), Y_EQUIP_REAR, device('PP24')), p(DATA_X(3), Y_REAR_RUN, device('PP24')), p(DATA_X(3), Y_REAR_RUN, TRAY_START.h), p(TRAY_START.x, TRAY_START.y, TRAY_START.h)] },
  { id: 'LAN_PP48_TRAY', kind: 'data', label: 'Patch panel 48p to the room tray (ANNEX_FEED)', from: 'PP48', to: 'ANNEX_FEED', points: [p(DATA_X(4), Y_EQUIP_REAR, device('PP48')), p(DATA_X(4), Y_REAR_RUN, device('PP48')), p(DATA_X(4), Y_REAR_RUN, TRAY_START.h), p(TRAY_START.x, TRAY_START.y, TRAY_START.h)] },
  // -- Workstation: PC and monitor.
  { id: 'PWR_OUT_D1_PC', kind: 'power', label: 'Duplex outlet to the PC', from: 'OUT-D1', to: 'PC', points: [OUT_D1, p(X_EAST_FACE - 0.04, 30.55, 0.15), p(PC_REAR_X, PC_TOWER.y, 0.15)] },
  { id: 'PWR_OUT_D1_MON', kind: 'power', label: 'Duplex outlet to the monitor', from: 'OUT-D1', to: 'MONITOR', points: [OUT_D1, p(X_EAST_FACE - 0.02, OUT_D1.y, DESK_TOP + 0.03), p(GROMMET.x + 0.1, GROMMET.y - 0.1, DESK_TOP + 0.01), MONITOR_STAND] },
  { id: 'VID_PC_MON', kind: 'video', label: 'PC to the monitor (DisplayPort)', from: 'PC', to: 'MONITOR', points: [p(PC_REAR_X, PC_TOWER.y, 0.32), p(PC_REAR_X - 0.04, GROMMET.y + 0.1, 0.45), p(GROMMET.x, GROMMET.y, DESK_TOP - 0.02), p(GROMMET.x, GROMMET.y, DESK_TOP + 0.01), MONITOR_STAND] },
  { id: 'LAN_PC_JACK', kind: 'data', label: 'PC to the wall jack (patch cord)', from: 'PC', to: 'JACK-D1', points: [p(PC_REAR_X, PC_TOWER.y, 0.25), p(PC_REAR_X + 0.03, PC_TOWER.y, 0.3), JACK_D1] },
  // The jack's link rises in its own EMT (ROOM_DESK) and joins the CAM16 ceiling EMT (ROOM_EMT_E): along the ceiling over the rack, then down the rack rear to the switch.
  { id: 'LAN_JACK_SW48', kind: 'data', label: 'Wall jack to the switch (EMT)', from: 'JACK-D1', to: 'SW48', points: [JACK_D1, ...pathway('ROOM_DESK').points, ...[...pathway('ROOM_EMT_E').points].slice(0, 2).reverse(), p(DATA_X(5), Y_REAR_RUN, pathway('ROOM_EMT_E').points[0]!.h), p(DATA_X(5), Y_REAR_RUN, device('SW48')), p(DATA_X(5), Y_EQUIP_REAR, device('SW48'))] },
];
