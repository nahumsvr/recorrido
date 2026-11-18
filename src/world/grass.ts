import { CanvasTexture, Mesh, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from 'three';

/** Side of the grass field, meters: far enough that the fog hides its edge. */
const FIELD_SIZE_M = 800;
/** One texture tile covers this many meters. */
const TILE_M = 4;
/** Just under the building floor (h 0) so the two never fight for the same depth. */
const GRASS_H = -0.04;
const TILE_PX = 256;

/** Small deterministic generator, so the texture is the same on every load. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Procedural tile of grass: a green base with blades of a few shades (no image asset to ship). */
function grassTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = TILE_PX;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const rand = rng(7);
    ctx.fillStyle = '#4f7f35';
    ctx.fillRect(0, 0, TILE_PX, TILE_PX);
    const shades = ['#3d6a2a', '#5e9142', '#6aa04a', '#48762f', '#7bb356', '#33591f'];
    for (let i = 0; i < 5200; i++) {
      const x = rand() * TILE_PX;
      const y = rand() * TILE_PX;
      const len = 3 + rand() * 7;
      ctx.strokeStyle = shades[Math.floor(rand() * shades.length)]!;
      ctx.lineWidth = 1 + rand();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rand() - 0.5) * 4, y - len);
      ctx.stroke();
      // Draw the blade again one tile over when it crosses an edge, so the tile repeats without a seam.
      if (x < 4 || x > TILE_PX - 4 || y < 8) {
        const ox = x < 4 ? TILE_PX : x > TILE_PX - 4 ? -TILE_PX : 0;
        const oy = y < 8 ? TILE_PX : 0;
        ctx.beginPath();
        ctx.moveTo(x + ox, y + oy);
        ctx.lineTo(x + ox + (rand() - 0.5) * 4, y + oy - len);
        ctx.stroke();
      }
    }
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(FIELD_SIZE_M / TILE_M, FIELD_SIZE_M / TILE_M);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** A flat field of grass around the auditorium, centered on `center` (plan X, Y). It never takes part in picking. */
export function createGrass(center: { x: number; y: number }): Mesh {
  const grass = new Mesh(
    new PlaneGeometry(FIELD_SIZE_M, FIELD_SIZE_M),
    new MeshStandardMaterial({ map: grassTexture(), roughness: 1, metalness: 0 }),
  );
  grass.name = 'grass';
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(center.x, GRASS_H, center.y);
  grass.raycast = () => {};
  return grass;
}
