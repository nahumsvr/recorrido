import { BufferAttribute, BufferGeometry, Mesh, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export interface AuditoriumModel {
  /** Walls, floors, stands and roof in plan coordinates (world space, float). */
  readonly building: BufferGeometry;
  /** Simplified stage props; visual only, never collides. */
  readonly props: BufferGeometry;
}

/**
 * Loads the prepared GLB and returns world-space float geometries. The GLB is
 * meshopt-quantized (int16 + node transform); baking it here keeps every later
 * consumer (BVH, raycasts, collisions) working directly in plan coordinates.
 */
export async function loadModel(url: string): Promise<AuditoriumModel> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  gltf.scene.updateMatrixWorld(true);
  return {
    building: bakeNamed(gltf.scene, 'building'),
    props: bakeNamed(gltf.scene, 'props'),
  };
}

function bakeNamed(root: Object3D, name: string): BufferGeometry {
  const node = root.getObjectByName(name);
  const mesh = node instanceof Mesh ? node : node?.children.find((c): c is Mesh => c instanceof Mesh);
  if (!mesh) throw new Error(`Model is missing the "${name}" mesh`);

  const src = mesh.geometry as BufferGeometry;
  const out = new BufferGeometry();
  for (const [attrName, attr] of Object.entries(src.attributes)) {
    const a = attr as BufferAttribute;
    const data = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) {
      for (let k = 0; k < a.itemSize; k++) data[i * a.itemSize + k] = a.getComponent(i, k);
    }
    out.setAttribute(attrName, new BufferAttribute(data, a.itemSize));
  }
  if (src.index) out.setIndex(src.index.clone());
  out.applyMatrix4(mesh.matrixWorld);
  if (!out.getAttribute('normal')) out.computeVertexNormals();
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}
