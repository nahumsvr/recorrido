/**
 * Offline pipeline: auditorio.stl (SketchUp, meters, Z up) → src/assets/auditorio.glb
 * in floor-plan coordinates (three.js: x = plan X, y = h, z = plan Y), with
 * per-face vertex colors, plus src/assets/model-report.json.
 *
 * Usage: npm run prepare-model [-- path/to/model.stl]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { meshopt, weld as weldTransform } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { BufferAttribute, BufferGeometry, Color, Vector3 } from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { findMountingWall } from '../src/aps/mounting.ts';
import { ACCESS_POINTS } from '../src/data/aps.ts';
import { ALIGNMENT, LAYOUT, STAGE_PROPS_BOX_STL } from '../src/config/alignment.ts';
import { stlToThree } from '../src/domain/coords.ts';
import { classifyFace, type FaceClass } from '../src/domain/faceClassifier.ts';
import { FACE_PALETTE } from '../src/world/palette.ts';
import { cleanTriangles, componentsInsideBox, parseBinaryStl, triangleArea, triangleComponents, weld } from './lib/stl.ts';

const SRC = process.argv[2] ?? 'auditorio.stl';
const OUT_DIR = 'src/assets';
const PROPS_TARGET_TRIS = 12_000;

const raw = readFileSync(SRC);
const triangles = parseBinaryStl(new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength));
const sourceTris = triangles.length / 9;

// Move every vertex to plan/three coordinates first; everything after works in that space.
for (let i = 0; i < triangles.length; i += 3) {
  const [x, y, z] = stlToThree(triangles[i]!, triangles[i + 1]!, triangles[i + 2]!, ALIGNMENT);
  triangles[i] = x;
  triangles[i + 1] = y;
  triangles[i + 2] = z;
}
const mesh = weld(triangles);
const clean = cleanTriangles(mesh);
const cleanMesh = { vertices: mesh.vertices, indices: clean.indices };

// Props box converted to three space (min/max reorder because plan Y flips).
const [ax, ay, az] = stlToThree(STAGE_PROPS_BOX_STL.min[0], STAGE_PROPS_BOX_STL.max[1], STAGE_PROPS_BOX_STL.min[2], ALIGNMENT);
const [bx, by, bz] = stlToThree(STAGE_PROPS_BOX_STL.max[0], STAGE_PROPS_BOX_STL.min[1], STAGE_PROPS_BOX_STL.max[2], ALIGNMENT);
const comp = triangleComponents(cleanMesh.indices, mesh.vertices.length / 3);
const isProp = componentsInsideBox(cleanMesh, comp, { min: [ax, ay, az], max: [bx, by, bz] });

// ---- Building: non-indexed, flat normals, vertex color per face class ----
const P = mesh.vertices;
const buildingPos: number[] = [];
const buildingNrm: number[] = [];
const buildingCol: number[] = [];
const propIdx: number[] = [];
const classArea: Partial<Record<FaceClass, number>> = {};
const wallPlanes = new Map<string, number>();
let stageMinX = Infinity;
const tint = new Color();

const triCount = cleanMesh.indices.length / 3;
for (let t = 0; t < triCount; t++) {
  const a = cleanMesh.indices[t * 3]!;
  const b = cleanMesh.indices[t * 3 + 1]!;
  const c = cleanMesh.indices[t * 3 + 2]!;
  if (isProp[t]) {
    propIdx.push(a, b, c);
    continue;
  }
  const ux = P[b * 3]! - P[a * 3]!, uy = P[b * 3 + 1]! - P[a * 3 + 1]!, uz = P[b * 3 + 2]! - P[a * 3 + 2]!;
  const vx = P[c * 3]! - P[a * 3]!, vy = P[c * 3 + 1]! - P[a * 3 + 1]!, vz = P[c * 3 + 2]! - P[a * 3 + 2]!;
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz);
  nx /= len; ny /= len; nz /= len;
  const cx = (P[a * 3]! + P[b * 3]! + P[c * 3]!) / 3;
  const cy = (P[a * 3 + 1]! + P[b * 3 + 1]! + P[c * 3 + 1]!) / 3;
  const cz = (P[a * 3 + 2]! + P[b * 3 + 2]! + P[c * 3 + 2]!) / 3;
  const cls = classifyFace([nx, ny, nz], [cx, cy, cz], LAYOUT);
  const area = triangleArea(P, a, b, c);
  classArea[cls] = (classArea[cls] ?? 0) + area;
  if (cls === 'stage') stageMinX = Math.min(stageMinX, P[a * 3]!, P[b * 3]!, P[c * 3]!);
  if ((cls === 'wallNS' || cls === 'wallEW') && area > 0.05) {
    const key = cls === 'wallNS' ? `X=${cx.toFixed(2)}` : `Y=${cz.toFixed(2)}`;
    wallPlanes.set(key, (wallPlanes.get(key) ?? 0) + area);
  }

  // Subtle height gradient on walls so the volume reads better.
  tint.setHex(FACE_PALETTE[cls]);
  if (cls === 'wallNS' || cls === 'wallEW') tint.multiplyScalar(0.82 + 0.18 * Math.min(cy / LAYOUT.roofStartH, 1));
  for (const v of [a, b, c]) {
    buildingPos.push(P[v * 3]!, P[v * 3 + 1]!, P[v * 3 + 2]!);
    buildingNrm.push(nx, ny, nz);
    buildingCol.push(tint.r, tint.g, tint.b);
  }
}

// ---- Props: simplify heavily, keep as a separate visual-only mesh ----
await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
const propIndices = new Uint32Array(propIdx);
let [simplified] = MeshoptSimplifier.simplify(propIndices, P, 3, PROPS_TARGET_TRIS * 3, 0.01, ['Prune']);
if (simplified.length / 3 > PROPS_TARGET_TRIS * 1.5) {
  [simplified] = MeshoptSimplifier.simplifySloppy(propIndices, P, 3, null, PROPS_TARGET_TRIS * 3, 0.02);
}
const [compactProps, propVertexCount] = MeshoptSimplifier.compactMesh(simplified.slice());
// compactMesh remaps indices in place and returns the remap table (old → new).
const propVerts = new Float32Array(propVertexCount * 3);
compactProps.forEach((newIdx, oldIdx) => {
  if (newIdx === 0xffffffff) return;
  propVerts.set(P.subarray(oldIdx * 3, oldIdx * 3 + 3), newIdx * 3);
});
const remapped = simplified.map((old) => compactProps[old]!);

// ---- Write GLB ----
const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('auditorio');
const buildingPrim = doc
  .createPrimitive()
  .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(buildingPos)).setBuffer(buffer))
  .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(buildingNrm)).setBuffer(buffer))
  .setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(new Float32Array(buildingCol)).setBuffer(buffer));
scene.addChild(doc.createNode('building').setMesh(doc.createMesh('building').addPrimitive(buildingPrim)));
const propsPrim = doc
  .createPrimitive()
  .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(propVerts).setBuffer(buffer))
  .setIndices(doc.createAccessor().setType('SCALAR').setArray(remapped).setBuffer(buffer));
scene.addChild(doc.createNode('props').setMesh(doc.createMesh('props').addPrimitive(propsPrim)));

await doc.transform(weldTransform(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const glb = await io.writeBinary(doc);
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/auditorio.glb`, glb);

// ---- Report ----
const bbox = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
for (let i = 0; i < buildingPos.length; i += 3) {
  for (let k = 0; k < 3; k++) {
    bbox.min[k] = Math.min(bbox.min[k]!, buildingPos[i + k]!);
    bbox.max[k] = Math.max(bbox.max[k]!, buildingPos[i + k]!);
  }
}
const round = (n: number) => Math.round(n * 1000) / 1000;

// Distance from each AP in the design table to the nearest wall of the model.
const collider = new BufferGeometry();
collider.setAttribute('position', new BufferAttribute(new Float32Array(buildingPos), 3));
const colliderBvh = new MeshBVH(collider);
const apWallDistance = Object.fromEntries(
  ACCESS_POINTS.map((ap) => {
    const mount = findMountingWall(colliderBvh, new Vector3(ap.position.x, ap.position.h, ap.position.y), 3);
    return [ap.id, mount ? round(mount.distance) : null];
  }),
);
const report = {
  source: SRC,
  alignment: ALIGNMENT,
  sourceTriangles: sourceTris,
  removedDegenerate: clean.degenerate,
  removedDuplicates: clean.duplicates,
  buildingTriangles: buildingPos.length / 9,
  propsTrianglesBefore: propIdx.length / 3,
  propsTrianglesAfter: remapped.length / 3,
  glbBytes: glb.byteLength,
  boundsPlan: {
    x: [round(bbox.min[0]!), round(bbox.max[0]!)],
    y: [round(bbox.min[2]!), round(bbox.max[2]!)],
    h: [round(bbox.min[1]!), round(bbox.max[1]!)],
  },
  stageEdgeX: round(stageMinX),
  /** Meters to the nearest wall within 3 m; null = none. */
  apWallDistance,
  areaByClass: Object.fromEntries(Object.entries(classArea).map(([k, v]) => [k, round(v)])),
  wallPlanes: Object.fromEntries(
    [...wallPlanes.entries()]
      .sort((m, n) => n[1] - m[1])
      .slice(0, 24)
      .map(([k, v]) => [k, round(v)]),
  ),
};
writeFileSync(`${OUT_DIR}/model-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report, areaByClass: undefined, wallPlanes: undefined }, null, 2));
const unmounted = Object.entries(apWallDistance).filter(([, d]) => d === null || d > 0.6);
if (unmounted.length) console.warn(`APs not within 0.6 m of a wall: ${unmounted.map(([id, d]) => `${id} (${d ?? '>3'} m)`).join(', ')}`);
