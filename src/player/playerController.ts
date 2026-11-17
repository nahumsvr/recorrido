import { Box3, DoubleSide, Line3, Ray, Vector3 } from 'three';
import type { MeshBVH } from 'three-mesh-bvh';
import { pushOutOfObstacle, type Obstacle, type Push } from './obstacles.ts';

export interface PlayerInput {
  /** -1..1, positive = forward (camera look direction on the floor). */
  readonly forward: number;
  /** -1..1, positive = strafe right. */
  readonly right: number;
  /** Camera yaw in radians (three.js: 0 looks toward -Z). */
  readonly yaw: number;
  readonly run: boolean;
  readonly jump: boolean;
}

export interface PlayerConfig {
  radius: number;
  height: number;
  eyeHeight: number;
  gravity: number;
  walkSpeed: number;
  runSpeed: number;
  jumpSpeed: number;
  /** Highest step climbed by walking (m). */
  maxStep: number;
  /** Steepest walkable slope (degrees). */
  maxSlopeDeg: number;
  /** Virtual floor that can never be crossed (h). Use -Infinity to disable. */
  safetyFloor: number;
  /** Falling below this h teleports back to the last safe spot. */
  respawnBelow: number;
  spawn: Vector3;
  /** Extra solid footprints (props that are not part of the collision mesh). */
  obstacles: readonly Obstacle[];
}

export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  radius: 0.3,
  height: 1.75,
  eyeHeight: 1.65,
  gravity: 9.8,
  walkSpeed: 1.4,
  runSpeed: 3.0,
  jumpSpeed: 3.6,
  maxStep: 0.35,
  maxSlopeDeg: 40,
  safetyFloor: -Infinity,
  respawnBelow: -3,
  spawn: new Vector3(),
  obstacles: [],
};

interface Ground {
  /** Highest surface under the feet within reach, or -Infinity. */
  readonly height: number;
  /** True when that highest surface is flat enough to stand on. */
  readonly walkable: boolean;
  /** Every probe ray found walkable ground (used to record safe spots). */
  readonly fullySupported: boolean;
  readonly normal: Vector3;
}

const GROUND_EPS = 0.02;
const RESOLVE_PASSES = 3;
/** Horizontal speed (m/s) when sliding off a too-steep surface. */
const SLIDE_SPEED = 2;

/**
 * First-person walker over a static BVH.
 *
 * Split model: a capsule raised by `maxStep` resolves horizontal collisions
 * (walls block, anything lower than a step is ignored), and downward probe rays
 * own vertical support (step up/down snapping, slopes, landing). Positions are
 * feet positions in world space (= plan coordinates, y = h).
 */
export class PlayerController {
  readonly position = new Vector3();
  readonly velocity = new Vector3();
  onGround = false;
  respawns = 0;

  private readonly cfg: PlayerConfig;
  private readonly cosMaxSlope: number;
  private readonly lastSafe = new Vector3();

  // Scratch objects (no per-step allocations).
  private readonly segment = new Line3();
  private readonly box = new Box3();
  private readonly triPoint = new Vector3();
  private readonly capPoint = new Vector3();
  private readonly push = new Vector3();
  private readonly ray = new Ray();
  private readonly tmp = new Vector3();
  private readonly groundNormal = new Vector3();
  private readonly obstaclePush: Push = { x: 0, z: 0 };

  private readonly bvh: MeshBVH;

  constructor(bvh: MeshBVH, config: Partial<PlayerConfig> = {}) {
    this.bvh = bvh;
    this.cfg = { ...DEFAULT_PLAYER_CONFIG, ...config };
    this.cosMaxSlope = Math.cos((this.cfg.maxSlopeDeg * Math.PI) / 180);
    this.teleport(this.cfg.spawn);
  }

  get config(): Readonly<PlayerConfig> {
    return this.cfg;
  }

  eyePosition(target = new Vector3()): Vector3 {
    return target.copy(this.position).setY(this.position.y + this.cfg.eyeHeight);
  }

  /**
   * Places the feet at `feet`; when `snapToGround`, drops onto the first floor
   * at most `maxStep` above `feet.y` (so a ceiling or roof is never picked).
   */
  teleport(feet: Vector3, snapToGround = false): void {
    this.position.copy(feet);
    this.velocity.set(0, 0, 0);
    this.onGround = false;
    if (snapToGround) {
      const g = this.probeGround(this.cfg.maxStep);
      if (g.height > -Infinity) this.position.y = g.height;
    }
    this.lastSafe.copy(this.position);
  }

