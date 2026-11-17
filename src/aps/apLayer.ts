import {
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Plane,
  Ray,
  RingGeometry,
  SphereGeometry,
  Vector3,
  type Camera,
  type Raycaster,
} from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { MeshBVH } from 'three-mesh-bvh';
import type { AccessPoint } from '../data/aps.ts';
import { findMountingWall } from './mounting.ts';
import type { ApWithPosition } from './selection.ts';

/** APs farther than this from any wall are flagged as "not mounted in the model". */
export const MOUNT_TOLERANCE_M = 0.6;
/** Approximate coverage radius drawn by the toggle. Not an RF simulation. */
export const COVERAGE_RADIUS_M = 15;

const MARKER_COLOR = 0x36c2d6;
const UNMOUNTED_COLOR = 0xf2a43a;
const LABEL_OFFSET_H = 0.35;

export interface ApItem extends ApWithPosition {
  /** True when a wall was found within MOUNT_TOLERANCE_M. */
  readonly mounted: boolean;
  readonly wallDistance: number | null;
  readonly label: HTMLDivElement;
  readonly marker: Mesh;
}

export interface ApLayer {
  readonly group: Group;
  readonly items: readonly ApItem[];
  setCoverage(mode: { sphere: boolean; floor: boolean }): void;
  /** Highlights the AP shown in the panel (null clears). */
  setHighlighted(id: string | null): void;
  /** AP hit by the raycaster, or null. */
  pick(raycaster: Raycaster): ApItem | null;
  /** Dims labels hidden behind walls; call every few frames. */
  updateOcclusion(camera: Camera): void;
  /** Pulses the highlighted marker. */
  animate(time: number): void;
  /**
   * Geometry above this height is ignored when deciding whether an AP is
   * hidden behind something (used while the roof is cut away). null = none.
   */
  setOccluderCeiling(h: number | null): void;
}

/** Axis-aligned building footprint in plan coordinates (meters). */
export interface Footprint {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  /** Top of the building (h); coverage spheres are cut here. */
  readonly maxH: number;
}

