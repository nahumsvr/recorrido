import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three';
import { planToThree, type PlanPoint } from '../domain/coords.ts';
import { ROOM_CABLES, WALL_FIXTURES, type WiringKind, type WallFixture } from '../data/networkRoomWiring.ts';

const CABLE_R: Readonly<Record<WiringKind, number>> = { power: 0.007, data: 0.0035, video: 0.003 };
const CABLE_COLOR: Readonly<Record<WiringKind, number>> = { power: 0xe8742a, data: 0x2f9bff, video: 0xd9dde2 };

const vec = (p: PlanPoint): Vector3 => new Vector3(...planToThree(p));

function addCable(parent: Group, points: readonly PlanPoint[], radius: number, mat: MeshStandardMaterial, userData: Record<string, unknown>): void {
  const joint = new SphereGeometry(radius, 8, 6);
  points.forEach((pt, i) => {
    // A small ball at each vertex hides the gap between two segments at a bend.
    const ball = new Mesh(joint, mat);
    ball.position.copy(vec(pt));
    ball.userData = userData;
    parent.add(ball);
    if (i === 0) return;
    const a = vec(points[i - 1]!);
    const b = vec(pt);
    const len = a.distanceTo(b);
    if (len < 0.005) return;
    const seg = new Mesh(new CylinderGeometry(radius, radius, len, 8), mat);
    seg.position.copy(a).add(b).multiplyScalar(0.5);
    seg.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
    seg.userData = userData;
    parent.add(seg);
  });
}

/** Faceplate on the inner face of a wall: outlet (power) or RJ45 jack (data). */
function fixtureMesh(f: WallFixture): Group {
  const g = new Group();
  g.name = f.id;
  g.position.copy(vec(f.position));
  // Plates face into the room: north wall → +Z (south), east wall → -X (west).
  g.rotation.y = f.wall === 'east' ? -Math.PI / 2 : 0;
  const plateMat = new MeshStandardMaterial({ color: f.id === 'OUT-N1' ? 0xc2410c : 0xeeeeea, roughness: 0.6 });
  const darkMat = new MeshStandardMaterial({ color: 0x15181c, roughness: 0.6 });
  const dedicated = f.id === 'OUT-N1';
  const size = dedicated ? { w: 0.12, h: 0.12 } : f.kind === 'power' ? { w: 0.07, h: 0.115 } : { w: 0.07, h: 0.07 };
  g.add(new Mesh(new BoxGeometry(size.w, size.h, 0.02), plateMat));
  const slot = (x: number, y: number, w: number, h: number): void => {
    const m = new Mesh(new BoxGeometry(w, h, 0.004), darkMat);
    m.position.set(x, y, 0.011);
    g.add(m);
  };
  if (f.kind === 'data') slot(0, 0, 0.022, 0.018);
  else if (dedicated) {
    // Locking 30 A receptacle: round face with three slots.
    const face = new Mesh(new CylinderGeometry(0.04, 0.04, 0.004, 16), darkMat);
    face.rotation.x = Math.PI / 2;
    face.position.z = 0.011;
    g.add(face);
  } else {
    for (const y of [0.028, -0.028]) {
      slot(-0.009, y, 0.004, 0.012);
      slot(0.009, y, 0.004, 0.012);
    }
  }
  g.userData = { id: f.id, label: f.label };
  return g;
}

/**
 * Everything wired inside the network room: wall outlets and jack, power cords
 * (orange), network patch cords (blue) and the monitor cable (gray).
 * Purely visual: no collisions, no picking.
 */
export function createNetworkRoomWiring(): Group {
  const root = new Group();
  root.name = 'networkRoomWiring';
  for (const f of WALL_FIXTURES) root.add(fixtureMesh(f));
  const mats = {} as Record<WiringKind, MeshStandardMaterial>;
  for (const k of ['power', 'data', 'video'] as const) mats[k] = new MeshStandardMaterial({ color: CABLE_COLOR[k], roughness: 0.6 });
  for (const c of ROOM_CABLES) addCable(root, c.points, CABLE_R[c.kind], mats[c.kind], { cable: c.id, label: c.label });
  root.traverse((o) => {
    o.raycast = () => {};
  });
  return root;
}
