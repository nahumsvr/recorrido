import { Clock, Euler, PerspectiveCamera, Raycaster, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { createApGroups } from './aps/apGroups.ts';
import { createApPanel } from './aps/apPanel.ts';
import { panelApId, type PanelState } from './aps/selection.ts';
import modelUrl from './assets/auditorio.glb?url';
import { ACCESS_POINTS, type ApGroupId } from './data/aps.ts';
import { MODEL_ACCESS_POINTS } from './data/modelAps.ts';
import { TELEPORTS, type Teleport } from './data/teleports.ts';
import { LAYOUT } from './config/alignment.ts';
import { threeToPlan } from './domain/coords.ts';
import { createAlignOverlay } from './debug/alignOverlay.ts';
import { createDesktopInput } from './input/desktopInput.ts';
import { createTouchInput } from './input/touchInput.ts';
import { FixedStep } from './player/fixedStep.ts';
import { PlayerController } from './player/playerController.ts';
import { createHud } from './ui/hud.ts';
import { createMinimap } from './ui/minimap.ts';
import { createTeleportMenu } from './ui/teleportMenu.ts';
import { loadModel } from './world/loadModel.ts';
import { createNetworkRack, rackObstacle } from './world/networkRack.ts';
import { createNetworkRoomDoor } from './world/networkRoomDoor.ts';
import { createToast } from './ui/toast.ts';
import type { Obstacle } from './player/obstacles.ts';
import { createWorld } from './world/scene.ts';

const PHYSICS_STEP = 1 / 120;
/** The AP panel opens automatically within this distance of the eye. */
const AP_PROXIMITY_M = 4;
const OCCLUSION_EVERY_N_FRAMES = 6;
const CLICK_MAX_MOVE_PX = 5;
/** Center of the courts, facing the stage (east). */
const SPAWN = { feet: new Vector3(LAYOUT.courtWidth / 2, 0, LAYOUT.courtDepth / 2), yaw: -Math.PI / 2 };

const params = new URLSearchParams(location.search);
const debugAlign = params.get('debug') === 'align';
/** Phones/tablets (or `?touch=1`): joystick + drag look, lighter rendering. */
const touchMode = params.get('touch') === '1' || matchMedia('(pointer: coarse)').matches;
document.body.classList.toggle('touch', touchMode);

const container = document.getElementById('app')!;
const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, touchMode ? 1.25 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.localClippingEnabled = true;
container.append(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.className = 'labels-layer';
document.body.append(labelRenderer.domElement);

const camera = new PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 300);
camera.rotation.order = 'YXZ';

const model = await loadModel(modelUrl);
const world = createWorld(model);
document.getElementById('loading')?.remove();

const overlay = createAlignOverlay();
overlay.visible = debugAlign;
world.scene.add(overlay);

// ---- Access points ----
const bounds = model.building.boundingBox!;
const aps = createApGroups(
  [
    {
      id: 'table',
      aps: ACCESS_POINTS,
      style: { name: 'tableAps', color: 0x36c2d6, floorLift: 0 },
    },
    {
      id: 'model',
      aps: MODEL_ACCESS_POINTS,
      style: { name: 'modelAps', color: 0xb07cff, labelClass: 'ap-label--model', floorLift: 0.05 },
    },
  ],
  world.bvh,
  { minX: bounds.min.x, maxX: bounds.max.x, minY: bounds.min.z, maxY: bounds.max.z, maxH: bounds.max.y },
);
world.scene.add(aps.root);
world.scene.add(createNetworkRack());
const door = createNetworkRoomDoor();
world.scene.add(door.root);
const toast = createToast();
/** Solid props the player cannot cross; the door leaves this list while open. */
const obstacles: Obstacle[] = [rackObstacle(), door.obstacle];
function setDoorSolid(solid: boolean): void {
  const i = obstacles.indexOf(door.obstacle);
  if (solid && i < 0) obstacles.push(door.obstacle);
  else if (!solid && i >= 0) obstacles.splice(i, 1);
}
/** One press of the interaction key/tap on the network room door. */
function useDoor(): void {
  const event = door.interact();
  if (event === 'rattle') toast.show('Locked — authorized personnel only. Press E again to use your access badge.', 'warn', 3500);
  else if (event === 'unlock') toast.show('Access granted — door unlocked.', 'ok');
  else toast.show('Door closed and locked.', 'info', 1800);
  setDoorSolid(!door.isOpen());
}
const apPanel = createApPanel();
let panelState: PanelState = { pinned: null, nearby: null };
function setPanelState(next: PanelState): void {
  panelState = next;
  const id = panelApId(next);
  apPanel.show(id ? aps.get(id) : null, next.pinned !== null);
  aps.setHighlighted(id);
}
apPanel.onClose(() => setPanelState({ ...panelState, pinned: null }));

// ---- Player ----
const player = new PlayerController(world.bvh, { spawn: SPAWN.feet, safetyFloor: 0, obstacles });
player.teleport(SPAWN.feet, true);
const desktop = createDesktopInput(camera, renderer.domElement);
const physics = new FixedStep(PHYSICS_STEP);

// ---- Inspection (orbit) view ----
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.enabled = false;
// After OrbitControls: its constructor re-aims the camera at its target.
player.eyePosition(camera.position);
camera.rotation.set(0, SPAWN.yaw, 0);
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
  document.body.dataset.mode = mode;
  startHint.hidden = mode !== 'walk' || desktop.isActive();
}
document.body.dataset.mode = mode;

