import { Clock, Euler, PerspectiveCamera, Raycaster, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { createApGroups } from './aps/apGroups.ts';
import { createApPanel } from './aps/apPanel.ts';
import { CAMERA_COLOR, createCameraLayer } from './cameras/cameraLayer.ts';
import { createCameraEditor, type CameraPatch } from './cameras/cameraEditor.ts';
import {
  applyOverride,
  applyOverrides,
  diffOverrides,
  loadLocalOverrides,
  sanitizeOverrides,
  saveLocalOverrides,
  toOverride,
} from './cameras/cameraOverrides.ts';
import { CAMERAS, LENSES_BY_KIND } from './data/cameras.ts';
import projectCameraOverrides from './data/cameraOverrides.json';
import { panelApId, type PanelState } from './aps/selection.ts';
import modelUrl from './assets/auditorio.glb?url';
import type { ApGroupId } from './data/aps.ts';
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
import { createAudioSystem, createFohStation } from './world/audio.ts';
import { PENETRATIONS } from './data/cabling.ts';
import { createCablingLayer } from './world/cabling.ts';
import { createNetworkDesk, deskObstacle, monitorPoint, MONITOR_REACH_M } from './world/networkDesk.ts';
import { createCameraViewer } from './cameras/cameraViewer.ts';
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
      id: 'model',
      aps: MODEL_ACCESS_POINTS,
      style: { name: 'modelAps', color: 0xb07cff, labelClass: 'ap-label--model', floorLift: 0.05 },
    },
  ],
  world.bvh,
  { minX: bounds.min.x, maxX: bounds.max.x, minY: bounds.min.z, maxY: bounds.max.z, maxH: bounds.max.y },
);
world.scene.add(aps.root);
// Cameras: code defaults ⊕ project overrides (src/data/cameraOverrides.json) ⊕ this browser's edits.
let baseCameras = applyOverrides(CAMERAS, sanitizeOverrides(projectCameraOverrides));
let localOverrides = loadLocalOverrides();
const cameras = createCameraLayer(applyOverrides(baseCameras, localOverrides), world.bvh, { minX: bounds.min.x, maxX: bounds.max.x, minY: bounds.min.z, maxY: bounds.max.z });
world.scene.add(cameras.group);
const viewer = createCameraViewer(cameras.items);
world.scene.add(createNetworkRack());
const desk = createNetworkDesk();
world.scene.add(desk);
const monitor = monitorPoint();
const cabling = createCablingLayer(world.bvh);
world.scene.add(cabling.pathways, cabling.penetrations, cabling.drops);
const audio = createAudioSystem();
world.scene.add(audio.installed);
const foh = createFohStation();
world.scene.add(foh.fixed, foh.mixer);
const door = createNetworkRoomDoor();
world.scene.add(door.root);
const toast = createToast();
/** Solid props the player cannot cross; the door leaves this list while open. */
const obstacles: Obstacle[] = [rackObstacle(), deskObstacle(), foh.obstacle, door.obstacle];
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

/** Center of the doorway (plan X, wall Y) used to rank it against the monitor. */
const DOOR_CENTER = { x: 14.88, z: 32.3 } as const;
const flatDistance = (x: number, z: number): number => Math.hypot(camera.position.x - x, camera.position.z - z);
const monitorReachable = (): boolean => flatDistance(monitor.x, monitor.z) <= MONITOR_REACH_M;
/** Nearest usable station when both the monitor and the door are in reach. */
function nearestStation(): 'monitor' | 'door' | null {
  const m = monitorReachable() ? flatDistance(monitor.x, monitor.z) : Infinity;
  const d = door.reachable(camera.position) ? flatDistance(DOOR_CENTER.x, DOOR_CENTER.z) : Infinity;
  if (m === Infinity && d === Infinity) return null;
  return m <= d ? 'monitor' : 'door';
}
/** Full-screen security camera monitor (opened from the network room desk). */
function openViewer(index?: number): void {
  desktop.deactivate();
  cameras.setFov(false);
  cameras.group.visible = false;
  setPanelState({ pinned: null, nearby: null });
  viewer.open(index);
}
viewer.onClose(() => {
  cameras.group.visible = hud.isOn('camShow');
  cameras.setFov(hud.isOn('camFov'));
  startHint.hidden = mode !== 'walk' || desktop.isActive();
});

