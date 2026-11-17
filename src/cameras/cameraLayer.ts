import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Plane,
  Ray,
  SphereGeometry,
  Vector3,
  type Camera,
  type Raycaster,
} from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { MeshBVH } from 'three-mesh-bvh';
import { findMountingWall } from '../aps/mounting.ts';
import { MODEL_SPECS, type CameraKind, type SecurityCamera } from '../data/cameras.ts';
import { verticalFov } from './cctvMath.ts';

export const CAMERA_COLOR = 0x9be564;
const UNMOUNTED_COLOR = 0xf2a43a;
/** Farther than this from any wall the camera is flagged as not mounted. */
const MOUNT_TOLERANCE_M = 1;
/** View pyramid drawn with the real horizontal FOV; its length is illustrative, not an optical simulation. */
const FOV_LENGTH_M = { dome: 13, bullet: 18 } as const;
/** Lens position relative to the mount: out along the wall normal, then along the aim (bullet barrel). */
const LENS_OUT_M = { dome: 0.115, bullet: 0.1 } as const;
const LENS_AHEAD_M = { dome: 0, bullet: 0.23 } as const;
const LABEL_OFFSET_H = 0.3;
/** Invisible sphere that makes a camera easy to click. */
const HIT_RADIUS_M = 0.35;
const SELECTED_GLOW = 1.8;
const NORMAL_GLOW = 0.55;

export interface CameraItem {
  readonly camera: SecurityCamera;
  /** Mount point on the wall surface (world). */
  readonly position: Vector3;
  readonly mounted: boolean;
  /** Distance to the wall holding it, or null when none is within reach. */
  readonly wallDistance: number | null;
  /** Where the lens sits and the unit direction it looks at (world). */
  readonly lensPosition: Vector3;
  readonly aim: Vector3;
  readonly label: HTMLDivElement;
}

export interface CameraLayer {
  readonly group: Group;
  /** Live list: an entry is replaced in place when its camera is rebuilt. */
  readonly items: readonly CameraItem[];
  /** All view pyramids on or off (the selected camera always shows its own). */
  setFov(visible: boolean): void;
  setSelected(id: string | null): void;
  /** Rebuilds one camera (after an edit) and returns its new item. */
  update(index: number, camera: SecurityCamera): CameraItem;
  /** Camera hit by the raycaster (null when the layer is hidden). */
  pick(raycaster: Raycaster): CameraItem | null;
  /** Dims labels hidden behind walls; call every few frames. */
  updateOcclusion(camera: Camera): void;
}

interface Entry {
  item: CameraItem;
  readonly root: Group;
  readonly fovMesh: Mesh;
  readonly material: MeshStandardMaterial;
}

const kindLabel = (k: CameraKind): string => (k === 'dome' ? 'dome' : 'bullet');
const UP = new Vector3(0, 1, 0);

/** Wall-side hardware in the wall frame: +Y is the wall normal. */
function buildMount(kind: CameraKind, material: MeshStandardMaterial): Group {
  const body = new Group();
  const plate = new Mesh(new CylinderGeometry(0.09, 0.09, 0.03, 20), material);
  plate.position.y = 0.015;
  body.add(plate);
  if (kind === 'dome') {
    const dome = new Mesh(new SphereGeometry(0.085, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), material);
    dome.position.y = 0.03;
    body.add(dome);
  } else {
    const arm = new Mesh(new BoxGeometry(0.035, 0.07, 0.035), material);
    arm.position.y = 0.06;
    body.add(arm);
  }
  return body;
}

/** Bullet housing; +Z is the aim direction (use Object3D.lookAt). */
function buildBulletHead(material: MeshStandardMaterial): Group {
  const head = new Group();
  const tube = new Mesh(new CylinderGeometry(0.045, 0.045, 0.24, 16), material);
  tube.rotation.x = Math.PI / 2;
  tube.position.z = 0.1;
  const shield = new Mesh(new BoxGeometry(0.11, 0.012, 0.22), material);
  shield.position.set(0, 0.055, 0.12);
  head.add(tube, shield);
  return head;
}

