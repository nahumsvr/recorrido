import { BoxGeometry, CylinderGeometry, DoubleSide, Group, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Ray, Vector3 } from 'three';
import type { MeshBVH } from 'three-mesh-bvh';
import { DEVICE_ROUTES, IDF, JUNCTIONS, PATHWAYS, PENETRATIONS, type Penetration } from '../data/cabling.ts';
import { MODEL_ACCESS_POINTS } from '../data/modelAps.ts';
import { planToThree, type PlanPoint } from '../domain/coords.ts';
import { planDrop } from '../domain/dropRouting.ts';
import { anchorAt, type Dir } from '../domain/supports.ts';
import { bvhProbe } from './supports.ts';

const RAIL_T = 0.012;
const PLATE_T = 0.006;
/** Conduit wall: outer radius over the inner radius. */
const CONDUIT_WALL_M = 0.004;
const DROP_R = 0.011;
/** Invisible, fatter cylinder around each drop so a 2 cm conduit can be clicked from across the court. */
const DROP_PICK_R = 0.07;
/** Hop kept clear around the device: its own mounting surface is not a crossing. */
const DEVICE_CLEARANCE_M = 0.35;
/** A ceiling AP hangs this far under the ceiling plane. */
const CEILING_INSET_M = 0.1;

const TRAY_COLOR = 0xb9c0c8;
const CONDUIT_COLOR = 0x9aa3ad;
const SLEEVE_COLOR = 0xff8a3d;
const DROP_COLOR = 0x6c7683;
const PLASTIC_COLOR = 0xe9e6dc;
const JUNCTION_COLOR = 0x555d66;
const JUNCTION_SIZE = { w: 0.14, h: 0.14, d: 0.08 } as const;
/** A box on a conduit run sits on a wall at most this far from the tube axis. */
const BOX_WALL_REACH_M = 0.12;
/** Invisible, fatter cylinder around each thin conduit so it can be clicked. */
const CONDUIT_PICK_R = 0.07;

const vec = (p: PlanPoint): Vector3 => new Vector3(...planToThree(p));

/** Places `object` between `a` and `b` with its `axis` along the segment. */
function alignBetween<T extends Mesh | Group>(object: T, a: Vector3, b: Vector3, axis: Vector3): T {
  object.position.copy(a).add(b).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(axis, b.clone().sub(a).normalize());
  return object;
}

/** Wire-basket look: a base plate and two rails, built along Z then oriented. */
function traySegment(a: Vector3, b: Vector3, widthM: number, depthM: number, mat: MeshStandardMaterial): Group | null {
  const len = a.distanceTo(b);
  if (len < 0.01) return null;
  const seg = new Group();
  seg.add(new Mesh(new BoxGeometry(widthM, PLATE_T, len), mat));
  for (const side of [-1, 1]) {
    const rail = new Mesh(new BoxGeometry(RAIL_T, depthM, len), mat);
    rail.position.set((side * widthM) / 2, depthM / 2, 0);
    seg.add(rail);
  }
  return alignBetween(seg, a, b, new Vector3(0, 0, 1));
}

/** Solid raceway (plastic) between two points; `widthM` across the wall, `depthM` out of it. */
function boxBetween(a: Vector3, b: Vector3, widthM: number, depthM: number, mat: MeshStandardMaterial): Mesh | null {
  const len = a.distanceTo(b);
  if (len < 0.01) return null;
  return alignBetween(new Mesh(new BoxGeometry(widthM, depthM, len), mat), a, b, new Vector3(0, 0, 1));
}

function cylinderBetween(a: Vector3, b: Vector3, radius: number, mat: Material): Mesh | null {
  const len = a.distanceTo(b);
  if (len < 0.01) return null;
  return alignBetween(new Mesh(new CylinderGeometry(radius, radius, len, 12), mat), a, b, new Vector3(0, 1, 0));
}