/** Show / coverage toggles for one AP group, all independent of the other group. */
function apGroupToggles(group: ApGroupId, title: string) {
  const sync = () =>
    aps.setCoverage(group, { sphere: hud.isOn(`${group}Sphere`), floor: hud.isOn(`${group}Floor`) });
  return [
    { id: `${group}Show`, label: 'Show', initial: true, section: title, onChange: (on: boolean) => {
      aps.setVisible(group, on);
      // A hidden AP cannot stay selected.
      const shown = panelApId(panelState);
      if (!on && shown && aps.get(shown)?.ap.group === group) setPanelState({ pinned: null, nearby: null });
    } },
    { id: `${group}Sphere`, label: 'Coverage (spheres)', initial: false, onChange: sync },
    { id: `${group}Floor`, label: 'Coverage (on floor)', initial: false, onChange: sync },
  ];
}

const hud = createHud(
  'Auditorium walkthrough',
  [
    { id: 'inspect', label: 'Inspection view', initial: false, section: 'View', onChange: (on) => setMode(on ? 'orbit' : 'walk') },
    {
      id: 'roof',
      label: 'Cut roof',
      initial: false,
      onChange: (on) => {
        world.setRoofCut(on);
        aps.setOccluderCeiling(on ? world.roofCut.constant : null);
      },
    },
    { id: 'edges', label: 'Edges', initial: !touchMode, onChange: (on) => (world.edges.visible = on) },
    { id: 'align', label: 'Plan grid', initial: debugAlign, onChange: (on) => (overlay.visible = on) },
    ...apGroupToggles('table', `Table APs (${ACCESS_POINTS.length})`),
    ...apGroupToggles('model', `Model APs (${MODEL_ACCESS_POINTS.length})`),
  ],
  { collapsed: innerWidth < 700 },
);
world.edges.visible = hud.isOn('edges');

const crosshair = document.createElement('div');
crosshair.className = 'crosshair';
crosshair.hidden = true;
document.body.append(crosshair);

// ---- Teleports ----
function goTo(t: Teleport): void {
  if (!t.position) return;
  setMode('walk');
  hud.setToggle('inspect', false);
  player.teleport(new Vector3(t.position.x, t.position.h, t.position.y), true);
  camera.rotation.set(0, t.yaw, 0);
  setPanelState({ pinned: null, nearby: null });
}
hud.append(createTeleportMenu(TELEPORTS, goTo));

// ---- Minimap (background baked once from a top-down render) ----
const minimap = createMinimap(
  { minX: bounds.min.x, maxX: bounds.max.x, minY: bounds.min.z, maxY: bounds.max.z },
  aps.all.map((i) => ({
    id: i.ap.id,
    x: i.position.x,
    y: i.position.z,
    warn: !i.mounted,
    color: `#${aps.colorOf(i.ap.group).toString(16).padStart(6, '0')}`,
    visible: () => aps.isVisible(i.ap.group),
  })),
);
{
  const fog = world.scene.fog;
  world.scene.fog = null;
  aps.root.visible = false;
  overlay.visible = false;
  world.setRoofCut(true);
  minimap.bake(renderer, world.scene);
  world.setRoofCut(hud.isOn('roof'));
  overlay.visible = hud.isOn('align');
  aps.root.visible = true;
  world.scene.fog = fog;
}
addEventListener('keydown', (e) => {
  if (e.code === 'KeyM' && !e.repeat) minimap.setVisible(!minimap.isVisible());
});
const viewEuler = new Euler(0, 0, 0, 'YXZ');

// Start hint: click-to-walk on desktop, control summary on touch (hidden on first touch).
const startHint = document.createElement('button');
startHint.className = 'start-hint';
startHint.innerHTML = touchMode
  ? '<strong>Left thumb: move · Right thumb: look</strong><span>Tap an AP for details · Jump button to climb the stands</span>'
  : '<strong>Click to walk</strong><span>WASD move · Shift run · Space jump · mouse look · E AP info · M map · Esc release</span>';
