import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import { BufferAttribute, BufferGeometry, Matrix4 } from 'three';
import { MeshBVH } from 'three-mesh-bvh';

let cached: Promise<MeshBVH> | null = null;

/** BVH of the real prepared building mesh (world space), for tests against the model. */
export function loadBuildingBvh(path = 'src/assets/auditorio.glb'): Promise<MeshBVH> {
  cached ??= (async () => {
    await MeshoptDecoder.ready;
    const io = new NodeIO()
      .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
      .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
    const doc = await io.read(path);
    await doc.transform(dequantize());
    const node = doc.getRoot().listNodes().find((n) => n.getName() === 'building');
    const prim = node?.getMesh()?.listPrimitives()[0];
    const position = prim?.getAttribute('POSITION')?.getArray();
    if (!node || !prim || !position) throw new Error('building mesh not found in GLB');
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(position), 3));
    const index = prim.getIndices()?.getArray();
    if (index) geometry.setIndex(new BufferAttribute(new Uint32Array(index), 1));
    geometry.applyMatrix4(new Matrix4().fromArray(node.getWorldMatrix()));
    return new MeshBVH(geometry);
  })();
  return cached;
}
