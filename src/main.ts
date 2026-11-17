import { Clock, PerspectiveCamera, Raycaster, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import modelUrl from './assets/auditorio.glb?url';
import { LAYOUT } from './config/alignment.ts';
import { threeToPlan } from './domain/coords.ts';
import { createAlignOverlay } from './debug/alignOverlay.ts';
import { createDesktopInput } from './input/desktopInput.ts';
import { FixedStep } from './player/fixedStep.ts';
import { PlayerController } from './player/playerController.ts';
import { createHud } from './ui/hud.ts';
import { loadModel } from './world/loadModel.ts';
import { createWorld } from './world/scene.ts';

const PHYSICS_STEP = 1 / 120;
/** Center of the courts, facing the stage (east). */
const SPAWN = { feet: new Vector3(LAYOUT.courtWidth / 2, 0, LAYOUT.courtDepth / 2), yaw: -Math.PI / 2 };

const params = new URLSearchParams(location.search);
const debugAlign = params.get('debug') === 'align';

const container = document.getElementById('app')!;
const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.localClippingEnabled = true;
container.append(renderer.domElement);

const camera = new PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 300);
camera.rotation.order = 'YXZ';

const model = await loadModel(modelUrl);
const world = createWorld(model);
document.getElementById('loading')?.remove();

const overlay = createAlignOverlay();
overlay.visible = debugAlign;
world.scene.add(overlay);

// ---- Player ----
const player = new PlayerController(world.bvh, { spawn: SPAWN.feet, safetyFloor: 0 });
player.teleport(SPAWN.feet, true);
camera.rotation.set(0, SPAWN.yaw, 0);
const desktop = createDesktopInput(camera, renderer.domElement);
const physics = new FixedStep(PHYSICS_STEP);

// ---- Inspection (orbit) view ----
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.enabled = false;
const walkPose = { position: new Vector3(), quaternion: camera.quaternion.clone() };

let mode: 'walk' | 'orbit' = 'walk';
function setMode(next: 'walk' | 'orbit'): void {
  if (next === mode) return;
  mode = next;
  if (mode === 'orbit') {
    desktop.deactivate();
    walkPose.quaternion.copy(camera.quaternion);
    orbit.target.set(LAYOUT.buildingWidth / 2, 0, LAYOUT.buildingDepth / 2);
    camera.position.set(LAYOUT.buildingWidth / 2 - 30, 38, LAYOUT.buildingDepth / 2 + 42);
    orbit.enabled = true;
    hud.setToggle('roof', true);
  } else {
    orbit.enabled = false;
    camera.quaternion.copy(walkPose.quaternion);
    hud.setToggle('roof', false);
  }
  startHint.hidden = mode !== 'walk';
}

const hud = createHud('Auditorium walkthrough', [
  { id: 'inspect', label: 'Inspection view', initial: false, onChange: (on) => setMode(on ? 'orbit' : 'walk') },
  { id: 'roof', label: 'Cut roof', initial: false, onChange: (on) => world.setRoofCut(on) },
  { id: 'edges', label: 'Edges', initial: true, onChange: (on) => (world.edges.visible = on) },
  { id: 'align', label: 'Plan grid + APs', initial: debugAlign, onChange: (on) => (overlay.visible = on) },
]);

// Click-to-walk hint shown while the pointer is free in walk mode.
const startHint = document.createElement('button');
startHint.className = 'start-hint';
startHint.innerHTML =
  '<strong>Click to walk</strong><span>WASD move · Shift run · Space jump · mouse look · Esc release</span>';
startHint.addEventListener('click', () => desktop.activate());
document.body.append(startHint);
desktop.onActiveChange((active) => (startHint.hidden = active || mode !== 'walk'));
renderer.domElement.addEventListener('click', () => {
  if (mode === 'walk') desktop.activate();
});

// Plan-coordinate readout under the pointer in inspection view (alignment check).
const raycaster = new Raycaster();
const pointer = new Vector2();
renderer.domElement.addEventListener('pointermove', (e) => {
  if (mode !== 'orbit') return;
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const cutH = world.roofCut.constant;
  const roofCut = hud.isOn('roof');
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

const clock = new Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  if (mode === 'walk') {
    const steps = physics.advance(dt);
    for (let i = 0; i < steps; i++) player.step(desktop.read(), PHYSICS_STEP);
    player.eyePosition(camera.position);
    const p = threeToPlan(player.position.x, player.position.y, player.position.z);
    hud.setReadout(`X ${p.x.toFixed(1)}  Y ${p.y.toFixed(1)}  floor h ${p.h.toFixed(2)} m`);
  } else {
    orbit.update();
  }
  renderer.render(world.scene, camera);
});

// Exposed for automated checks (e2e / console inspection).
Object.assign(window, { __recorrido: { world, camera, player, setMode } });