/** Aim: the wall normal turned by `panDeg` around Y, then tilted `tiltDeg` toward the floor. */
export function aimDirection(normal: Vector3, panDeg: number, tiltDeg: number): Vector3 {
  const tilt = (tiltDeg * Math.PI) / 180;
  const horizontal = normal.clone().setY(0).normalize().applyAxisAngle(UP, (panDeg * Math.PI) / 180);
  return horizontal.multiplyScalar(Math.cos(tilt)).setY(-Math.sin(tilt)).normalize();
}

/** Building footprint in plan coordinates (meters); view cones are cut to it. */
export interface CameraBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export function createCameraLayer(cameras: readonly SecurityCamera[], bvh: MeshBVH, bounds: CameraBounds): CameraLayer {
  const group = new Group();
  group.name = 'cameras';

  const fovMat = new MeshBasicMaterial({
    color: CAMERA_COLOR,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    side: DoubleSide,
    // Plane keeps points where normal·p + constant >= 0 (three: x = plan X, z = plan Y).
    clippingPlanes: [
      new Plane(new Vector3(1, 0, 0), -bounds.minX),
      new Plane(new Vector3(-1, 0, 0), bounds.maxX),
      new Plane(new Vector3(0, 0, 1), -bounds.minY),
      new Plane(new Vector3(0, 0, -1), bounds.maxY),
      new Plane(new Vector3(0, 1, 0), 0),
    ],
  });
  const hitGeo = new SphereGeometry(HIT_RADIUS_M, 8, 6);
  const hitMat = new MeshBasicMaterial({ visible: false });

  let fovAll = false;
  let selectedId: string | null = null;

  const build = (cam: SecurityCamera): Entry => {
    const p = new Vector3(cam.position.x, cam.position.h, cam.position.y);
    const mount = findMountingWall(bvh, p, MOUNT_TOLERANCE_M);
    const mounted = !!mount;
    const material = new MeshStandardMaterial({
      color: 0x1b1f24,
      emissive: mounted ? CAMERA_COLOR : UNMOUNTED_COLOR,
      emissiveIntensity: NORMAL_GLOW,
      roughness: 0.45,
    });

    const position = p.clone();
    const normal = new Vector3(0, 0, 1);
    if (mount) {
      normal.copy(mount.normal);
      position.copy(mount.point).addScaledVector(normal, 0.005);
      position.y = cam.position.h;
    }

    const root = new Group();
    root.name = cam.id;
    const mountBody = buildMount(cam.kind, material);
    mountBody.quaternion.setFromUnitVectors(UP, normal);
    mountBody.position.copy(position);
    root.add(mountBody);

    const aim = aimDirection(normal, cam.panDeg, cam.tiltDeg);
    if (cam.kind === 'bullet') {
      const head = buildBulletHead(material);
      head.position.copy(position).addScaledVector(normal, 0.1);
      head.lookAt(head.position.clone().add(aim));
      root.add(head);
    }
    const hit = new Mesh(hitGeo, hitMat);
    hit.position.copy(position).addScaledVector(normal, 0.1);
    root.add(hit);

    const lensPosition = position
      .clone()
      .addScaledVector(normal, LENS_OUT_M[cam.kind])
      .addScaledVector(aim, LENS_AHEAD_M[cam.kind]);

    // Rectangular view pyramid with the lens HFOV; 16:9 image.
    const aspect = MODEL_SPECS[cam.kind].aspect;
    const length = FOV_LENGTH_M[cam.kind];
    const hx = Math.tan((cam.lens.hfov * Math.PI) / 360) * length;
    const hy = Math.tan((verticalFov(cam.lens.hfov, aspect) * Math.PI) / 360) * length;
    const pyramidGeo = new BufferGeometry();
    pyramidGeo.setAttribute(
      'position',
      new Float32BufferAttribute(
        [0, 0, 0, hx, hy, length, -hx, hy, length, 0, 0, 0, -hx, hy, length, -hx, -hy, length, 0, 0, 0, -hx, -hy, length, hx, -hy, length, 0, 0, 0, hx, -hy, length, hx, hy, length],
        3,
      ),
    );
    const fovMesh = new Mesh(pyramidGeo, fovMat);
    fovMesh.position.copy(lensPosition);
    fovMesh.lookAt(lensPosition.clone().add(aim));
    fovMesh.renderOrder = 2;
    fovMesh.visible = !cam.hidden && (fovAll || cam.id === selectedId);

    const label = document.createElement('div');
    label.className = ['ap-label', 'cam-label', mounted ? '' : 'ap-label--warn'].filter(Boolean).join(' ');
    label.textContent = `${cam.id} · ${kindLabel(cam.kind)}${mounted ? '' : ' ⚠'}`;
    label.title = [cam.model, cam.zone, cam.note].filter(Boolean).join(' — ');
    label.classList.toggle('cam-label--sel', cam.id === selectedId);
    const labelObj = new CSS2DObject(label);
    labelObj.center.set(0.5, 1);
    const anchor = new Group();
    anchor.position.copy(position).setY(position.y + LABEL_OFFSET_H);
    anchor.add(labelObj);
    root.add(anchor);
    // A hidden camera disappears completely (CSS2D labels ignore a hidden parent, so hide it explicitly).
    root.visible = !cam.hidden;
    labelObj.visible = !cam.hidden;

    root.traverse((o) => {
      o.userData.camId = cam.id;
    });
    material.emissiveIntensity = cam.id === selectedId ? SELECTED_GLOW : NORMAL_GLOW;

    const item: CameraItem = {
      camera: cam,
      position,
      mounted,
      wallDistance: mount ? mount.distance : null,
      lensPosition,
      aim,
      label,
    };
    return { item, root, fovMesh, material };
  };