document.body.append(startHint);
if (touchMode) {
  renderer.domElement.addEventListener('pointerdown', () => (startHint.hidden = true), { once: true });
  startHint.addEventListener('click', () => (startHint.hidden = true));
} else {
  startHint.addEventListener('click', () => desktop.activate());
}
desktop.onActiveChange((active) => {
  startHint.hidden = active || mode !== 'walk';
  crosshair.hidden = !(active && desktop.isPointerLocked());
});

// ---- Picking APs: click/tap (pointer position, or screen center with pointer lock) or E ----
const pickRaycaster = new Raycaster();
const pickPointer = new Vector2();
function pickAt(clientX: number, clientY: number, center: boolean, clearOnMiss: boolean): void {
  if (center) pickPointer.set(0, 0);
  else pickPointer.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
  pickRaycaster.setFromCamera(pickPointer, camera);
  if (door.pick(pickRaycaster) && door.reachable(camera.position)) return useDoor();
  const item = aps.pick(pickRaycaster);
  if (item) setPanelState({ ...panelState, pinned: item.ap.id });
  else if (clearOnMiss && panelState.pinned) setPanelState({ ...panelState, pinned: null });
}
let downX = 0;
let downY = 0;
renderer.domElement.addEventListener('pointerdown', (e) => {
  downX = e.clientX;
  downY = e.clientY;
});
renderer.domElement.addEventListener('click', (e) => {
  // In touch walk mode taps arrive through the touch controller instead.
  if (touchMode && mode === 'walk') return;
  const wasActive = desktop.isActive();
  if (mode === 'walk' && !touchMode) desktop.activate();
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > CLICK_MAX_MOVE_PX) return;
  pickAt(e.clientX, e.clientY, desktop.isPointerLocked(), wasActive || mode === 'orbit');
});
const touch = touchMode
  ? createTouchInput(camera, renderer.domElement, {
      onTap: (x, y) => pickAt(x, y, false, true),
      enabled: () => mode === 'walk',
    })
  : null;
addEventListener('keydown', (e) => {
  if (e.code !== 'KeyE' || e.repeat) return;
  pickRaycaster.setFromCamera(pickPointer.set(0, 0), camera);
  const lookedAtAp = aps.pick(pickRaycaster);
  if (mode === 'walk' && !lookedAtAp && door.reachable(camera.position)) return useDoor();
  const item = lookedAtAp ?? aps.nearest(camera.position, AP_PROXIMITY_M);
  if (!item || item.ap.id === panelState.pinned) setPanelState({ ...panelState, pinned: null });
  else setPanelState({ ...panelState, pinned: item.ap.id });
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
  labelRenderer.setSize(innerWidth, innerHeight);
});

const clock = new Clock();
let frame = 0;
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  frame++;
  if (mode === 'walk') {
    const steps = physics.advance(dt);
    for (let i = 0; i < steps; i++) player.step(touch ? touch.read() : desktop.read(), PHYSICS_STEP);
    player.eyePosition(camera.position);
    const p = threeToPlan(player.position.x, player.position.y, player.position.z);
    hud.setReadout(`X ${p.x.toFixed(1)}  Y ${p.y.toFixed(1)}  floor h ${p.h.toFixed(2)} m`);
    door.update(dt);
    toast.setHint(
      door.reachable(camera.position)
        ? door.isOpen()
          ? `${touchMode ? 'Tap' : 'E'}: close the door`
          : door.isArmed()
            ? `${touchMode ? 'Tap' : 'E'}: use access badge`
            : `${touchMode ? 'Tap' : 'E'}: network room door (locked)`
        : null,
    );
    const near = aps.nearest(camera.position, AP_PROXIMITY_M)?.ap.id ?? null;
    if (near !== panelState.nearby) setPanelState({ ...panelState, nearby: near });
  } else {
    orbit.update();
    if (panelState.nearby) setPanelState({ ...panelState, nearby: null });
  }
  viewEuler.setFromQuaternion(camera.quaternion);
  minimap.draw({ x: player.position.x, y: player.position.z, yaw: viewEuler.y }, panelApId(panelState));
  apPanel.updateDistance(camera.position);
  aps.animate(clock.elapsedTime);
  if (frame % OCCLUSION_EVERY_N_FRAMES === 0) aps.updateOcclusion(camera);
  renderer.render(world.scene, camera);
  labelRenderer.render(world.scene, camera);
});

// Exposed for automated checks (e2e / console inspection).
Object.assign(window, {
  __recorrido: { world, camera, renderer, player, door, setMode, aps, hud, goTo, getPanelState: () => panelState },
});
