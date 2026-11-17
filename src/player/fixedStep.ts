/** Fixed-timestep accumulator: physics runs at `step` regardless of frame rate. */
export class FixedStep {
  private acc = 0;
  readonly step: number;
  /** Longest frame gap simulated; avoids a spiral after a tab was hidden. */
  private readonly maxFrame: number;

  constructor(step: number, maxFrame = 0.1) {
    this.step = step;
    this.maxFrame = maxFrame;
  }

  /** Returns how many physics steps to run for a frame of `dt` seconds. */
  advance(dt: number): number {
    this.acc += Math.min(Math.max(dt, 0), this.maxFrame);
    const n = Math.floor(this.acc / this.step);
    this.acc -= n * this.step;
    return n;
  }
}
