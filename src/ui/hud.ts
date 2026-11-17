export interface HudToggle {
  readonly id: string;
  readonly label: string;
  readonly initial: boolean;
  readonly onChange: (enabled: boolean) => void;
}

export interface Hud {
  setReadout(text: string): void;
  /** Sets a toggle and fires its onChange. */
  setToggle(id: string, enabled: boolean): void;
  isOn(id: string): boolean;
  /** Adds a section (e.g. the teleport menu) at the bottom of the HUD. */
  append(section: HTMLElement): void;
}

export function createHud(title: string, toggles: readonly HudToggle[]): Hud {
  const root = document.createElement('div');
  root.className = 'hud';
  const h1 = document.createElement('h1');
  h1.textContent = title;
  root.append(h1);

  const inputs = new Map<string, { input: HTMLInputElement; toggle: HudToggle }>();
  for (const t of toggles) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = t.id;
    input.checked = t.initial;
    input.addEventListener('change', () => t.onChange(input.checked));
    label.append(input, document.createTextNode(t.label));
    root.append(label);
    inputs.set(t.id, { input, toggle: t });
  }

  const readout = document.createElement('div');
  readout.className = 'readout';
  readout.setAttribute('aria-live', 'polite');
  root.append(readout);
  document.body.append(root);

  return {
    setReadout(text) {
      if (readout.textContent !== text) readout.textContent = text;
    },
    setToggle(id, enabled) {
      const entry = inputs.get(id);
      if (!entry) return;
      entry.input.checked = enabled;
      entry.toggle.onChange(enabled);
    },
    isOn(id) {
      return inputs.get(id)?.input.checked ?? false;
    },
    append(section) {
      root.append(section);
    },
  };
}