// ---- Camera editor: edits persist in this browser; "Save to project" writes the repo file (dev server) ----
const cameraMarkers = cameras.items.map((c) => ({
  id: c.camera.id,
  x: c.position.x,
  y: c.position.z,
  warn: !c.mounted,
  color: `#${CAMERA_COLOR.toString(16).padStart(6, '0')}`,
  visible: () => cameras.group.visible,
}));
cameraMarkers.forEach((m, i) => {
  m.visible = () => cameras.group.visible && !cameras.items[i]?.camera.hidden;
});
let editing = false;
let selectedIndex = 0;
const currentCameras = () => cameras.items.map((i) => i.camera);
const mountText = (i: (typeof cameras.items)[number]): string =>
  i.mounted ? `Mounted on a wall (${((i.wallDistance ?? 0) * 100).toFixed(0)} cm)` : '⚠ No wall within 1 m: floating';
function persistLocal(): void {
  localOverrides = diffOverrides(baseCameras, currentCameras());
  saveLocalOverrides(localOverrides);
}
function refreshEditor(): void {
  const item = cameras.items[selectedIndex];
  if (item) editor.show(selectedIndex, item.camera, mountText(item), item.camera.id in localOverrides);
}
function selectCamera(index: number): void {
  selectedIndex = index;
  cameras.setSelected(cameras.items[index]?.camera.id ?? null);
  refreshEditor();
}
function replaceCamera(index: number, camera: (typeof baseCameras)[number]): void {
  const item = cameras.update(index, camera);
  const marker = cameraMarkers[index];
  if (marker) Object.assign(marker, { x: item.position.x, y: item.position.z, warn: !item.mounted });
}
function applyPatch(patch: CameraPatch): void {
  const old = cameras.items[selectedIndex]?.camera;
  if (!old) return;
  let next = { ...toOverride(old), ...patch };
  if (!LENSES_BY_KIND[next.kind].includes(next.lensMm)) next = { ...next, lensMm: 4 };
  const clean = sanitizeOverrides({ [old.id]: next })[old.id];
  if (!clean) return;
  replaceCamera(selectedIndex, applyOverride(old, clean));
  persistLocal();
  refreshEditor();
}
function resetToBase(index: number): void {
  const base = baseCameras[index];
  if (base) replaceCamera(index, base);
}
async function saveToProject(): Promise<void> {
  const body = JSON.stringify(diffOverrides(CAMERAS, currentCameras()), null, 2);
  try {
    const res = await fetch('/__dev/camera-overrides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // The file now holds every edit: it becomes the new base for "Reset".
    baseCameras = currentCameras();
    persistLocal();
    refreshEditor();
    toast.show('Saved to src/data/cameraOverrides.json', 'ok', 3200);
  } catch {
    toast.show('Could not save: it only works with `npm run dev`. Use Export JSON instead.', 'warn', 4200);
  }
}
async function exportOverrides(): Promise<void> {
  const text = JSON.stringify(diffOverrides(CAMERAS, currentCameras()), null, 2);
  try {
    await navigator.clipboard.writeText(text);
    toast.show('Camera JSON copied to the clipboard.', 'ok');
  } catch {
    console.info(text);
    toast.show('Clipboard blocked: the JSON is in the browser console.', 'warn', 3500);
  }
}
const editor = createCameraEditor(
  cameras.items.map((i) => i.camera.id),
  {
    onSelect: selectCamera,
    onPatch: applyPatch,
    onPreview: () => openViewer(selectedIndex),
    onResetOne() {
      resetToBase(selectedIndex);
      persistLocal();
      refreshEditor();
    },
    onResetAll() {
      cameras.items.forEach((_, i) => resetToBase(i));
      persistLocal();
      refreshEditor();
      toast.show('All cameras reset.', 'info');
    },
    onSaveProject: () => void saveToProject(),
    onExport: () => void exportOverrides(),
  },
  { canSaveToProject: import.meta.env.DEV },
);
/** Edit mode: what the selected camera sees right now, drawn in the preview frame next to the panel. */
function renderEditPreview(): void {
  const rect = editing ? editor.previewRect() : null;
  const item = cameras.items[selectedIndex];
  if (!rect || !item || rect.width < 8) return;
  // Markers and view cones of the cameras would otherwise show inside the picture.
  const wasVisible = cameras.group.visible;
  cameras.group.visible = false;
  viewer.renderInset(renderer, world.scene, item, rect);
  cameras.group.visible = wasVisible;
}
function setEditing(on: boolean): void {
  editing = on;
  editor.setVisible(on);
  if (on) {
    if (!hud.isOn('camShow')) hud.setToggle('camShow', true);
    selectCamera(selectedIndex);
  } else {
    cameras.setSelected(null);
  }
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
    ...apGroupToggles('model', `Model APs (${MODEL_ACCESS_POINTS.length})`),
    { id: 'camShow', label: 'Show', initial: true, section: `Cameras (${CAMERAS.length})`, onChange: (on) => (cameras.group.visible = on) },
    { id: 'camFov', label: 'View cones', initial: false, onChange: (on) => cameras.setFov(on) },
    { id: 'camEdit', label: 'Edit cameras', initial: false, onChange: setEditing },
    { id: 'cablingShow', label: 'Trays and conduits', initial: true, section: 'Cabling', onChange: (on) => (cabling.pathways.visible = on) },
    { id: 'dropsShow', label: 'Drops to APs and cameras', initial: true, onChange: (on) => (cabling.drops.visible = on) },
    { id: 'holesShow', label: `Wall holes (${PENETRATIONS.length})`, initial: true, onChange: (on) => (cabling.penetrations.visible = on) },
    { id: 'audioShow', label: 'Speakers and cables', initial: true, section: 'Audio (4 speakers)', onChange: (on) => (audio.installed.visible = on) },
    { id: 'mixerShow', label: 'Mixer on the table', initial: true, onChange: (on) => (foh.mixer.visible = on) },
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
  })).concat(cameraMarkers),
);
{
  const fog = world.scene.fog;
  world.scene.fog = null;
  aps.root.visible = false;
  cameras.group.visible = false;
  overlay.visible = false;
  world.setRoofCut(true);
  minimap.bake(renderer, world.scene);
  world.setRoofCut(hud.isOn('roof'));
  overlay.visible = hud.isOn('align');
  aps.root.visible = true;
  cameras.group.visible = hud.isOn('camShow');
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
function pickAt(clientX: number, clientY: number, center: boolean, clearOnMiss: boolean, allowEdit = true): void {
  if (center) pickPointer.set(0, 0);
  else pickPointer.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
  pickRaycaster.setFromCamera(pickPointer, camera);
  if (editing && allowEdit && editPick()) return;
  if (door.pick(pickRaycaster) && door.reachable(camera.position)) return useDoor();
  if (monitorReachable() && pickRaycaster.intersectObject(desk, true).length > 0) return openViewer();
  const item = aps.pick(pickRaycaster);
  if (item) setPanelState({ ...panelState, pinned: item.ap.id });
  else if (clearOnMiss && panelState.pinned) setPanelState({ ...panelState, pinned: null });
}
/** Edit mode: a click selects a camera, or moves the selected one onto the wall that was hit. */
function editPick(): boolean {
  const hitCamera = cameras.pick(pickRaycaster);
  if (hitCamera) {
    selectCamera(cameras.items.indexOf(hitCamera));
    return true;
  }
  const roofCut = hud.isOn('roof');
  const hit = pickRaycaster.intersectObject(world.building).find((i) => !roofCut || i.point.y < world.roofCut.constant);
  if (!hit?.face) return false;
  const n = hit.face.normal.clone();
  if (Math.abs(n.y) > 0.35) {
    toast.show('Click a wall to place the camera.', 'warn', 1800);
    return true;
  }
  n.setY(0).normalize();
  if (n.dot(pickRaycaster.ray.direction) > 0) n.negate();
  const p = hit.point.clone().addScaledVector(n, 0.15);
  applyPatch({ x: p.x, y: p.z, h: p.y });
  return true;
}
let downX = 0;
let downY = 0;
renderer.domElement.addEventListener('pointerdown', (e) => {
  downX = e.clientX;
  downY = e.clientY;
});
renderer.domElement.addEventListener('click', (e) => {
  if (viewer.isOpen()) return;
  // In touch walk mode taps arrive through the touch controller instead.
  if (touchMode && mode === 'walk') return;
  const wasActive = desktop.isActive();
  if (mode === 'walk' && !touchMode) desktop.activate();
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > CLICK_MAX_MOVE_PX) return;
  pickAt(e.clientX, e.clientY, desktop.isPointerLocked(), wasActive || mode === 'orbit', wasActive || mode === 'orbit');
});
const touch = touchMode
  ? createTouchInput(camera, renderer.domElement, {
      onTap: (x, y) => pickAt(x, y, false, true),
      enabled: () => mode === 'walk',
    })
  : null;
