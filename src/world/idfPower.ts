import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { EMT_OD_MM, IDF_BOARD, PATHWAYS } from '../data/cabling.ts';
import { planToThree } from '../domain/coords.ts';
import { PICK_R, pickMaterial, pickable, segment, vec } from './audio.ts';

const POWER_COLOR = 0xff7a1a;

/** Mains feed of the north IDF: board TA-N and the EMT to the cabinet (straps are in the support layer). */
export function createIdfPower(): Group {
  const group = new Group();
  group.name = 'idfPower';
  const tube = new MeshStandardMaterial({ color: POWER_COLOR, roughness: 0.45, metalness: 0.6 });

  const b = IDF_BOARD;
  const [bx, bh, bz] = planToThree(b.position);
  const board = new Mesh(new BoxGeometry(b.size.w, b.size.h, b.size.d), new MeshStandardMaterial({ color: 0xb8bdc4, roughness: 0.5, metalness: 0.4 }));
  board.position.set(bx, bh, bz);
  board.userData = { info: { type: 'power', id: IDF_BOARD.id } };
  group.add(board);

  const run = PATHWAYS.find((w) => w.id === 'PWR_IDF')!;
  const info = { type: 'power', id: run.id };
  const od = (EMT_OD_MM[run.trade ?? ''] ?? 17.9) / 1000;
  const pts = run.points.map(vec);
  pts.slice(1).forEach((q, i) => {
    group.add(segment(pts[i]!, q, od / 2, tube), pickable(segment(pts[i]!, q, PICK_R, pickMaterial), info));
  });
  return group;
}
