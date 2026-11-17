export interface HudToggle {
  readonly id: string;
  readonly label: string;
  readonly initial: boolean;
  readonly onChange: (enabled: boolean) => void;
  /** Starts a new titled section before this toggle. */
  readonly section?: string;
  /** CSS color of a small dot shown before the label (legend). */
  readonly swatch?: string;
}

export interface HudOptions {
  /** Start with the toggles and sections hidden behind the menu button. */
  readonly collapsed?: boolean;
}

export interface Hud {
  setReadout(text: string): void;
  /** Sets a toggle and fires its onChange. */
  setToggle(id: string, enabled: boolean): void;
  isOn(id: string): boolean;
  /** Adds a section (e.g. the teleport menu) at the bottom of the HUD. */
  append(section: HTMLElement): void;
}

export function createHud(title: string, toggles: readonly HudToggle[], options: HudOptions = {}): Hud {
  const root = document.createElement('div');
  root.className = 'hud';
  root.classList.toggle('hud--collapsed', !!options.collapsed);

  const header = document.createElement('div');
  header.className = 'hud__header';
  const h1 = document.createElement('h1');
  h1.textContent = title;
  const menu = document.createElement('button');
  menu.type = 'button';
  menu.className = 'hud__menu';
  menu.textContent = '☰';
  menu.setAttribute('aria-label', 'Mostrar u ocultar opciones');
  menu.setAttribute('aria-expanded', String(!options.collapsed));
  menu.addEventListener('click', () => {
    const collapsed = root.classList.toggle('hud--collapsed');
    menu.setAttribute('aria-expanded', String(!collapsed));
  });
  header.append(h1, menu);
  root.append(header);

  const body = document.createElement('div');
  body.className = 'hud__body';
  root.append(body);

  const inputs = new Map<string, { input: HTMLInputElement; toggle: HudToggle }>();
  for (const t of toggles) {
    if (t.section) {
      const h2 = document.createElement('h2');
      h2.className = 'hud__section';
      h2.textContent = t.section;
      body.append(h2);
    }
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = t.id;
    input.checked = t.initial;
    input.addEventListener('change', () => t.onChange(input.checked));
    label.append(input);
    if (t.swatch) {
      const dot = document.createElement('span');
      dot.className = 'hud__swatch';
      dot.style.background = t.swatch;
      label.append(dot);
    }
    label.append(document.createTextNode(t.label));
    body.append(label);
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
      body.append(section);
    },
  };
}
