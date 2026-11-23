import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { PATHWAYS, RMC_OD_MM } from '../data/cabling.ts';
import { ISP_DUCT, ISP_ODF, ispDuctPoints } from '../data/undergroundLink.ts';
import { planToThree } from '../domain/coords.ts';
import { PICK_R, pickMaterial, pickable, segment, vec } from './audio.ts';

const DUCT_COLOR = 0xf2c200;
const RISER_COLOR = 0xb9bec6;

/**
 * Provider fiber: the buried HDPE duct (drawn through the ground, like an x-ray, so it can be seen), the rigid riser on
 * the annex face of the network room wall, and the ODF box inside. `neighborFaceY` is where the duct leaves the white block.
 */
export function createUndergroundLink(neighborFaceY: number): Group {
  const group = new Group();
  group.name = 'undergroundLink';

  // The duct is below the grass and the slab: it ignores depth so it shows through them.
  const duct = new MeshStandardMaterial({ color: DUCT_COLOR, roughness: 0.5, metalness: 0.1, transparent: true, opacity: 0.9, depthTest: false });
  const ductInfo = { type: 'isp', id: ISP_DUCT.id };
  const pts = ispDuctPoints(neighborFaceY).map(vec);
  pts.slice(1).forEach((q, i) => {
    const tube = segment(pts[i]!, q, ISP_DUCT.outerMm / 2000, duct);
    tube.renderOrder = 10;
    group.add(tube, pickable(segment(pts[i]!, q, PICK_R, pickMaterial), ductInfo));
  });

  const riser = PATHWAYS.find((w) => w.id === 'ISP_RISER')!;
  const rmc = new MeshStandardMaterial({ color: RISER_COLOR, roughness: 0.4, metalness: 0.7 });
  const od = (RMC_OD_MM[riser.trade ?? ''] ?? 26.7) / 1000;
  const rp = riser.points.map(vec);
  rp.slice(1).forEach((q, i) => {
    group.add(segment(rp[i]!, q, od / 2, rmc), pickable(segment(rp[i]!, q, PICK_R, pickMaterial), { type: 'isp', id: riser.id }));
  });

  const o = ISP_ODF;
  const [ox, oh, oz] = planToThree(o.position);
  const odf = new Mesh(new BoxGeometry(o.size.w, o.size.h, o.size.d), new MeshStandardMaterial({ color: 0x20262e, roughness: 0.5, metalness: 0.4 }));
  odf.position.set(ox, oh, oz);
  odf.userData = { info: { type: 'isp', id: o.id } };
  group.add(odf);
  return group;
}