addEventListener('keydown', (e) => {
  if (e.code !== 'KeyE' || e.repeat) return;
  if (viewer.isOpen()) return viewer.close();
  pickRaycaster.setFromCamera(pickPointer.set(0, 0), camera);
  const lookedAtAp = aps.pick(pickRaycaster);
  const station = mode === 'walk' && !lookedAtAp ? nearestStation() : null;
  if (station === 'monitor') return openViewer();
  if (station === 'door') return useDoor();
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
  viewer.resize();
});

const clock = new Clock();
let frame = 0;
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  frame++;
  if (viewer.isOpen()) {
    viewer.render(renderer, world.scene);
    return;
  }
  if (mode === 'walk') {
    const steps = physics.advance(dt);
    for (let i = 0; i < steps; i++) player.step(touch ? touch.read() : desktop.read(), PHYSICS_STEP);
    player.eyePosition(camera.position);
    const p = threeToPlan(player.position.x, player.position.y, player.position.z);
    hud.setReadout(`X ${p.x.toFixed(1)}  Y ${p.y.toFixed(1)}  floor h ${p.h.toFixed(2)} m`);
    door.update(dt);
    const key = touchMode ? 'Tap' : 'E';
    toast.setHint(
      nearestStation() === 'monitor'
        ? `${key}: security cameras`
        : door.reachable(camera.position)
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
    toast.setHint(null);
    if (panelState.nearby) setPanelState({ ...panelState, nearby: null });
  }
  viewEuler.setFromQuaternion(camera.quaternion);
  minimap.draw({ x: player.position.x, y: player.position.z, yaw: viewEuler.y }, panelApId(panelState));
  apPanel.updateDistance(camera.position);
  aps.animate(clock.elapsedTime);
  if (frame % OCCLUSION_EVERY_N_FRAMES === 0) {
    aps.updateOcclusion(camera);
    if (cameras.group.visible) cameras.updateOcclusion(camera);
  }
  renderer.render(world.scene, camera);
  renderEditPreview();
  labelRenderer.render(world.scene, camera);
});

// Exposed for automated checks (e2e / console inspection).
Object.assign(window, {
  __recorrido: { world, camera, renderer, player, door, cameras, viewer, cameraEdit: { applyPatch, selectCamera, setEditing }, setMode, aps, hud, goTo, getPanelState: () => panelState },
});
