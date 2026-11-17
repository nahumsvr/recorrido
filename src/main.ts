import { PerspectiveCamera, Raycaster, Vector2, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import modelUrl from './assets/auditorio.glb?url';
import { LAYOUT } from './config/alignment.ts';
import { threeToPlan } from './domain/coords.ts';
import { createAlignOverlay } from './debug/alignOverlay.ts';
import { createHud } from './ui/hud.ts';
import { loadModel } from './world/loadModel.ts';
import { createWorld } from './world/scene.ts';

const params = new URLSearchParams(location.search);
const debugAlign = params.get('debug') === 'align';

const container = document.getElementById('app')!;
const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.localClippingEnabled = true;
container.append(renderer.domElement);

const camera = new PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300);
const center = { x: LAYOUT.buildingWidth / 2, z: LAYOUT.buildingDepth / 2 };
camera.position.set(center.x - 30, 38, center.z + 42);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(center.x, 0, center.z);
controls.enableDamping = true;

const model = await loadModel(modelUrl);
const world = createWorld(model);
world.setRoofCut(true);
document.getElementById('loading')?.remove();

const overlay = createAlignOverlay();
overlay.visible = debugAlign;
world.scene.add(overlay);

const hud = createHud('Auditorium — inspection view', [
  { id: 'roof', label: 'Cut roof', initial: true, onChange: (on) => world.setRoofCut(on) },
  { id: 'edges', label: 'Edges', initial: true, onChange: (on) => (world.edges.visible = on) },
  { id: 'align', label: 'Plan grid + APs', initial: debugAlign, onChange: (on) => (overlay.visible = on) },
]);

// Plan-coordinate readout under the pointer (alignment check).
const raycaster = new Raycaster();
const pointer = new Vector2();
renderer.domElement.addEventListener('pointermove', (e) => {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const cutH = world.roofCut.constant;
  const roofCut = (document.getElementById('roof') as HTMLInputElement | null)?.checked ?? false;
  const hit = raycaster.intersectObject(world.building).find((i) => !roofCut || i.point.y < cutH);
  if (!hit) return hud.setReadout('');
  const p = threeToPlan(hit.point.x, hit.point.y, hit.point.z);
  hud.setReadout(`X ${p.x.toFixed(2)}  Y ${p.y.toFixed(2)}  h ${p.h.toFixed(2)} m`);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(world.scene, camera);
});

// Exposed for automated checks (e2e / console inspection).
Object.assign(window, { __recorrido: { world, camera } });
