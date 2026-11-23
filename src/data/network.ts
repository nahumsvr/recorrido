/**
 * Logical network of the technical report (chapters 9 and 12): hostname, VLAN, address
 * and switch/patch-panel port of every device. The 3D model has no network state of its
 * own, so this table is the single source the info cards read. Hostnames of the
 * access points and cameras are the ids of the 3D model.
 */

export interface VlanInfo {
  readonly id: number;
  readonly name: string;
  readonly subnet: string;
  readonly gateway: string;
}

export const VLANS: Readonly<Record<10 | 20 | 30 | 40 | 50, VlanInfo>> = {
  10: { id: 10, name: 'GESTION', subnet: '10.10.0.0/24', gateway: '10.10.0.1' },
  20: { id: 20, name: 'STAFF', subnet: '10.20.0.0/24', gateway: '10.20.0.1' },
  30: { id: 30, name: 'ASISTENTES', subnet: '10.30.0.0/22', gateway: '10.30.0.1' },
  40: { id: 40, name: 'CCTV', subnet: '10.40.0.0/24', gateway: '10.40.0.1' },
  50: { id: 50, name: 'PRODUCCION', subnet: '10.50.0.0/24', gateway: '10.50.0.1' },
};

/** SSID published on each tagged VLAN of the access-point ports. */
export const SSIDS: readonly { readonly vlan: number; readonly name: string }[] = [
  { vlan: 20, name: 'UAQ-FIF-Staff' },
  { vlan: 30, name: 'UAQ-FIF-Auditorio' },
  { vlan: 50, name: 'UAQ-FIF-Prod' },
];

export interface NetworkEntry {
  readonly hostname: string;
  /** Vlan description, as the port is configured. */
  readonly vlan: string;
  /** Address, or `null` when the device has no network interface. */
  readonly address: string | null;
  readonly assignment: string;
  /** Switch and port the device lands on. */
  readonly port?: string;
  /** Patch-panel port of its permanent link. */
  readonly patch?: string;
  readonly note?: string;
}

const AP_VLAN = 'Nativa 10 (GESTION) · etiquetadas 20, 30 y 50';
const CAM_VLAN = '40 (CCTV) · acceso, sin etiqueta';
const NO_IP = { vlan: '—', address: null, assignment: '—' } as const;

/** Ports and patch-panel positions of the access points (switch/port, patch panel). */
const AP_PORTS: Readonly<Record<string, readonly [string, string]>> = {
  M01: ['SW-IDFN / 9', 'PP-B-01'],
  M02: ['SW-IDFN / 10', 'PP-B-02'],
  M03: ['SW-IDFN / 11', 'PP-B-03'],
  M04: ['SW-IDFN / 12', 'PP-B-04'],
  M18: ['SW-IDFN / 13', 'PP-B-05'],
  M06: ['SW-RACK / 9', 'PP-A-01'],
  M07: ['SW-RACK / 10', 'PP-A-02'],
  M09: ['SW-RACK / 11', 'PP-A-03'],
  M10: ['SW-RACK / 12', 'PP-A-04'],
  M12: ['SW-RACK / 13', 'PP-A-05'],
  M13: ['SW-RACK / 14', 'PP-A-06'],
  M14: ['SW-RACK / 15', 'PP-A-07'],
  M15: ['SW-RACK / 16', 'PP-A-08'],
  M16: ['SW-RACK / 17', 'PP-A-09'],
  M17: ['SW-RACK / 18', 'PP-A-10'],
};

/**
 * Ports of the cameras. CAM02 to CAM12 are the report's; CAM15 to CAM18 are not in the report yet:
 * proposed ports after the existing ones (PP-A-16 is the operator desk, ESC-01).
 */
const CAMERA_PORTS: Readonly<Record<string, readonly [string, string]>> = {
  CAM02: ['SW-IDFN / 14', 'PP-B-06'],
  CAM04: ['SW-IDFN / 15', 'PP-B-07'],
  CAM05: ['SW-RACK / 19', 'PP-A-11'],
  CAM07: ['SW-RACK / 20', 'PP-A-12'],
  CAM10: ['SW-RACK / 21', 'PP-A-13'],
  CAM11: ['SW-RACK / 22', 'PP-A-14'],
  CAM12: ['SW-RACK / 23', 'PP-A-15'],
  CAM15: ['SW-RACK / 24', 'PP-A-17'],
  CAM16: ['SW-RACK / 25', 'PP-A-18'],
  CAM17: ['SW-RACK / 26', 'PP-A-19'],
  CAM18: ['SW-RACK / 27', 'PP-A-20'],
};

/** Hostnames of the proposals above that the report does not list yet. */
export const PROPOSED_HOSTNAMES: readonly string[] = ['CAM15', 'CAM16', 'CAM17', 'CAM18'];

const num = (id: string): number => Number(id.replace(/\D/g, ''));

/** Network data of an access point (`M13` → 10.10.0.113), or `null` if the id is unknown. */
export function accessPointNetwork(id: string): NetworkEntry | null {
  const ports = AP_PORTS[id];
  if (!ports) return null;
  return {
    hostname: id,
    vlan: AP_VLAN,
    address: `10.10.0.${100 + num(id)}`,
    assignment: 'Reserva DHCP por MAC (VLAN 10)',
    port: ports[0],
    patch: ports[1],
    note: `SSID: ${SSIDS.map((s) => `${s.name} (VLAN ${s.vlan})`).join(' · ')}`,
  };
}