  const entries: Entry[] = cameras.map(build);
  for (const e of entries) group.add(e.root, e.fovMesh);
  const items: CameraItem[] = entries.map((e) => e.item);

  const dispose = (e: Entry): void => {
    group.remove(e.root, e.fovMesh);
    e.item.label.remove();
    e.fovMesh.geometry.dispose();
    e.material.dispose();
    e.root.traverse((o) => {
      if (o instanceof Mesh && o !== e.fovMesh && o.geometry !== hitGeo) o.geometry.dispose();
    });
  };

  const occlusionRay = new Ray();
  const toMarker = new Vector3();

  return {
    group,
    items,
    setFov(visible) {
      fovAll = visible;
      for (const e of entries) e.fovMesh.visible = !e.item.camera.hidden && (fovAll || e.item.camera.id === selectedId);
    },
    setSelected(id) {
      selectedId = id;
      for (const e of entries) {
        const on = e.item.camera.id === id;
        e.material.emissiveIntensity = on ? SELECTED_GLOW : NORMAL_GLOW;
        e.item.label.classList.toggle('cam-label--sel', on);
        e.fovMesh.visible = !e.item.camera.hidden && (fovAll || on);
      }
    },
    update(index, camera) {
      const old = entries[index];
      if (!old) throw new Error(`no camera at index ${index}`);
      dispose(old);
      const next = build(camera);
      entries[index] = next;
      items[index] = next.item;
      group.add(next.root, next.fovMesh);
      return next.item;
    },
    pick(raycaster) {
      if (!group.visible) return null;
      const hits = raycaster.intersectObjects(
        entries.map((e) => e.root),
        true,
      );
      const hit = hits.find((h) => typeof h.object.userData.camId === 'string' && h.object.visible && h.object.parent?.visible !== false);
      if (!hit) return null;
      return items.find((i) => i.camera.id === hit.object.userData.camId) ?? null;
    },
    updateOcclusion(camera) {
      for (const item of items) {
        if (item.camera.hidden) continue;
        toMarker.subVectors(item.position, camera.position);
        const dist = toMarker.length();
        occlusionRay.origin.copy(camera.position);
        occlusionRay.direction.copy(toMarker).divideScalar(dist);
        const hit = bvh.raycastFirst(occlusionRay, DoubleSide, 0, dist);
        item.label.classList.toggle('ap-label--occluded', !!hit && hit.distance < dist - 0.3);
      }
    },
  };
}