export function createApLayer(aps: readonly AccessPoint[], bvh: MeshBVH, footprint: Footprint): ApLayer {
  const group = new Group();
  group.name = 'aps';
  const spheres = new Group();
  const floors = new Group();
  spheres.visible = false;
  floors.visible = false;
  group.add(spheres, floors);

  const discGeo = new CylinderGeometry(0.13, 0.13, 0.045, 28);
  const freeGeo = new SphereGeometry(0.14, 20, 12);
  const hitGeo = new SphereGeometry(0.6, 8, 6);
  const hitMat = new MeshBasicMaterial({ visible: false });
  const coverageSphereGeo = new SphereGeometry(COVERAGE_RADIUS_M, 40, 20);
  // Coverage is only drawn inside the building footprint.
  const clippingPlanes = footprintPlanes(footprint);
  const sphereClipping = [...clippingPlanes, new Plane(new Vector3(0, -1, 0), footprint.maxH)];
  const coverageMat = new MeshBasicMaterial({
    color: MARKER_COLOR,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    side: DoubleSide,
    clippingPlanes: sphereClipping,
  });
  const floorFillMat = new MeshBasicMaterial({
    color: MARKER_COLOR,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    clippingPlanes,
  });
  const floorRingMat = floorFillMat.clone();
  floorRingMat.opacity = 0.6;

  const up = new Vector3(0, 1, 0);
  const items: ApItem[] = aps.map((ap, index) => {
    const tablePos = new Vector3(ap.position.x, ap.position.h, ap.position.y);
    const mount = findMountingWall(bvh, tablePos, 3);
    const mounted = !!mount && mount.distance <= MOUNT_TOLERANCE_M;

    const material = new MeshStandardMaterial({
      color: 0xf4f6f8,
      emissive: mounted ? MARKER_COLOR : UNMOUNTED_COLOR,
      emissiveIntensity: 0.7,
      roughness: 0.4,
    });
    const marker = new Mesh(mounted ? discGeo : freeGeo, material);
    marker.name = ap.id;
    if (mounted && mount) {
      // Flush against the wall surface, facing the room.
      marker.position.copy(mount.point).addScaledVector(mount.normal, 0.025);
      marker.position.y = ap.position.h;
      marker.quaternion.setFromUnitVectors(up, mount.normal);
    } else {
      marker.position.copy(tablePos);
    }
    const hit = new Mesh(hitGeo, hitMat);
    hit.userData.apId = ap.id;
    marker.add(hit);
    group.add(marker);

    const label = document.createElement('div');
    label.className = mounted ? 'ap-label' : 'ap-label ap-label--warn';
    label.textContent = mounted ? ap.id : `${ap.id} ⚠`;
    const labelObj = new CSS2DObject(label);
    labelObj.position.set(0, 0, 0);
    labelObj.center.set(0.5, 1);
    const labelAnchor = new Group();
    labelAnchor.position.copy(marker.position).setY(marker.position.y + LABEL_OFFSET_H);
    labelAnchor.add(labelObj);
    group.add(labelAnchor);

    // Coverage: sphere around the AP and its cut with the floor below.
    const sphere = new Mesh(coverageSphereGeo, coverageMat);
    sphere.position.copy(marker.position);
    sphere.renderOrder = 2;
    spheres.add(sphere);

    const floorH = floorBelow(bvh, marker.position);
    const dh = marker.position.y - floorH;
    if (dh < COVERAGE_RADIUS_M) {
      const r = Math.sqrt(COVERAGE_RADIUS_M ** 2 - dh ** 2);
      const fill = new Mesh(new CircleGeometry(r, 64), floorFillMat);
      const ring = new Mesh(new RingGeometry(r - 0.08, r, 96), floorRingMat);
      for (const m of [fill, ring]) {
        m.rotation.x = -Math.PI / 2;
        // Tiny per-AP lift keeps overlapping translucent discs from z-fighting.
        m.position.set(marker.position.x, floorH + 0.02 + index * 0.002, marker.position.z);
        m.renderOrder = 3;
        floors.add(m);
      }
    }

    return {
      ap,
      position: marker.position,
      mounted,
      wallDistance: mount ? mount.distance : null,
      label,
      marker,
    };
  });

  let highlighted: ApItem | null = null;
  let occluderCeiling: number | null = null;
  const byId = new Map(items.map((i) => [i.ap.id, i]));
  const occlusionRay = new Ray();
  const toMarker = new Vector3();

  /** Distance to the first blocking surface along `ray`, ignoring cut-away geometry. */
  const blockingDistance = (ray: Ray, far: number): number => {
    if (occluderCeiling === null) return bvh.raycastFirst(ray, DoubleSide, 0, far)?.distance ?? Infinity;
    let best = Infinity;
    for (const hit of bvh.raycast(ray, DoubleSide, 0, far)) {
      if (hit.point.y <= occluderCeiling && hit.distance < best) best = hit.distance;
    }
    return best;
  };

  return {
    group,
    items,
    setCoverage({ sphere, floor }) {
      spheres.visible = sphere;
      floors.visible = floor;
    },
    setHighlighted(id) {
      for (const item of items) item.label.classList.toggle('ap-label--active', item.ap.id === id);
      if (highlighted) (highlighted.marker.material as MeshStandardMaterial).emissiveIntensity = 0.7;
      highlighted = id ? (byId.get(id) ?? null) : null;
    },
    pick(raycaster) {
      const hits = raycaster.intersectObjects(items.map((i) => i.marker), true);
      const apHit = hits.find((h) => h.object.userData.apId);
      if (!apHit) return null;
      // Ignore APs behind a wall.
      if (blockingDistance(raycaster.ray, apHit.distance) < apHit.distance - 0.7) return null;
      return byId.get(apHit.object.userData.apId as string) ?? null;
    },
    updateOcclusion(camera) {
      for (const item of items) {
        toMarker.subVectors(item.position, camera.position);
        const dist = toMarker.length();
        occlusionRay.origin.copy(camera.position);
        occlusionRay.direction.copy(toMarker).divideScalar(dist);
        item.label.classList.toggle('ap-label--occluded', blockingDistance(occlusionRay, dist) < dist - 0.3);
      }
    },
    setOccluderCeiling(h) {
      occluderCeiling = h;
    },
    animate(time) {
      if (!highlighted) return;
      (highlighted.marker.material as MeshStandardMaterial).emissiveIntensity = 1.2 + 0.8 * Math.sin(time * 5);
    },
  };
}

function footprintPlanes(f: Footprint): Plane[] {
  // Plane keeps points where normal·p + constant >= 0. three: x = plan X, z = plan Y.
  return [
    new Plane(new Vector3(1, 0, 0), -f.minX),
    new Plane(new Vector3(-1, 0, 0), f.maxX),
    new Plane(new Vector3(0, 0, 1), -f.minY),
    new Plane(new Vector3(0, 0, -1), f.maxY),
  ];
}

function floorBelow(bvh: MeshBVH, from: Vector3): number {
  const hit = bvh.raycastFirst(new Ray(from.clone(), new Vector3(0, -1, 0)), DoubleSide);
  return hit ? hit.point.y : 0;
}
