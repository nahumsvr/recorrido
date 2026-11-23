import { describe, expect, it } from 'vitest';
import { DEVICE_ROUTES } from '../../src/data/cabling.ts';
import { infoCardFor } from '../../src/data/infoCards.ts';
import { INFRASTRUCTURE, accessPointNetwork, cameraNetwork, networkOf } from '../../src/data/network.ts';
import { MODEL_ACCESS_POINTS } from '../../src/data/modelAps.ts';
import { RACK_DEVICES } from '../../src/data/networkRack.ts';
import { PROJECT_CAMERAS } from '../../src/data/projectCameras.ts';

const specOf = (id: string, key: string): string | undefined =>
  infoCardFor({ type: 'drop', id })?.specs.find(([k]) => k === key)?.[1];

describe('network data', () => {
  it('has an entry for every access point and camera of the model', () => {
    for (const ap of MODEL_ACCESS_POINTS) expect(accessPointNetwork(ap.id), ap.id).not.toBeNull();
    for (const cam of PROJECT_CAMERAS) expect(cameraNetwork(cam.id), cam.id).not.toBeNull();
  });

  it('follows the addressing rule: last octet = 100 + device number, VLAN 10 for APs and VLAN 40 for cameras', () => {
    expect(accessPointNetwork('M13')?.address).toBe('10.10.0.113');
    expect(cameraNetwork('CAM05')?.address).toBe('10.40.0.105');
    expect(cameraNetwork('CAM18')?.address).toBe('10.40.0.118');
    expect(cameraNetwork('CAM05')?.vlan).toContain('40');
    expect(accessPointNetwork('M01')?.vlan).toContain('20, 30 y 50');
  });

  it('never repeats an address, a switch port or a patch-panel port', () => {
    const entries = [...MODEL_ACCESS_POINTS.map((a) => accessPointNetwork(a.id)!), ...PROJECT_CAMERAS.map((c) => cameraNetwork(c.id)!), ...Object.values(INFRASTRUCTURE)];
    const dup = (values: (string | undefined | null)[]): string[] => {
      const seen = new Set<string>();
      return values.filter((v): v is string => !!v && (seen.has(v) ? true : (seen.add(v), false)));
    };
    expect(dup(entries.map((e) => e.address?.split(' ')[0])), 'addresses').toEqual([]);
    expect(dup(entries.map((e) => (e.port?.startsWith('SW-') && /\/ \d+$/.test(e.port) ? e.port : null))), 'ports').toEqual([]);
    expect(dup(entries.map((e) => (e.patch?.startsWith('PP-') ? e.patch : null))), 'patch ports').toEqual([]);
  });

  it('lands each device on the switch of its hub (IDF-N or rack)', () => {
    for (const r of DEVICE_ROUTES) {
      const port = networkOf(r.device.id)?.port ?? '';
      expect(port.startsWith(r.device.hub === 'idf' ? 'SW-IDFN' : 'SW-RACK'), r.device.id).toBe(true);
    }
  });

  it('names every rack device and gives the equipment without a network card no address', () => {
    for (const d of RACK_DEVICES) expect(INFRASTRUCTURE[d.id], d.id).toBeDefined();
    expect(INFRASTRUCTURE.PDU1?.address).toBeNull();
    expect(INFRASTRUCTURE.ER8411?.hostname).toBe('RTR-01');
    expect(INFRASTRUCTURE.NVR?.address).toBe('10.40.0.10');
  });

  it('shows hostname, VLAN and address on the clicked cards', () => {
    expect(specOf('M13', 'Hostname')).toBe('M13');
    expect(specOf('CAM12', 'Dirección IP')).toBe('10.40.0.112');
    expect(infoCardFor({ type: 'camera', id: 'CAM15' })?.specs).toContainEqual(['Dirección IP', '10.40.0.115']);
    const rtr = infoCardFor({ type: 'netdevice', id: 'ER8411' });
    expect(rtr?.title).toBe('RTR-01');
    expect(rtr?.specs.map(([k]) => k)).toEqual(expect.arrayContaining(['Hostname', 'VLAN', 'Dirección IP']));
    expect(infoCardFor({ type: 'idf' })?.specs).toContainEqual(['Dirección IP', '10.10.0.4']);
    expect(infoCardFor({ type: 'speaker', id: 'SPK-W1' })?.specs.some(([k, v]) => k === 'Red' && v.startsWith('Sin red'))).toBe(true);
  });
});
