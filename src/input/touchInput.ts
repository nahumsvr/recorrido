import { Euler, type Camera } from 'three';
import type { PlayerInput } from '../player/playerController.ts';
import { joystickVector } from './joystick.ts';

export interface TouchInput {
  read(): PlayerInput;
  dispose(): void;
}

export interface TouchInputOptions {
  /** Short tap without dragging on the look side (used to pick APs). */
  onTap(clientX: number, clientY: number): void;
  /** Touches are ignored while this returns false (e.g. in inspection view). */
  enabled(): boolean;
}

const JOYSTICK_RADIUS_PX = 55;
const LOOK_SENSITIVITY = 0.005; // rad per pixel
const MAX_PITCH = (85 * Math.PI) / 180;
const TAP_MAX_MS = 280;
const TAP_MAX_MOVE_PX = 10;
const RUN_THRESHOLD = 0.92;

/**
 * Touch controls: a floating joystick on the left half of the screen (appears
 * where the thumb lands), drag to look on the right half, a jump button, and
 * tap-to-pick. Multi-touch: one finger moves while the other looks.
 */
export function createTouchInput(camera: Camera, element: HTMLElement, options: TouchInputOptions): TouchInput {
  const euler = new Euler(0, 0, 0, 'YXZ');
  let joyId: number | null = null;
  let joyOriginX = 0;
  let joyOriginY = 0;
  let joyDx = 0;
  let joyDy = 0;
  let lookId: number | null = null;
  let lookX = 0;
  let lookY = 0;
  let lookStartX = 0;
  let lookStartY = 0;
  let lookStartT = 0;
  let jumpQueued = false;

  const base = document.createElement('div');
  base.className = 'joystick';
  base.hidden = true;
  const knob = document.createElement('div');
  knob.className = 'joystick__knob';
  base.append(knob);

  const jump = document.createElement('button');
  jump.type = 'button';
  jump.className = 'jump-button';
  jump.textContent = 'Saltar';
  jump.setAttribute('aria-label', 'Saltar');
  jump.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    jumpQueued = true;
  });
  document.body.append(base, jump);

  const placeKnob = () => {
    const len = Math.hypot(joyDx, joyDy);
    const k = len > JOYSTICK_RADIUS_PX ? JOYSTICK_RADIUS_PX / len : 1;
    knob.style.transform = `translate(${joyDx * k}px, ${joyDy * k}px)`;
  };

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' || !options.enabled()) return;
    try {
      element.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nicety (keeps moves when the finger leaves the canvas); never block the gesture.
    }
    if (e.clientX < innerWidth / 2 && joyId === null) {
      joyId = e.pointerId;
      joyOriginX = e.clientX;
      joyOriginY = e.clientY;
      joyDx = joyDy = 0;
      base.style.left = `${joyOriginX}px`;
      base.style.top = `${joyOriginY}px`;
      base.hidden = false;
      placeKnob();
    } else if (lookId === null) {
      lookId = e.pointerId;
      lookX = lookStartX = e.clientX;
      lookY = lookStartY = e.clientY;
      lookStartT = performance.now();
    }
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId === joyId) {
      joyDx = e.clientX - joyOriginX;
      joyDy = e.clientY - joyOriginY;
      placeKnob();
    } else if (e.pointerId === lookId) {
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= (e.clientX - lookX) * LOOK_SENSITIVITY;
      euler.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, euler.x - (e.clientY - lookY) * LOOK_SENSITIVITY));
      camera.quaternion.setFromEuler(euler);
      lookX = e.clientX;
      lookY = e.clientY;
    }
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId === joyId) {
      joyId = null;
      joyDx = joyDy = 0;
      base.hidden = true;
    } else if (e.pointerId === lookId) {
      lookId = null;
      const quick = performance.now() - lookStartT < TAP_MAX_MS;
      const still = Math.hypot(e.clientX - lookStartX, e.clientY - lookStartY) < TAP_MAX_MOVE_PX;
      if (quick && still && e.type === 'pointerup') options.onTap(e.clientX, e.clientY);
    }
  };

  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerup', onUp);
  element.addEventListener('pointercancel', onUp);

  return {
    read() {
      euler.setFromQuaternion(camera.quaternion);
      const v = joystickVector(joyDx, joyDy, JOYSTICK_RADIUS_PX);
      const input: PlayerInput = {
        forward: v.forward,
        right: v.right,
        yaw: euler.y,
        run: v.magnitude >= RUN_THRESHOLD,
        jump: jumpQueued,
      };
      jumpQueued = false;
      return input;
    },
    dispose() {
      element.removeEventListener('pointerdown', onDown);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
      element.removeEventListener('pointercancel', onUp);
      base.remove();
      jump.remove();
    },
  };
}