/** Network data of a camera (`CAM05` → 10.40.0.105), or `null` if the id is unknown. */
export function cameraNetwork(id: string): NetworkEntry | null {
  const ports = CAMERA_PORTS[id];
  if (!ports) return null;
  return {
    hostname: id,
    vlan: CAM_VLAN,
    address: `10.40.0.${100 + num(id)}`,
    assignment: 'Estática',
    port: ports[0],
    patch: ports[1],
    note: PROPOSED_HOSTNAMES.includes(id) ? 'Puerto y patch panel propuestos: aún no están en la memoria técnica.' : undefined,
  };
}

/** Equipment of the network room and the IDF, keyed by the id used in the 3D model. */
export const INFRASTRUCTURE: Readonly<Record<string, NetworkEntry>> = {
  ER8411: {
    hostname: 'RTR-01',
    vlan: '10, 20, 30, 40 y 50 (puerta de enlace de cada VLAN) · troncal, nativa 999',
    address: '10.10.0.1 · 10.20.0.1 · 10.30.0.1 · 10.40.0.1 · 10.50.0.1',
    assignment: 'Estática',
    port: 'SW-RACK / 49 (SFP+, troncal)',
    patch: 'Jumper OM3 de 1 m',
    note: 'La dirección WAN la asigna TI de la Universidad.',
  },
  OC300: { hostname: 'CTRL-01', vlan: '10 (GESTION) · acceso', address: '10.10.0.2', assignment: 'Estática', port: 'SW-RACK / 41', patch: 'Parcheo directo' },
  SW48: {
    hostname: 'SW-RACK',
    vlan: '10 (GESTION) · gestión en capa 2',
    address: '10.10.0.3',
    assignment: 'Estática',
    port: 'Troncales 10, 20, 30, 40 y 50 · SFP+ 49 → RTR-01, SFP+ 50 → SW-IDFN',
  },
  NVR: { hostname: 'NVR-01', vlan: '40 (CCTV) · acceso', address: '10.40.0.10', assignment: 'Estática', port: 'SW-RACK / 42', patch: 'Parcheo directo' },
  UPS: { hostname: 'UPS-RACK', vlan: '10 (GESTION)', address: '10.10.0.8 (reservada)', assignment: '—', note: 'Sin tarjeta de red en el presupuesto: dirección reservada para una tarjeta SmartSlot futura.' },
  PDU1: { hostname: 'PDU-A', ...NO_IP, note: 'Equipo sin interfaz de red.' },
  PDU2: { hostname: 'PDU-B', ...NO_IP, note: 'Equipo sin interfaz de red.' },
  PP48: { hostname: 'PP-A', ...NO_IP, note: 'Patch panel pasivo de 48 puertos.' },
  ORG1: { hostname: 'ORG-1', ...NO_IP, note: 'Organizador pasivo.' },
  ORG2: { hostname: 'ORG-2', ...NO_IP, note: 'Organizador pasivo.' },
  ORG3: { hostname: 'ORG-3', ...NO_IP, note: 'Organizador pasivo.' },
  // North IDF.
  'SW-IDFN': {
    hostname: 'SW-IDFN',
    vlan: '10 (GESTION) · gestión en capa 2',
    address: '10.10.0.4',
    assignment: 'Estática',
    port: 'SFP+ 25 ↔ SW-RACK / 50 (troncal OM3, nativa 999)',
  },
  'UPS-IDFN': { hostname: 'UPS-IDFN', ...NO_IP, note: 'Equipo sin interfaz de red.' },
  // Operator desk outlet.
  'ESC-01': { hostname: 'ESC-01', vlan: '10 (GESTION) · acceso', address: '10.10.0.10', assignment: 'Reserva DHCP', port: 'SW-RACK / 43', patch: 'PP-A-16', note: 'Salida RJ45 del escritorio de operación.' },
};

/** Hostname for a rack or IDF device id of the 3D model, or `null`. */
export const infrastructureHostname = (id: string): string | null => INFRASTRUCTURE[id]?.hostname ?? null;

/** Network data of any device by the id the 3D model uses. */
export function networkOf(id: string): NetworkEntry | null {
  return accessPointNetwork(id) ?? cameraNetwork(id) ?? INFRASTRUCTURE[id] ?? null;
}

/** Label/value rows for an info card or panel. */
export function networkRows(entry: NetworkEntry): [string, string][] {
  const rows: [string, string][] = [
    ['Hostname', entry.hostname],
    ['VLAN', entry.vlan],
    ['Dirección IP', entry.address ?? 'Sin dirección IP'],
  ];
  if (entry.address && entry.assignment !== '—') rows.push(['Asignación', entry.assignment]);
  if (entry.port) rows.push(['Switch / puerto', entry.port]);
  if (entry.patch) rows.push(['Patch panel', entry.patch]);
  if (entry.note) rows.push(['Nota', entry.note]);
  return rows;
}
