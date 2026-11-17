import { describe, expect, it } from 'vitest';
import { BoxGeometry, BufferGeometry, Euler, Mesh, PlaneGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { PlayerController, type PlayerInput } from '../../src/player/playerController.ts';

const DT = 1 / 120;

function box(w: number, h: number, d: number, x: number, y: number, z: number, rotX = 0): BufferGeometry {
  const g = new BoxGeometry(w, h, d);
  const m = new Mesh(g);
  m.position.set(x, y, z);
  m.rotation.copy(new Euler(rotX, 0, 0));
  m.updateMatrixWorld();
  return g.applyMatrix4(m.matrixWorld).toNonIndexed();
}

function floor(size = 60, h = 0): BufferGeometry {
  return new PlaneGeometry(size, size).rotateX(-Math.PI / 2).translate(0, h, 0).toNonIndexed();
}

function world(...parts: BufferGeometry[]): MeshBVH {
  const merged = mergeGeometries(parts.map((p) => {
    p.deleteAttribute('uv');
    p.deleteAttribute('normal');
    return p;
  }));
  return new MeshBVH(merged);
}

/** Walk toward -Z (yaw 0) for `seconds`. */
function walk(p: PlayerController, seconds: number, input: Partial<PlayerInput> = {}): void {
  const full: PlayerInput = { forward: 1, right: 0, yaw: 0, run: false, jump: false, ...input };
  for (let t = 0; t < seconds; t += DT) p.step(full, DT);
}

describe('PlayerController', () => {
  it('stands on the floor with eyes at 1.60 m under gravity', () => {
    const p = new PlayerController(world(floor()), { spawn: new Vector3(0, 2, 0) });
    walk(p, 2, { forward: 0 });
    expect(p.position.y).toBeCloseTo(0, 2);
    expect(p.eyePosition().y).toBeCloseTo(1.6, 2);
    expect(p.onGround).toBe(true);
  });

  it('is blocked by a wall and keeps the capsule radius from it', () => {
    // Wall face at z = -3.
    const p = new PlayerController(world(floor(), box(10, 4, 0.2, 0, 2, -3.1)), { spawn: new Vector3(0, 0, 0) });
    walk(p, 5);
    expect(p.position.z).toBeGreaterThan(-3 + 0.29);
    expect(p.position.z).toBeLessThan(-3 + 0.32);
  });

  it('climbs a 0.30 m step by walking', () => {
    const p = new PlayerController(world(floor(), box(10, 0.3, 4, 0, 0.15, -4)), { spawn: new Vector3(0, 0, 0) });
    walk(p, 1.5);
    expect(p.position.y).toBeCloseTo(0.3, 2);
    expect(p.position.z).toBeLessThan(-2.5);
  });

  it('does not climb a 0.50 m step by walking, but does by jumping', () => {
    const p = new PlayerController(world(floor(), box(10, 0.5, 4, 0, 0.25, -4)), { spawn: new Vector3(0, 0, 0) });
    walk(p, 3);
    expect(p.position.y).toBeCloseTo(0, 2);
    expect(p.position.z).toBeGreaterThan(-2.0);
    walk(p, DT * 2, { jump: true });
    walk(p, 1);
    expect(p.position.y).toBeCloseTo(0.5, 2);
    expect(p.position.z).toBeLessThan(-2.5);
  });

  it('walks up a 30° ramp', () => {
    // Ramp rising toward -Z: thin slab rotated about X.
    // Surface emerges from the floor near z = -4 and tops out at h ≈ 2 near z = -7.5.
    const ramp = box(6, 0.1, 8, 0, 0, -4, Math.PI / 6);
    const p = new PlayerController(world(floor(), ramp), { spawn: new Vector3(0, 0, -3) });
    walk(p, 3);
    expect(p.position.y).toBeGreaterThan(1.0);
    expect(p.position.y).toBeLessThan(2.1);
  });

  it('slides down a 45° ramp and cannot climb it', () => {
    const ramp = box(6, 0.1, 8, 0, 0, -4, Math.PI / 4);
    const p = new PlayerController(world(floor(), ramp), { spawn: new Vector3(0, 0, 0) });
    walk(p, 4, { run: true });
    expect(p.position.y).toBeLessThan(0.6);
  });

  it('descends 0.25 m stairs without leaving the ground', () => {
    // Landing h=1 spans z 0.5..4.5; steps of 0.25 m go down toward -Z, one per meter.
    const stairs = [0, 1, 2, 3].map((i) => box(10, 1 - i * 0.25, 1, 0, (1 - i * 0.25) / 2, -i));
    const p = new PlayerController(world(floor(), box(10, 1, 4, 0, 0.5, 2.5), ...stairs), { spawn: new Vector3(0, 1, 2) });
    let airborneSteps = 0;
    for (let t = 0; t < 5; t += DT) {
      p.step({ forward: 1, right: 0, yaw: 0, run: false, jump: false }, DT);
      if (!p.onGround) airborneSteps++;
    }
    expect(p.position.y).toBeCloseTo(0, 2);
    expect(airborneSteps).toBe(0);
  });

  it('respawns at the last safe position after falling through a hole', () => {
    const left = box(10, 0.2, 10, 0, -0.1, 5.5);
    const right = box(10, 0.2, 10, 0, -0.1, -6.5);
    const p = new PlayerController(world(left, right), { spawn: new Vector3(0, 0, 2), respawnBelow: -3 });
    walk(p, 4);
    walk(p, 1.5, { forward: 0 });
    expect(p.respawns).toBeGreaterThanOrEqual(1);
    expect(p.position.y).toBeCloseTo(0, 1);
    expect(p.position.z).toBeGreaterThan(0);
  });

  it('never sinks below the safety floor', () => {
    const p = new PlayerController(world(box(1, 0.1, 1, 50, 0, 50)), { spawn: new Vector3(0, 3, 0), safetyFloor: 0 });
    walk(p, 2, { forward: 0 });
    expect(p.position.y).toBeCloseTo(0, 3);
    expect(p.onGround).toBe(true);
  });

  it('teleport with snap lands on the floor below, not on the roof above', () => {
    const roof = box(20, 0.2, 20, 0, 9, 0);
    const p = new PlayerController(world(floor(), roof), { spawn: new Vector3(0, 5, 0) });
    p.teleport(new Vector3(2, 0.1, 2), true);
    expect(p.position.y).toBeCloseTo(0, 3);
  });

  it('moves relative to yaw and runs faster than it walks', () => {
    const a = new PlayerController(world(floor()), { spawn: new Vector3(0, 0, 0) });
    walk(a, 1, { yaw: -Math.PI / 2 }); // facing +X
    expect(a.position.x).toBeGreaterThan(1.2);
    expect(Math.abs(a.position.z)).toBeLessThan(0.01);
    const b = new PlayerController(world(floor()), { spawn: new Vector3(0, 0, 0) });
    walk(b, 1, { run: true });
    expect(-b.position.z).toBeGreaterThan(-a.position.z + 1);
  });
});
