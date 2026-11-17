import { PerspectiveCamera, Color, type Scene, type WebGLRenderer } from 'three';
import { MODEL_SPECS } from '../data/cameras.ts';
import type { CameraItem } from './cameraLayer.ts';
import { formatTimestamp, letterbox, verticalFov, type Rect } from './cctvMath.ts';

const NEAR_M = 0.08;
const FAR_M = 300;

export interface CameraViewer {
  isOpen(): boolean;
  open(index?: number): void;
  close(): void;
  next(): void;
  prev(): void;
  /** Renders the current camera into the letterboxed stream area; call every frame while open. */
  render(renderer: WebGLRenderer, scene: Scene): void;
  /** Renders `item` as seen by its lens into a small rectangle (CSS pixels, top-left origin) over the current frame. */
  renderInset(renderer: WebGLRenderer, scene: Scene, item: CameraItem, rect: Rect): void;
  /** Recomputes the stream area after a window resize. */
  resize(): void;
  onClose(cb: () => void): void;
}

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/**
 * Full-screen security-camera monitor: the scene rendered from the selected
 * camera (datasheet horizontal FOV, 16:9 stream) with the on-screen display of
 * an IP camera (name, date/time, REC, lens and stream info) and camera buttons.
 */
export function createCameraViewer(items: readonly CameraItem[]): CameraViewer {
  const view = new PerspectiveCamera(60, 16 / 9, NEAR_M, FAR_M);
  const inset = new PerspectiveCamera(60, 16 / 9, NEAR_M, FAR_M);
  /** Points `cam` like the lens of `item`: datasheet HFOV, 16:9, along the aim. */
  const aimCamera = (cam: PerspectiveCamera, item: CameraItem): void => {
    const spec = MODEL_SPECS[item.camera.kind];
    cam.fov = verticalFov(item.camera.lens.hfov, spec.aspect);
    cam.aspect = spec.aspect;
    cam.position.copy(item.lensPosition);
    cam.up.set(0, 1, 0);
    cam.lookAt(item.lensPosition.clone().add(item.aim));
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
  };
  const black = new Color(0x000000);
  let index = 0;
  let opened = false;
  let closeCb: (() => void) | null = null;

  const root = el('div', 'cctv');
  root.hidden = true;
  const frame = el('div', 'cctv__frame');
  const scan = el('div', 'cctv__scan');

  const name = el('div', 'cctv__osd cctv__osd--tl');
  const clock = el('div', 'cctv__osd cctv__osd--tr');
  const info = el('div', 'cctv__osd cctv__osd--bl');
  const stream = el('div', 'cctv__osd cctv__osd--br');
  const rec = el('div', 'cctv__rec');
  rec.append(el('span', 'cctv__dot'), document.createTextNode('REC'));
  frame.append(scan, name, clock, info, stream, rec);

  const controls = el('div', 'cctv__controls');
  const prevBtn = el('button', 'cctv__btn', '◀');
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Cámara anterior');
  const nextBtn = el('button', 'cctv__btn', '▶');
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Cámara siguiente');
  const chips = el('div', 'cctv__chips');
  const chipButtons = items.map((item, i) => {
    const b = el('button', 'cctv__chip', item.camera.id.replace('CAM', ''));
    b.type = 'button';
    b.title = `${item.camera.id} — ${item.camera.zone}`;
    b.addEventListener('click', () => select(i));
    chips.append(b);
    return b;
  });
  const exit = el('button', 'cctv__btn cctv__btn--exit', 'Salir (Esc)');
  exit.type = 'button';
  controls.append(prevBtn, chips, nextBtn, exit);
  root.append(frame, controls);
  document.body.append(root);

  const layoutFrame = (): void => {
    const r = letterbox(innerWidth, innerHeight, MODEL_SPECS.dome.aspect);
    frame.style.left = `${r.left}px`;
    frame.style.top = `${r.top}px`;
    frame.style.width = `${r.width}px`;
    frame.style.height = `${r.height}px`;
  };

  const tickClock = (): void => {
    clock.textContent = formatTimestamp(new Date());
  };

  const visibleIndexes = (): number[] => items.flatMap((it, k) => (it.camera.hidden ? [] : [k]));
  /** Steps to the next camera that is not hidden (`dir` = 1 or -1). */
  const step = (dir: 1 | -1): void => {
    for (let n = 1; n <= items.length; n++) {
      const k = (index + dir * n + items.length * n) % items.length;
      if (!items[k]?.camera.hidden) return select(k);
    }
  };
  const select = (i: number): void => {
    index = (i + items.length) % items.length;
    chipButtons.forEach((b, k) => {
      b.disabled = !!items[k]?.camera.hidden;
    });
    const item = items[index]!;
    const cam = item.camera;
    const spec = MODEL_SPECS[cam.kind];
    aimCamera(view, item);

    name.textContent = `${cam.id}  ${cam.zone}`;
    info.innerHTML = '';
    info.append(
      el('div', '', `${spec.name} · ${cam.lens.mm} mm`),
      el('div', '', `HFOV ${cam.lens.hfov}° (ficha técnica)`),
    );
    stream.innerHTML = '';
    stream.append(
      el('div', '', `${spec.resolution} · ${spec.codec} · ${spec.fps} fps`),
      el('div', '', `IR ${spec.irRangeM} m · ${spec.protection}`),
    );
    chipButtons.forEach((b, k) => b.classList.toggle('cctv__chip--on', k === index));
    tickClock();
  };

  let clockTimer: number | undefined;
  const api: CameraViewer = {
    isOpen: () => opened,
    open(i) {
      opened = true;
      // Default to the first camera that is not hidden.
      i ??= items[index]?.camera.hidden ? (visibleIndexes()[0] ?? index) : index;
      root.hidden = false;
      document.body.classList.add('cctv-open');
      layoutFrame();
      select(i);
      window.clearInterval(clockTimer);
      clockTimer = window.setInterval(tickClock, 250);
    },
    close() {
      if (!opened) return;
      opened = false;
      root.hidden = true;
      document.body.classList.remove('cctv-open');
      window.clearInterval(clockTimer);
      closeCb?.();
    },
    next: () => step(1),
    prev: () => step(-1),
    resize() {
      if (opened) layoutFrame();
    },
    render(renderer, scene) {
      const r = letterbox(innerWidth, innerHeight, MODEL_SPECS.dome.aspect);
      const previousClear = renderer.getClearColor(new Color());
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, innerWidth, innerHeight);
      renderer.setClearColor(black, 1);
      renderer.clear();
      // Viewport and scissor take CSS pixels with the origin at the bottom-left.
      const y = innerHeight - (r.top + r.height);
      renderer.setViewport(r.left, y, r.width, r.height);
      renderer.setScissor(r.left, y, r.width, r.height);
      renderer.setScissorTest(true);
      renderer.render(scene, view);
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, innerWidth, innerHeight);
      renderer.setClearColor(previousClear, 1);
    },
    renderInset(renderer, scene, item, rect) {
      aimCamera(inset, item);
      const y = innerHeight - (rect.top + rect.height);
      renderer.setViewport(rect.left, y, rect.width, rect.height);
      renderer.setScissor(rect.left, y, rect.width, rect.height);
      renderer.setScissorTest(true);
      renderer.render(scene, inset);
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, innerWidth, innerHeight);
    },
    onClose(cb) {
      closeCb = cb;
    },
  };

  prevBtn.addEventListener('click', api.prev);
  nextBtn.addEventListener('click', api.next);
  exit.addEventListener('click', api.close);
  addEventListener('keydown', (e) => {
    if (!opened || e.repeat) return;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') api.next();
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') api.prev();
    else if (e.code === 'Escape') api.close();
  });
  return api;
}
