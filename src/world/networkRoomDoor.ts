import {
  BoxGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  type Camera,
  type Raycaster,
} from 'three';
import { DoorLogic, type DoorEvent } from '../domain/doorLogic.ts';
import type { Obstacle } from '../player/obstacles.ts';

/** Doorway measured on the model: X 14.42-15.34, wall faces at Y 32.20 / 32.40, lintel 2.30 m. */
const DOORWAY = { minX: 14.42, maxX: 15.34, wallY: 32.3, lintelH: 2.3 } as const;
const LEAF_W = DOORWAY.maxX - DOORWAY.minX - 0.02;
const LEAF_H = DOORWAY.lintelH - 0.03;
const LEAF_T = 0.05;
/** The leaf swings outward (south), as telecom rooms require. */
const OPEN_ANGLE = -Math.PI * 0.56;
const SWING_SPEED = 4.5;
const RATTLE_MS = 450;
export const DOOR_REACH_M = 2.4;

const LED_LOCKED = 0xe5484d;
const LED_UNLOCKED = 0x3ddc84;

export interface NetworkRoomDoor {
  readonly root: Group;
  /** Solid footprint while the door is closed; absent while open. */
  readonly obstacle: Obstacle;
  isOpen(): boolean;
  /** True while a second press would unlock it. */
  isArmed(): boolean;
  /** Within reach of the handle (horizontal distance from the eye). */
  reachable(eye: Camera['position']): boolean;
  /** True when the ray hits the door or its lock. */
  pick(raycaster: Raycaster): boolean;
  interact(): DoorEvent;
  update(dt: number): void;
}

export function createNetworkRoomDoor(now: () => number = () => performance.now()): NetworkRoomDoor {
  const logic = new DoorLogic();
  const root = new Group();
  root.name = 'networkRoomDoor';
  root.position.set(0, 0, DOORWAY.wallY);

  const metal = new MeshStandardMaterial({ color: 0x59616b, roughness: 0.5, metalness: 0.7 });
  const leafMat = new MeshStandardMaterial({ color: 0x7b8794, roughness: 0.6, metalness: 0.5 });
  const ledMat = new MeshStandardMaterial({
    color: LED_LOCKED,
    emissive: LED_LOCKED,
    emissiveIntensity: 1.4,
  });

  // Hinge on the west jamb; the leaf extends along +X when closed.
  const hinge = new Group();
  hinge.position.set(DOORWAY.minX + 0.01, 0, 0);
  const leaf = new Mesh(new BoxGeometry(LEAF_W, LEAF_H, LEAF_T), leafMat);
  leaf.position.set(LEAF_W / 2, LEAF_H / 2, 0);
  leaf.name = 'doorLeaf';
  hinge.add(leaf);

  // Handle and keypad-style lock plate on the free edge, LED on top of it.
  const handle = new Mesh(new BoxGeometry(0.12, 0.03, 0.08), metal);
  handle.position.set(LEAF_W - 0.1, 1.0, 0);
  const plate = new Mesh(new BoxGeometry(0.1, 0.22, 0.02), metal);
  plate.position.set(LEAF_W - 0.1, 1.28, LEAF_T / 2 + 0.01);
  const led = new Mesh(new BoxGeometry(0.04, 0.04, 0.012), ledMat);
  led.position.set(LEAF_W - 0.1, 1.34, LEAF_T / 2 + 0.026);
  led.name = 'doorLed';
  hinge.add(handle, plate, led);
  // Same hardware on the room side so the lock reads from both sides.
  const plateIn = plate.clone();
  plateIn.position.z = -LEAF_T / 2 - 0.01;
  const ledIn = led.clone();
  ledIn.position.z = -LEAF_T / 2 - 0.026;
  hinge.add(plateIn, ledIn);
  root.add(hinge);

  const obstacle: Obstacle = {
    minX: DOORWAY.minX,
    maxX: DOORWAY.maxX,
    minZ: DOORWAY.wallY - 0.06,
    maxZ: DOORWAY.wallY + 0.06,
    maxY: DOORWAY.lintelH,
  };

  let angle = 0;
  let rattleStart = -Infinity;
  const centerX = (DOORWAY.minX + DOORWAY.maxX) / 2;

  const setLed = (unlocked: boolean): void => {
    const c = unlocked ? LED_UNLOCKED : LED_LOCKED;
    ledMat.color.setHex(c);
    ledMat.emissive.setHex(c);
  };

  return {
    root,
    obstacle,
    isOpen: () => logic.isOpen(),
    isArmed: () => logic.isArmed(now()),
    reachable(eye) {
      return Math.hypot(eye.x - centerX, eye.z - DOORWAY.wallY) <= DOOR_REACH_M;
    },
    pick(raycaster) {
      return raycaster.intersectObject(hinge, true).length > 0;
    },
    interact() {
      const event = logic.interact(now());
      if (event === 'rattle') rattleStart = now();
      setLed(event === 'unlock');
      return event;
    },
    update(dt) {
      const target = logic.isOpen() ? OPEN_ANGLE : 0;
      angle = MathUtils.damp(angle, target, SWING_SPEED, dt);
      if (Math.abs(angle - target) < 0.002) angle = target;
      // A short shake while the handle is "tried": decaying wobble on the hinge.
      const t = now() - rattleStart;
      const wobble = t >= 0 && t < RATTLE_MS ? Math.sin(t * 0.06) * 0.025 * (1 - t / RATTLE_MS) : 0;
      hinge.rotation.y = angle + wobble;
    },
  };
}