/** Direction of the pathway segment closest to `pen`; sleeves follow their pathway. */
function sleeveAxis(pen: Penetration): Vector3 {
  const w = PATHWAYS.find((x) => x.id === pen.pathway);
  if (!w) return new Vector3(1, 0, 0); // M12: through the offices west wall
  const c = vec(pen.position);
  let best = { d: Infinity, dir: new Vector3(1, 0, 0) };
  for (let i = 1; i < w.points.length; i++) {
    const a = vec(w.points[i - 1]!);
    const b = vec(w.points[i]!);
    const ab = b.clone().sub(a);
    const t = Math.max(0, Math.min(1, c.clone().sub(a).dot(ab) / (ab.lengthSq() || 1)));
    const d = a.clone().addScaledVector(ab, t).distanceTo(c);
    if (d < best.d) best = { d, dir: ab.normalize() };
  }
  return best.dir;
}

/** Solids between two points, ignoring the device's own mounting surface. */
function solidsBetween(bvh: MeshBVH, a: PlanPoint, b: PlanPoint, device: PlanPoint): number {
  const o = vec(a);
  const t = vec(b);
  const len = o.distanceTo(t);
  if (len < 0.01) return 0;
  const dir = t.clone().sub(o).normalize();
  const hits = (bvh.raycast(new Ray(o, dir), DoubleSide) as { distance: number }[])
    .filter((h) => h.distance <= len - 0.001)
    .sort((x, y) => x.distance - y.distance);
  const target = vec(device);
  let count = 0;
  let last = -1;
  for (const h of hits) {
    if (last < 0 || h.distance - last > 0.02) {
      if (o.clone().addScaledVector(dir, h.distance).distanceTo(target) > DEVICE_CLEARANCE_M) count++;
    }
    last = h.distance;
  }
  return count;
}

export interface CablingLayer {
  /** Data trays and conduits. */
  readonly pathways: Group;
  /** Wall and slab sleeves (the holes). */
  readonly penetrations: Group;
  /** Conduit drops from the trays to each AP / camera. */
  readonly drops: Group;
}

