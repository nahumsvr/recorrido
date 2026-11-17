export type DoorEvent = 'rattle' | 'unlock' | 'close';

/** After a locked attempt the user has this long to confirm with a second press. */
export const UNLOCK_WINDOW_MS = 5000;

/**
 * Locked door that can still be opened: the first press only rattles the handle
 * (feedback that it is locked); a second press within the window unlocks and
 * opens it. Pressing an open door closes and locks it again.
 */
export class DoorLogic {
  private open = false;
  private armedUntil = 0;

  isOpen(): boolean {
    return this.open;
  }

  /** True while a second press would unlock the door. */
  isArmed(nowMs: number): boolean {
    return !this.open && nowMs < this.armedUntil;
  }

  interact(nowMs: number): DoorEvent {
    if (this.open) {
      this.open = false;
      this.armedUntil = 0;
      return 'close';
    }
    if (nowMs < this.armedUntil) {
      this.open = true;
      this.armedUntil = 0;
      return 'unlock';
    }
    this.armedUntil = nowMs + UNLOCK_WINDOW_MS;
    return 'rattle';
  }
}
