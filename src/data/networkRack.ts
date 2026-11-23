import type { PlanPoint } from '../domain/coords.ts';

export type RackDeviceKind = 'router' | 'controller' | 'switch' | 'patch' | 'organizer' | 'nvr' | 'ups' | 'pdu';

export interface RackDevice {
  readonly id: string;
  readonly kind: RackDeviceKind;
  readonly label: string;
  readonly model: string;
  /** Lowest rack unit occupied (1 = bottom). */
  readonly u: number;
  /** Height in rack units. */
  readonly units: number;
}

export const RACK_UNITS = 42;
/** One rack unit (EIA-310) and the height of the plinth under the first unit, meters. */
export const RACK_U_M = 0.04445;
export const RACK_PLINTH_M = 0.1;

/** Height of the vertical center of a device above the floor. */
export const rackDeviceCenterH = (d: Pick<RackDevice, 'u' | 'units'>): number => RACK_PLINTH_M + (d.u - 1) * RACK_U_M + (d.units * RACK_U_M) / 2;
export const RACK_MODEL = 'Tripp Lite SR42UB';

/** Rack footprint center (floor plan) and size in meters. Front faces south; ~0.9 m of rear access behind it. */
export const RACK_PLACEMENT = {
  center: { x: 14.44, y: 30.1, h: 0 } satisfies PlanPoint,
  width: 0.6,
  depth: 1.0,
} as const;

/**
 * Devices and quantities follow the hardware budget of the technical report, and
 * the U positions follow its rack table (PP-A U41-U40, SW-RACK U38, RTR-01 U36,
 * CTRL-01 U35, NVR-01 U34-U33, PDUs U4-U3, UPS U2-U1). The 24-port PoE++ switch
 * (SG3428XMPP), its patch panel (PP-B) and its organizer (ORG-4) live in the
 * north IDF (see `IDF` in cabling.ts).
 */
export const RACK_DEVICES: readonly RackDevice[] = [
  { id: 'UPS', kind: 'ups', label: 'UPS rack 3000 VA', model: 'APC SMT3000RM2U', u: 1, units: 2 },
  { id: 'PDU1', kind: 'pdu', label: 'PDU 20 A', model: 'Tripp Lite PDU1220', u: 3, units: 1 },
  { id: 'PDU2', kind: 'pdu', label: 'PDU 20 A', model: 'Tripp Lite PDU1220', u: 4, units: 1 },
  // Spare units U5-U31 (growth and ventilation), as in the technical report.
  { id: 'ORG3', kind: 'organizer', label: 'Cable organizer', model: 'Panduit NCMHF1', u: 32, units: 1 },
  { id: 'NVR', kind: 'nvr', label: 'NVR 16 ch', model: 'TP-Link VIGI NVR2016H', u: 33, units: 2 },
  { id: 'OC300', kind: 'controller', label: 'SDN controller', model: 'TP-Link OC300', u: 35, units: 1 },
  { id: 'ER8411', kind: 'router', label: 'VPN router', model: 'TP-Link ER8411', u: 36, units: 1 },
  { id: 'ORG2', kind: 'organizer', label: 'Cable organizer', model: 'Panduit NCMHF1', u: 37, units: 1 },
  { id: 'SW48', kind: 'switch', label: 'PoE++ switch 48p', model: 'TP-Link SG3452XMPP', u: 38, units: 1 },
  { id: 'ORG1', kind: 'organizer', label: 'Cable organizer', model: 'Panduit NCMHF1', u: 39, units: 1 },
  { id: 'PP48', kind: 'patch', label: 'Patch panel 48p', model: 'LinkedPro LP-PP-608', u: 40, units: 2 },
];
