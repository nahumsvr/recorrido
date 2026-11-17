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
export const RACK_MODEL = 'Tripp Lite SR42UB';

/** Rack footprint center (floor plan) and size in meters. Front faces south; ~0.9 m of rear access behind it. */
export const RACK_PLACEMENT = {
  center: { x: 14.44, y: 30.1, h: 0 } satisfies PlanPoint,
  width: 0.6,
  depth: 1.0,
} as const;

/** Devices and quantities follow the hardware budget of the technical report. */
export const RACK_DEVICES: readonly RackDevice[] = [
  { id: 'UPS', kind: 'ups', label: 'UPS rack 3000 VA', model: 'APC SMT3000RM2U', u: 1, units: 2 },
  { id: 'PDU1', kind: 'pdu', label: 'PDU 20 A', model: 'Tripp Lite PDU1220', u: 3, units: 1 },
  { id: 'NVR', kind: 'nvr', label: 'NVR 32 ch', model: 'TP-Link VIGI NVR4032H', u: 4, units: 1 },
  { id: 'PDU2', kind: 'pdu', label: 'PDU 20 A', model: 'Tripp Lite PDU1220', u: 5, units: 1 },
  { id: 'OC300', kind: 'controller', label: 'SDN controller', model: 'TP-Link OC300', u: 33, units: 1 },
  { id: 'ER8411', kind: 'router', label: 'VPN router', model: 'TP-Link ER8411', u: 34, units: 1 },
  { id: 'ORG4', kind: 'organizer', label: 'Cable organizer', model: 'Panduit NCMHF1', u: 35, units: 1 },
  { id: 'SW24', kind: 'switch', label: 'PoE++ switch 24p', model: 'TP-Link SG3428XMPP', u: 36, units: 1 },
  { id: 'ORG3', kind: 'organizer', label: 'Cable organizer', model: 'Panduit NCMHF1', u: 37, units: 1 },
  { id: 'PP24', kind: 'patch', label: 'Patch panel 24p', model: 'LinkedPro LP-PP-607', u: 38, units: 1 },
  { id: 'ORG2', kind: 'organizer', label: 'Cable organizer', model: 'Panduit NCMHF1', u: 39, units: 1 },
  { id: 'SW48', kind: 'switch', label: 'PoE++ switch 48p', model: 'TP-Link SG3452XMPP', u: 40, units: 1 },
  { id: 'ORG1', kind: 'organizer', label: 'Cable organizer', model: 'Panduit NCMHF1', u: 41, units: 1 },
  { id: 'PP48', kind: 'patch', label: 'Patch panel 48p', model: 'LinkedPro LP-PP-608', u: 42, units: 1 },
];
