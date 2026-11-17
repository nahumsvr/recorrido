import {
  Color,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Fog,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  Plane,
  Scene,
  Vector3,
  type BufferGeometry,
} from 'three';
import { computeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { LAYOUT } from '../config/alignment.ts';
import type { AuditoriumModel } from './loadModel.ts';
import { PROPS_COLOR } from './palette.ts';
import { createCourtLines } from './courtLines.ts';

// Enable BVH-accelerated raycasts on every Mesh.
(Mesh.prototype as Mesh).raycast = acceleratedRaycast;

export interface World {
  readonly scene: Scene;
  readonly building: Mesh;
  readonly edges: LineSegments;
  /** Clips everything above it; toggled by "cut roof". */
  readonly roofCut: Plane;
  setRoofCut(enabled: boolean): void;
}

const EDGE_THRESHOLD_DEG = 30;

export function createWorld(model: AuditoriumModel): World {
  const scene = new Scene();
  scene.background = new Color(0x1d2128);
  scene.fog = new Fog(0x1d2128, 60, 160);

  const roofCut = new Plane(new Vector3(0, -1, 0), LAYOUT.roofStartH - 0.1);
  const clipping: Plane[] = [];

  const buildingMat = new MeshStandardMaterial({
    vertexColors: true,
    side: DoubleSide,
    roughness: 0.9,
    metalness: 0,
    clippingPlanes: clipping,
  });
  const building = new Mesh(model.building, buildingMat);
  building.name = 'building';
  (model.building as BufferGeometry & { computeBoundsTree: typeof computeBoundsTree }).computeBoundsTree =
    computeBoundsTree;
  (model.building as BufferGeometry & { computeBoundsTree: typeof computeBoundsTree }).computeBoundsTree();
  scene.add(building);

  const edges = new LineSegments(
    new EdgesGeometry(model.building, EDGE_THRESHOLD_DEG),
    new LineBasicMaterial({ color: 0x2a2f38, transparent: true, opacity: 0.55, clippingPlanes: clipping }),
  );
  scene.add(edges);

  const props = new Mesh(
    model.props,
    new MeshStandardMaterial({ color: PROPS_COLOR, roughness: 0.6, metalness: 0.2, side: DoubleSide }),
  );
  props.name = 'props';
  scene.add(props);

  scene.add(createCourtLines());

  // Soft sky/ground fill plus one directional key light; no shadow maps (mobile budget).
  scene.add(new HemisphereLight(0xf4f1ea, 0x5a5348, 1.6));
  const sun = new DirectionalLight(0xffffff, 1.4);
  sun.position.set(-20, 40, -15);
  scene.add(sun);

  return {
    scene,
    building,
    edges,
    roofCut,
    setRoofCut(enabled) {
      clipping.length = 0;
      if (enabled) clipping.push(roofCut);
      buildingMat.needsUpdate = true;
      (edges.material as LineBasicMaterial).needsUpdate = true;
    },
  };
}
