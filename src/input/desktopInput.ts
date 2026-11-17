import { Euler, type Camera } from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import type { PlayerInput } from '../player/playerController.ts';

export interface DesktopInput {
  /** Starts looking: pointer lock, or drag-to-look when lock is unavailable. */
  activate(): void;
  /** Stops looking and moving (Esc does the same). */
  deactivate(): void;
  isActive(): boolean;
  /** True with real pointer lock (look = screen center), false in drag mode. */
  isPointerLocked(): boolean;
  /** Called whenever the active state changes. */
  onActiveChange(cb: (active: boolean) => void): void;
  /** Current movement intent; `jump` is true once per key press. */
  read(): PlayerInput;
  dispose(): void;
}

const FORWARD = ['KeyW', 'ArrowUp'];
const BACK = ['KeyS', 'ArrowDown'];
const LEFT = ['KeyA', 'ArrowLeft'];
const RIGHT = ['KeyD', 'ArrowRight'];
const RUN = ['ShiftLeft', 'ShiftRight'];
const MOVEMENT_KEYS = new Set([...FORWARD, ...BACK, ...LEFT, ...RIGHT, 'Space']);
const DRAG_SENSITIVITY = 0.004; // rad per pixel
const MAX_PITCH = (85 * Math.PI) / 180;

/**
 * WASD/arrows + mouse look. Uses pointer lock when the page may use it
 * (top-level documents); otherwise (iframes, embedded browsers) falls back to
 * dragging with the left button to look around.
 */
export function createDesktopInput(camera: Camera, element: HTMLElement): DesktopInput {
  const controls = new PointerLockControls(camera, element);
  const pressed = new Set<string>();
  const listeners: ((active: boolean) => void)[] = [];
  const euler = new Euler(0, 0, 0, 'YXZ');
  let jumpQueued = false;
  let dragMode = false;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  // controls.isLocked flips AFTER the "lock" event fires, so read the document state instead.
  const isLocked = () => element.ownerDocument.pointerLockElement === element;
  const isActive = () => isLocked() || dragMode;
  const notify = () => listeners.forEach((cb) => cb(isActive()));

  const enterDragMode = () => {
    if (dragMode) return;
    dragMode = true;
    element.style.cursor = 'grab';
    notify();
  };
  const exitDragMode = () => {
    if (!dragMode) return;
    dragMode = false;
    dragging = false;
    pressed.clear();
    element.style.cursor = '';
    notify();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape') exitDragMode();
    if (!isActive()) return;
    if (MOVEMENT_KEYS.has(e.code)) e.preventDefault();
    if (e.code === 'Space' && !e.repeat) jumpQueued = true;
    pressed.add(e.code);
  };
  const onKeyUp = (e: KeyboardEvent) => pressed.delete(e.code);

  const onPointerDown = (e: PointerEvent) => {
    if (!dragMode || e.button !== 0) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    element.setPointerCapture(e.pointerId);
    element.style.cursor = 'grabbing';
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= (e.clientX - lastX) * DRAG_SENSITIVITY;
    euler.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, euler.x - (e.clientY - lastY) * DRAG_SENSITIVITY));
    camera.quaternion.setFromEuler(euler);
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onPointerUp = () => {
    dragging = false;
    if (dragMode) element.style.cursor = 'grab';
  };

  const onLockChange = () => {
    pressed.clear();
    notify();
  };

  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);
  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointermove', onPointerMove);
  element.addEventListener('pointerup', onPointerUp);
  element.ownerDocument.addEventListener('pointerlockerror', enterDragMode);
  controls.addEventListener('lock', onLockChange);
  controls.addEventListener('unlock', onLockChange);

  return {
    activate() {
      if (isActive()) return;
      try {
        // Returns a promise in modern browsers; rejects inside iframes without permission.
        const result = element.requestPointerLock() as unknown as Promise<void> | undefined;
        result?.catch?.(enterDragMode);
      } catch {
        enterDragMode();
      }
    },
    deactivate() {
      exitDragMode();
      if (isLocked()) controls.unlock();
    },
    isActive,
    isPointerLocked: isLocked,
    onActiveChange(cb) {
      listeners.push(cb);
    },
    read() {
      euler.setFromQuaternion(camera.quaternion);
      const input: PlayerInput = {
        forward: (any(FORWARD) ? 1 : 0) - (any(BACK) ? 1 : 0),
        right: (any(RIGHT) ? 1 : 0) - (any(LEFT) ? 1 : 0),
        yaw: euler.y,
        run: any(RUN),
        jump: jumpQueued,
      };
      jumpQueued = false;
      return input;
    },
    dispose() {
      removeEventListener('keydown', onKeyDown);
      removeEventListener('keyup', onKeyUp);
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', onPointerUp);
      element.ownerDocument.removeEventListener('pointerlockerror', enterDragMode);
      controls.dispose();
    },
  };

  function any(codes: string[]): boolean {
    return codes.some((c) => pressed.has(c));
  }
}
