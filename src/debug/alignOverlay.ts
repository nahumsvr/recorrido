import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
} from 'three';
import { LAYOUT } from '../config/alignment.ts';
import { planToThree } from '../domain/coords.ts';
import { ACCESS_POINTS } from '../data/aps.ts';

const GRID_STEP = 5;
const LINE_H = 0.03;

/**
 * Plan-coordinate references drawn over the model: 5 m grid, X=0 / Y=0 axes,
 * the court rectangle, and every AP from the design table.
 */
export function createAlignOverlay(): Group {
  const group = new Group();
  group.name = 'alignOverlay';

  const grid: number[] = [];
  for (let x = -5; x <= 60; x += GRID_STEP) grid.push(x, LINE_H, -5, x, LINE_H, 40);
  for (let y = -5; y <= 40; y += GRID_STEP) grid.push(-5, LINE_H, y, 60, LINE_H, y);
  group.add(lines(grid, 0x9aa3ad, 0.35));

  group.add(lines([0, LINE_H, -5, 0, LINE_H, 40], 0xff5a5a, 1)); // X = 0
  group.add(lines([-5, LINE_H, 0, 60, LINE_H, 0], 0x5aff8a, 1)); // Y = 0

  const w = LAYOUT.courtWidth;
  const d = LAYOUT.courtDepth;
  group.add(lines([0, LINE_H, 0, w, LINE_H, 0, w, LINE_H, 0, w, LINE_H, d, w, LINE_H, d, 0, LINE_H, d, 0, LINE_H, d, 0, LINE_H, 0], 0xffd23f, 1));

  const apGeo = new SphereGeometry(0.18, 12, 8);
  const apMat = new MeshBasicMaterial({ color: 0x36c2d6, depthTest: false });
  for (const ap of ACCESS_POINTS) {
    const dot = new Mesh(apGeo, apMat);
    dot.name = ap.id;
    dot.position.set(...planToThree(ap.position));
    dot.renderOrder = 10;
    group.add(dot);
  }
  return group;
}

function lines(positions: number[], color: number, opacity: number): LineSegments {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const mat = new LineBasicMaterial({ color, transparent: true, opacity, depthTest: false });
  const seg = new LineSegments(geo, mat);
  seg.renderOrder = 9;
  return seg;
}
