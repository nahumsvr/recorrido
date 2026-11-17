import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from 'three';
import { LAYOUT } from '../config/alignment.ts';

const PX_PER_M = 40;
const LINE_M = 0.08;
const MARGIN_M = 1.5;

/**
 * Generic court markings over the court rectangle (perimeter inset, center line
 * and circle). Purely a visual cue: the real court layout was not modeled.
 */
export function createCourtLines(): Mesh {
  const w = LAYOUT.courtWidth;
  const d = LAYOUT.courtDepth;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * PX_PER_M);
  canvas.height = Math.round(d * PX_PER_M);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');

  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = LINE_M * PX_PER_M;
  const m = MARGIN_M * PX_PER_M;
  ctx.strokeRect(m, m, canvas.width - 2 * m, canvas.height - 2 * m);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, m);
  ctx.lineTo(canvas.width / 2, canvas.height - m);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 1.8 * PX_PER_M, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  const mesh = new Mesh(
    new PlaneGeometry(w, d),
    new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  );
  mesh.name = 'courtLines';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(w / 2, 0.005, d / 2);
  return mesh;
}