  step(input: PlayerInput, dt: number): void {
    const c = this.cfg;
    const speed = input.run ? c.runSpeed : c.walkSpeed;

    // Wish direction on the floor plane from yaw (yaw 0 → forward is -Z).
    const sin = Math.sin(input.yaw);
    const cos = Math.cos(input.yaw);
    let wx = -sin * input.forward + cos * input.right;
    let wz = -cos * input.forward - sin * input.right;
    const len = Math.hypot(wx, wz);
    if (len > 1) {
      wx /= len;
      wz /= len;
    }

    // ---- Horizontal ----
    const startX = this.position.x;
    const startZ = this.position.z;
    this.position.x += wx * speed * dt;
    this.position.z += wz * speed * dt;
    this.resolveHorizontal();

    // Refuse to walk up slopes steeper than maxSlope.
    // Compared against the ground under the start position (not the feet), so a
    // player hovering after a slide cannot creep up in sub-epsilon increments.
    let ground = this.probeGround(c.maxStep);
    if (!ground.walkable) {
      const nextHeight = ground.height;
      const movedX = this.position.x;
      const movedZ = this.position.z;
      this.position.x = startX;
      this.position.z = startZ;
      ground = this.probeGround(c.maxStep);
      if (nextHeight <= ground.height + 1e-4) {
        // Moving downhill or level on a steep surface is allowed.
        this.position.x = movedX;
        this.position.z = movedZ;
        ground = this.probeGround(c.maxStep);
      }
    }

    // ---- Vertical ----
    if (this.onGround && input.jump) {
      this.velocity.y = c.jumpSpeed;
      this.onGround = false;
    }

    const wasOnGround = this.onGround;
    if (wasOnGround && ground.walkable && this.position.y - ground.height <= c.maxStep + GROUND_EPS) {
      // Stick to the floor: climbs steps up to maxStep and follows stairs/ramps down.
      this.position.y = Math.max(ground.height, this.position.y - c.maxStep);
      this.velocity.y = 0;
      this.onGround = this.position.y - ground.height <= GROUND_EPS;
    } else {
      this.velocity.y -= c.gravity * dt;
      const nextY = this.position.y + this.velocity.y * dt;
      if (this.velocity.y > 0) {
        this.position.y = this.clampToCeiling(nextY);
      } else if (nextY <= ground.height) {
        this.position.y = ground.height;
        if (ground.walkable) {
          this.velocity.y = 0;
          this.onGround = true;
        } else {
          this.slideDownSlope(ground.normal, dt);
        }
      } else {
        this.position.y = nextY;
        this.onGround = false;
      }
    }

    if (this.position.y <= c.safetyFloor) {
      this.position.y = c.safetyFloor;
      this.velocity.y = 0;
      this.onGround = true;
    }

    if (this.onGround && ground.fullySupported) this.lastSafe.copy(this.position);
    if (this.position.y < c.respawnBelow) {
      this.respawns++;
      this.teleport(this.lastSafe);
    }
  }

  private resolveHorizontal(): void {
    const { radius, maxStep, height } = this.cfg;
    const seg = this.segment;
    seg.start.set(this.position.x, this.position.y + maxStep + radius, this.position.z);
    seg.end.set(this.position.x, this.position.y + height - radius, this.position.z);
    const originalStart = this.tmp.copy(seg.start);

    for (let pass = 0; pass < RESOLVE_PASSES; pass++) {
      let moved = false;
      this.box.makeEmpty().expandByPoint(seg.start).expandByPoint(seg.end).expandByScalar(radius);
      this.bvh.shapecast({
        intersectsBounds: (b) => b.intersectsBox(this.box),
        intersectsTriangle: (tri) => {
          const d = tri.closestPointToSegment(seg, this.triPoint, this.capPoint);
          if (d >= radius) return;
          if (d > 1e-6) {
            this.push.subVectors(this.capPoint, this.triPoint).divideScalar(d);
          } else {
            tri.getNormal(this.push);
          }
          this.push.y = 0; // walls only push sideways
          const l = this.push.length();
          if (l < 1e-6) return;
          this.push.multiplyScalar((radius - d) / l);
          seg.start.add(this.push);
          seg.end.add(this.push);
          moved = true;
        },
      });
      if (!moved) break;
    }
    this.position.x += seg.start.x - originalStart.x;
    this.position.z += seg.start.z - originalStart.z;

    for (const o of this.cfg.obstacles) {
      if (pushOutOfObstacle(o, this.position.x, this.position.z, radius, this.position.y, this.obstaclePush)) {
        this.position.x += this.obstaclePush.x;
        this.position.z += this.obstaclePush.z;
      }
    }
  }

  /**
   * Casts 5 rays down (center + 4 around at 0.7 r) from `reach` above the feet.
   * Returns the highest hit; with `reach` = maxStep, surfaces higher than a step
   * are not considered ground (they are walls for the capsule).
   */
  private probeGround(reach: number): Ground {
    const r = this.cfg.radius * 0.7;
    const originY = this.position.y + reach + 0.01;
    let best = -Infinity;
    let bestWalkable = false;
    let supported = 0;
    for (let i = 0; i < 5; i++) {
      const ox = i === 1 ? r : i === 2 ? -r : 0;
      const oz = i === 3 ? r : i === 4 ? -r : 0;
      this.ray.origin.set(this.position.x + ox, originY, this.position.z + oz);
      this.ray.direction.set(0, -1, 0);
      const hit = this.bvh.raycastFirst(this.ray, DoubleSide);
      if (!hit || !hit.face) continue;
      const ny = Math.abs(hit.face.normal.y);
      const walkable = ny >= this.cosMaxSlope;
      if (walkable && Math.abs(hit.point.y - this.position.y) <= this.cfg.maxStep) supported++;
      if (hit.point.y > best) {
        best = hit.point.y;
        bestWalkable = walkable;
        this.groundNormal.copy(hit.face.normal);
        if (this.groundNormal.y < 0) this.groundNormal.negate();
      }
    }
    return { height: best, walkable: bestWalkable, fullySupported: supported === 5, normal: this.groundNormal };
  }

  private clampToCeiling(nextY: number): number {
    const headY = this.position.y + this.cfg.height;
    this.ray.origin.set(this.position.x, headY - 0.05, this.position.z);
    this.ray.direction.set(0, 1, 0);
    const hit = this.bvh.raycastFirst(this.ray, DoubleSide, 0, nextY - this.position.y + 0.05);
    if (!hit) return nextY;
    this.velocity.y = 0;
    return this.position.y;
  }

  private slideDownSlope(normal: Vector3, dt: number): void {
    // Accelerate along the downhill direction of a too-steep surface.
    const downhill = this.tmp.set(normal.x, 0, normal.z);
    if (downhill.lengthSq() < 1e-8) return;
    downhill.normalize().multiplyScalar(SLIDE_SPEED * dt);
    this.position.x += downhill.x;
    this.position.z += downhill.z;
    this.velocity.y = 0;
    this.onGround = false;
  }
}
