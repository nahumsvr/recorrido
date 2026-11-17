import type { PlanPoint } from '../domain/coords.ts';

/** `table`: design table coordinates. `model`: devices placed in the SketchUp model. */
export type ApGroupId = 'table' | 'model';

/** Where the marker should attach; without it the nearest wall within range is used. */
export type MountHint =
  | { readonly kind: 'wall'; /** Room-side normal in plan axes (X east, Y south). */ readonly normal: { x: number; y: number } }
  | { readonly kind: 'ceiling' };

export interface AccessPoint {
  readonly id: string;
  readonly group: ApGroupId;
  readonly position: PlanPoint;
  readonly model: string;
  /** Zone name; table zones are provisional until confirmed by the network design. */
  readonly zone: string;
  readonly mountHint?: MountHint;
}

const MODEL = 'TP-Link EAP773';

const ap = (id: string, x: number, y: number, h: number, zone: string): AccessPoint => ({
  id,
  group: 'table',
  position: { x, y, h },
  model: MODEL,
  zone,
});

export const ACCESS_POINTS: readonly AccessPoint[] = [
  ap('AP01', 6, 0.4, 4.5, 'Courts - north wall'),
  ap('AP02', 17, 0.4, 4.5, 'Courts - north wall'),
  ap('AP03', 28, 0.4, 4.5, 'Courts - north wall'),
  ap('AP04', 39, 0.4, 4.5, 'Courts - north wall'),
  ap('AP05', 0.4, 13, 4.5, 'Courts - west wall'),
  ap('AP06', 19.6, 22, 3.5, 'Courts - south side'),
  ap('AP07', 45.4, 12, 4.5, 'Courts - stage front'),
  ap('AP08', 5, 32, 4, 'Stands'),
  ap('AP09', 14.6, 32, 4, 'Stands'),
  ap('AP10', 29.4, 32, 4, 'Stands'),
  ap('AP11', 38.2, 32, 4, 'Stands'),
  ap('AP12', 54.6, 15, 4.5, 'Stage'),
  ap('AP13', 51.6, 2.2, 3, 'Gym'),
  ap('AP14', 47.5, 29.6, 2.7, 'Offices'),
];