export function createCablingLayer(bvh: MeshBVH): CablingLayer {
  const pathways = new Group();
  pathways.name = 'cablingPathways';
  const penetrations = new Group();
  penetrations.name = 'cablingPenetrations';
  const drops = new Group();
  drops.name = 'cablingDrops';

  const trayMat = new MeshStandardMaterial({ color: TRAY_COLOR, roughness: 0.55, metalness: 0.7 });
  const conduitMat = new MeshStandardMaterial({ color: CONDUIT_COLOR, roughness: 0.5, metalness: 0.8 });
  const sleeveMat = new MeshStandardMaterial({ color: SLEEVE_COLOR, roughness: 0.5, emissive: SLEEVE_COLOR, emissiveIntensity: 0.25 });
  const dropMat = new MeshStandardMaterial({ color: DROP_COLOR, roughness: 0.5, metalness: 0.8 });

  const pickMat = new MeshBasicMaterial({ visible: false });
  const plasticMat = new MeshStandardMaterial({ color: PLASTIC_COLOR, roughness: 0.7, metalness: 0.0 });
  const junctionMat = new MeshStandardMaterial({ color: JUNCTION_COLOR, roughness: 0.5, metalness: 0.7 });

  for (const w of PATHWAYS.filter((x) => x.service === 'data' && !x.physical)) {
    for (let i = 1; i < w.points.length; i++) {
      const a = vec(w.points[i - 1]!);
      const b = vec(w.points[i]!);
      const piece =
        w.kind === 'tray'
          ? traySegment(a, b, w.widthMm / 1000, w.depthMm / 1000, trayMat)
          : w.kind === 'plastic'
            ? boxBetween(a, b, w.widthMm / 1000, w.depthMm / 1000, plasticMat)
            : cylinderBetween(a, b, w.widthMm / 2000 + CONDUIT_WALL_M, conduitMat);
      if (piece) {
        piece.userData = { pathway: w.id, label: w.label, info: { type: 'pathway', id: w.id } };
        pathways.add(piece);
        if (w.kind !== 'tray') {
          const hit = cylinderBetween(a, b, CONDUIT_PICK_R, pickMat);
          if (hit) {
            hit.userData = { info: { type: 'pathway', id: w.id } };
            pathways.add(hit);
          }
        }
      }
    }
  }

  const probe = bvhProbe(bvh);
  // Junction boxes of the EMT and plastic branches: entry, one per drop, and pull boxes on long runs.
  for (const j of JUNCTIONS) {
    const box = new Mesh(new BoxGeometry(JUNCTION_SIZE.w, JUNCTION_SIZE.h, JUNCTION_SIZE.d), junctionMat);
    box.position.copy(vec(j.at));
    // The box sits on the wall the conduit lies on: back against it, depth along the wall normal.
    const wall = anchorAt(j.at, { x: 0, y: 0, h: 0 } as Dir, probe, false, BOX_WALL_REACH_M);
    if (wall.status !== 'none') {
      const normal = vec(wall.dir).normalize();
      box.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), normal);
      box.position.copy(vec(wall.anchor)).addScaledVector(normal, -JUNCTION_SIZE.d / 2);
    }
    box.userData = { junction: j.kind, pathway: j.pathway, info: { type: 'pathway', id: j.pathway } };
    pathways.add(box);
  }

  // North IDF: wall cabinet against the north wall (its back on the wall face), door toward the courts.
  const cabinetMat = new MeshStandardMaterial({ color: 0x2c3138, roughness: 0.5, metalness: 0.6 });
  const cabinet = new Mesh(new BoxGeometry(IDF.size.w, IDF.size.h, IDF.size.d), cabinetMat);
  cabinet.position.set(IDF.position.x, IDF.position.h, IDF.size.d / 2 + 0.02);
  cabinet.name = IDF.id;
  cabinet.userData = { id: IDF.id, ports: IDF.ports, info: { type: 'idf' } };
  pathways.add(cabinet);

  for (const pen of PENETRATIONS) {
    const axis = sleeveAxis(pen);
    const half = (pen.thicknessM + 0.1) / 2;
    const c = vec(pen.position);
    const sleeve = cylinderBetween(c.clone().addScaledVector(axis, -half), c.clone().addScaledVector(axis, half), pen.diameterMm / 2000 + 0.015, sleeveMat);
    if (sleeve) {
      sleeve.name = pen.id;
      sleeve.userData = { id: pen.id, description: pen.description, info: { type: 'sleeve', id: pen.id } };
      penetrations.add(sleeve);
    }
  }

  const ceilingAps = new Set(MODEL_ACCESS_POINTS.filter((a) => a.mountHint?.kind === 'ceiling').map((a) => a.id));
  for (const r of DEVICE_ROUTES) {
    const d = r.device.position;
    const target = ceilingAps.has(r.device.id) ? { ...d, h: d.h - CEILING_INSET_M } : d;
    const plan = planDrop(r.attach, target, (p, q) => solidsBetween(bvh, p, q, target));
    for (let i = 1; i < plan.points.length; i++) {
      const piece = cylinderBetween(vec(plan.points[i - 1]!), vec(plan.points[i]!), DROP_R, dropMat);
      if (piece) {
        const info = { type: 'drop', id: r.device.id, blocked: plan.blocked };
        piece.userData = { device: r.device.id, blocked: plan.blocked, info };
        drops.add(piece);
        const hit = cylinderBetween(vec(plan.points[i - 1]!), vec(plan.points[i]!), DROP_PICK_R, pickMat);
        if (hit) {
          hit.userData = { info };
          drops.add(hit);
        }
      }
    }
  }
  return { pathways, penetrations, drops };
}
