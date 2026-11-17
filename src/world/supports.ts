import { BoxGeometry, CylinderGeometry, DoubleSide, Group, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Ray, SphereGeometry, Vector3 } from 'three';
import type { MeshBVH } from 'three-mesh-bvh';
import { EMT_OD_MM, PATHWAYS, RMC_OD_MM, type Pathway } from '../data/cabling.ts';
import { supportsOf } from '../data/pathwaySupports.ts';
import { planToThree } from '../domain/coords.ts';
import { tally, type Probe, type Support, type SupportStats } from '../domain/supports.ts';

const OK_COLOR = 0x8a929c;
const THIN_COLOR = 0xf2a43a;
const NONE_COLOR = 0xff4d4d;
const ROD_R = 0.008;
const PLATE = { size: 0.1, thickness: 0.012 } as const;
/** Faces closer than this are the same face seen twice. */
const SAME_FACE_M = 0.01;

export interface SupportLayer {
  /** Brackets, hanger rods and anchor plates of trays and raceways; straps on every conduit. */
  readonly group: Group;
  /** Supports by pathway id. */
  readonly stats: ReadonlyMap<string, SupportStats>;
}

const vec = (p: { x: number; y: number; h: number }): Vector3 => new Vector3(...planToThree(p));

export function bvhProbe(bvh: MeshBVH): Probe {
  return (origin, dir) => {
    const hits = (bvh.raycast(new Ray(vec(origin), vec(dir)), DoubleSide) as { distance: number }[])
      .map((h) => h.distance)
      .filter((d) => d > 0.001)
      .sort((a, b) => a - b)
      .filter((d, i, all) => i === 0 || d - all[i - 1]! > SAME_FACE_M);
    const first = hits[0];
    if (first === undefined) return null;
    return { distance: first, thickness: hits[1] === undefined ? Infinity : hits[1] - first };
  };
}

/** Bracket arm / hanger rod from the pathway to the surface, plus the plate on the surface. */
function drawSupport(s: Support, mats: Record<'ok' | 'thin' | 'none', MeshStandardMaterial>): Group {
  const g = new Group();
  g.userData = { support: s.status, kind: s.kind };
  const at = vec(s.at);
  if (s.status === 'none') {
    const marker = new Mesh(new SphereGeometry(0.1, 12, 8), mats.none);
    marker.position.copy(at);
    g.add(marker);
    return g;
  }
  const mat = mats[s.status];
  const to = vec(s.anchor);
  const len = at.distanceTo(to);
  const dir = vec(s.dir);
  if (len > 0.01) {
    const arm = new Mesh(new CylinderGeometry(ROD_R, ROD_R, len, 8), mat);
    arm.position.copy(at).add(to).multiplyScalar(0.5);
    arm.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir);
    g.add(arm);
  }
  const plate = new Mesh(new BoxGeometry(PLATE.size, PLATE.size, PLATE.thickness), mat);
  plate.position.copy(to).addScaledVector(dir, -PLATE.thickness / 2);
  plate.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), dir);
  g.add(plate);
  return g;
}

const STRAP_WIRE_R = 0.0022;
/** Width of the band around the tube. */
const STRAP_BAND_W = 0.02;
const STRAP_COLOR = 0xe3e7ec;
const STRAP_EAR = { across: 0.05, along: 0.016, thickness: 0.003 } as const;

/** One-hole-per-ear conduit strap: a band around the tube and a flat ear screwed to the wall. */
function drawStrap(s: Support, tubeOd: number, mat: MeshStandardMaterial): Group {
  const g = new Group();
  g.userData = { support: s.status, kind: 'strap' };
  const at = vec(s.at);
  const dir = vec(s.dir).normalize();
  const run = vec(s.run ?? { x: 1, y: 0, h: 0 }).normalize();
  const ring = new Mesh(new CylinderGeometry(tubeOd / 2 + STRAP_WIRE_R, tubeOd / 2 + STRAP_WIRE_R, STRAP_BAND_W, 24, 1, true), mat);
  ring.position.copy(at);
  ring.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), run);
  g.add(ring);
  const wall = vec(s.anchor);
  const across = new Vector3().crossVectors(run, dir).normalize();
  const basis = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(across, run, dir));
  const ear = new Mesh(new BoxGeometry(STRAP_EAR.across, STRAP_EAR.along, STRAP_EAR.thickness), mat);
  ear.position.copy(wall).addScaledVector(dir, -STRAP_EAR.thickness / 2);
  ear.quaternion.copy(basis);
  g.add(ear);
  const gap = at.distanceTo(wall) - tubeOd / 2 - STRAP_WIRE_R;
  if (gap > 0.002) {
    const bridge = new Mesh(new BoxGeometry(0.012, STRAP_EAR.along, gap), mat);
    bridge.position.copy(at).addScaledVector(dir, tubeOd / 2 + STRAP_WIRE_R + gap / 2);
    bridge.quaternion.copy(basis);
    g.add(bridge);
  }
  return g;
}

const tubeOdOf = (w: Pathway): number => ((w.kind === 'rmc' ? RMC_OD_MM : EMT_OD_MM)[w.trade ?? ''] ?? w.widthMm + 3) / 1000;

export function createSupportLayer(bvh: MeshBVH): SupportLayer {
  const group = new Group();
  group.name = 'supports';
  const probe = bvhProbe(bvh);
  const mats = {
    ok: new MeshStandardMaterial({ color: OK_COLOR, roughness: 0.5, metalness: 0.8 }),
    strap: new MeshStandardMaterial({ color: STRAP_COLOR, roughness: 0.35, metalness: 0.6, side: DoubleSide }),
    thin: new MeshStandardMaterial({ color: THIN_COLOR, roughness: 0.5, emissive: THIN_COLOR, emissiveIntensity: 0.3 }),
    none: new MeshStandardMaterial({ color: NONE_COLOR, roughness: 0.5, emissive: NONE_COLOR, emissiveIntensity: 0.5 }),
  };
  const stats = new Map<string, SupportStats>();
  // Sleeves go through the wall and need no bracket; shared pathways are drawn once.
  for (const w of PATHWAYS.filter((x) => x.kind !== 'conduit' && !x.physical)) {
    const supports = supportsOf(w, probe);
    stats.set(w.id, tally(supports));
    for (const s of supports) group.add((w.kind === 'emt' || w.kind === 'rmc') && s.status !== 'none' ? drawStrap(s, tubeOdOf(w), s.status === 'ok' ? mats.strap : mats.thin) : drawSupport(s, mats));
  }
  return { group, stats };
}
