import { describe, expect, it } from 'vitest';
import { DoorLogic, UNLOCK_WINDOW_MS } from '../../src/domain/doorLogic.ts';

describe('DoorLogic', () => {
  it('first press only rattles: the door stays closed and locked', () => {
    const d = new DoorLogic();
    expect(d.interact(0)).toBe('rattle');
    expect(d.isOpen()).toBe(false);
    expect(d.isArmed(1)).toBe(true);
  });

  it('a second press within the window unlocks and opens', () => {
    const d = new DoorLogic();
    d.interact(0);
    expect(d.interact(UNLOCK_WINDOW_MS - 1)).toBe('unlock');
    expect(d.isOpen()).toBe(true);
  });

  it('a late second press is a new locked attempt', () => {
    const d = new DoorLogic();
    d.interact(0);
    expect(d.interact(UNLOCK_WINDOW_MS + 1)).toBe('rattle');
    expect(d.isOpen()).toBe(false);
  });

  it('closing relocks it: the next press rattles again', () => {
    const d = new DoorLogic();
    d.interact(0);
    d.interact(100);
    expect(d.interact(200)).toBe('close');
    expect(d.isOpen()).toBe(false);
    expect(d.interact(300)).toBe('rattle');
  });
});
