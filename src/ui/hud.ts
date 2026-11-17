export interface HudToggle {
  readonly id: string;
  readonly label: string;
  readonly initial: boolean;
  readonly onChange: (enabled: boolean) => void;
}

export interface Hud {
  setReadout(text: string): void;
}

export function createHud(title: string, toggles: readonly HudToggle[]): Hud {
  const root = document.createElement('div');
  root.className = 'hud';
  const h1 = document.createElement('h1');
  h1.textContent = title;
  root.append(h1);

  for (const t of toggles) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = t.id;
    input.checked = t.initial;
    input.addEventListener('change', () => t.onChange(input.checked));
    label.append(input, document.createTextNode(t.label));
    root.append(label);
  }

  const readout = document.createElement('div');
  readout.className = 'readout';
  readout.setAttribute('aria-live', 'polite');
  root.append(readout);
  document.body.append(root);

  return {
    setReadout(text) {
      readout.textContent = text;
    },
  };
}
