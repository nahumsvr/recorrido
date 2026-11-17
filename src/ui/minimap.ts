import { OrthographicCamera, WebGLRenderTarget, type Scene, type WebGLRenderer } from 'three';
import { headingVector, planToMinimap, type MapBounds } from './minimapMath.ts';

export interface MinimapMarker {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly warn: boolean;
  /** CSS color of the marker's group. */
  readonly color: string;
  readonly visible: () => boolean;
}

export interface Minimap {
  /** Renders the static top-down background once (scene state must be prepared by the caller). */
  bake(renderer: WebGLRenderer, scene: Scene): void;
  draw(player: { x: number; y: number; yaw: number }, highlightedId: string | null): void;
  setVisible(visible: boolean): void;
  isVisible(): boolean;
}

const CSS_WIDTH = 220;
const WARN_COLOR = '#f2a43a';
const PLAYER_COLOR = '#ff5a5a';

export function createMinimap(bounds: MapBounds, markers: readonly MinimapMarker[]): Minimap {
  const cssHeight = Math.round((CSS_WIDTH * (bounds.maxY - bounds.minY)) / (bounds.maxX - bounds.minX));
  const dpr = Math.min(devicePixelRatio, 2);
  const width = Math.round(CSS_WIDTH * dpr);
  const height = Math.round(cssHeight * dpr);

  const canvas = document.createElement('canvas');
  canvas.className = 'minimap';
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${CSS_WIDTH}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Minimapa: tu posición, dirección de vista y access points');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');

  const background = document.createElement('canvas');
  background.width = width;
  background.height = height;
  let last = '';

  return {
    bake(renderer, scene) {
      // Top-down orthographic view: screen up = north (-Z), screen right = east (+X).
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cz = (bounds.minY + bounds.maxY) / 2;
      const halfW = (bounds.maxX - bounds.minX) / 2;
      const halfH = (bounds.maxY - bounds.minY) / 2;
      const cam = new OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 200);
      cam.position.set(cx, 100, cz);
      cam.up.set(0, 0, -1);
      cam.lookAt(cx, 0, cz);

      const target = new WebGLRenderTarget(width, height);
      const prevTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      renderer.render(scene, cam);
      const pixels = new Uint8Array(width * height * 4);
      renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
      renderer.setRenderTarget(prevTarget);
      target.dispose();

      // GL rows are bottom-up; flip into the 2D canvas.
      const image = new ImageData(width, height);
      for (let row = 0; row < height; row++) {
        const src = (height - 1 - row) * width * 4;
        image.data.set(pixels.subarray(src, src + width * 4), row * width * 4);
      }
      background.getContext('2d')?.putImageData(image, 0, 0);
      last = '';
    },
    draw(player, highlightedId) {
      if (canvas.hidden) return;
      const shown = markers.map((m) => (m.visible() ? 1 : 0)).join('');
      const key = `${player.x.toFixed(2)},${player.y.toFixed(2)},${player.yaw.toFixed(3)},${highlightedId},${shown}`;
      if (key === last) return;
      last = key;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(background, 0, 0);

      for (const m of markers) {
        if (!m.visible()) continue;
        const { u, v } = planToMinimap(m.x, m.y, bounds, width, height);
        const active = m.id === highlightedId;
        ctx.beginPath();
        ctx.arc(u, v, (active ? 5 : 3.5) * dpr, 0, Math.PI * 2);
        ctx.fillStyle = m.warn ? WARN_COLOR : m.color;
        ctx.fill();
        if (active) {
          ctx.lineWidth = 1.5 * dpr;
          ctx.strokeStyle = '#fff';
          ctx.stroke();
        }
      }

      const { u, v } = planToMinimap(player.x, player.y, bounds, width, height);
      const { du, dv } = headingVector(player.yaw);
      const len = 11 * dpr;
      const side = 5 * dpr;
      ctx.beginPath();
      ctx.moveTo(u + du * len, v + dv * len);
      ctx.lineTo(u - dv * side - du * side * 0.6, v + du * side - dv * side * 0.6);
      ctx.lineTo(u + dv * side - du * side * 0.6, v - du * side - dv * side * 0.6);
      ctx.closePath();
      ctx.fillStyle = PLAYER_COLOR;
      ctx.fill();
      ctx.lineWidth = 1 * dpr;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    },
    setVisible(visible) {
      canvas.hidden = !visible;
      last = '';
    },
    isVisible: () => !canvas.hidden,
  };
}
