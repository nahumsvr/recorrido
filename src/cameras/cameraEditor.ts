import { LENSES_BY_KIND, type CameraKind, type LensMm, type SecurityCamera } from '../data/cameras.ts';
import { LIMITS } from './cameraOverrides.ts';

export interface CameraPatch {
  kind?: CameraKind;
  lensMm?: LensMm;
  x?: number;
  y?: number;
  h?: number;
  panDeg?: number;
  tiltDeg?: number;
  hidden?: boolean;
}

export interface EditorHandlers {
  onSelect(index: number): void;
  onPatch(patch: CameraPatch): void;
  onPreview(): void;
  onResetOne(): void;
  onResetAll(): void;
  onSaveProject(): void;
  onExport(): void;
}

export interface CameraEditor {
  setVisible(visible: boolean): void;
  isVisible(): boolean;
  /** Shows `camera` (the selected one); `mountText` describes how it is mounted. */
  show(index: number, camera: SecurityCamera, mountText: string, edited: boolean): void;
  setStatus(text: string): void;
  /** Screen rectangle of the live preview frame, or null when the editor is hidden. */
  previewRect(): DOMRect | null;
}

function field(label: string, control: HTMLElement): HTMLLabelElement {
  const l = document.createElement('label');
  l.className = 'cam-editor__field';
  const span = document.createElement('span');
  span.textContent = label;
  l.append(span, control);
  return l;
}

function button(text: string, onClick: () => void, extra = ''): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `cam-editor__btn ${extra}`.trim();
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
}

function numberInput(min: number, max: number, step: number): HTMLInputElement {
  const i = document.createElement('input');
  i.type = 'number';
  i.min = String(min);
  i.max = String(max);
  i.step = String(step);
  return i;
}

function slider(min: number, max: number, step: number): HTMLInputElement {
  const i = document.createElement('input');
  i.type = 'range';
  i.min = String(min);
  i.max = String(max);
  i.step = String(step);
  return i;
}

export function createCameraEditor(
  ids: readonly string[],
  handlers: EditorHandlers,
  options: { canSaveToProject: boolean },
): CameraEditor {
  const root = document.createElement('aside');
  root.className = 'cam-editor';
  root.hidden = true;

  // Live preview: the scene is drawn into this frame by the main render loop.
  const pip = document.createElement('div');
  pip.className = 'cam-pip';
  pip.hidden = true;
  const pipLabel = document.createElement('div');
  pipLabel.className = 'cam-pip__label';
  pip.append(pipLabel);
  document.body.append(pip);

  const title = document.createElement('h2');
  title.textContent = 'Editar cámaras';
  const hint = document.createElement('p');
  hint.className = 'cam-editor__hint';
  hint.textContent = 'Haz clic en una cámara para seleccionarla y luego en un muro para moverla ahí (o escribe X / Y / H). Los cambios se guardan en este navegador.';

  const select = document.createElement('select');
  for (const id of ids) select.append(new Option(id, id));
  select.addEventListener('change', () => handlers.onSelect(select.selectedIndex));

  const kind = document.createElement('select');
  kind.append(new Option('Domo (VIGI C240I)', 'dome'), new Option('Bullet (VIGI C340I)', 'bullet'));
  const lens = document.createElement('select');
  const x = numberInput(...LIMITS.x, 0.05);
  const y = numberInput(...LIMITS.y, 0.05);
  const h = numberInput(...LIMITS.h, 0.05);
  const pan = slider(...LIMITS.pan, 1);
  const tilt = slider(...LIMITS.tilt, 1);
  const panOut = document.createElement('output');
  const tiltOut = document.createElement('output');
  const hidden = document.createElement('input');
  hidden.type = 'checkbox';
  hidden.addEventListener('change', () => handlers.onPatch({ hidden: hidden.checked }));
  const status = document.createElement('p');
  status.className = 'cam-editor__status';

  const fillLenses = (k: CameraKind, current: LensMm): void => {
    lens.replaceChildren(...LENSES_BY_KIND[k].map((mm) => new Option(`${mm} mm`, String(mm))));
    lens.value = String(current);
  };

  kind.addEventListener('change', () => handlers.onPatch({ kind: kind.value as CameraKind }));
  lens.addEventListener('change', () => handlers.onPatch({ lensMm: Number(lens.value) as LensMm }));
  const numeric = (input: HTMLInputElement, key: 'x' | 'y' | 'h'): void => {
    input.addEventListener('change', () => {
      const v = Number(input.value);
      if (Number.isFinite(v)) handlers.onPatch({ [key]: v });
    });
  };
  numeric(x, 'x');
  numeric(y, 'y');
  numeric(h, 'h');
  pan.addEventListener('input', () => handlers.onPatch({ panDeg: Number(pan.value) }));
  tilt.addEventListener('input', () => handlers.onPatch({ tiltDeg: Number(tilt.value) }));

  const position = document.createElement('div');
  position.className = 'cam-editor__row';
  position.append(field('X', x), field('Y', y), field('H', h));

  const row = (a: HTMLElement, b: HTMLElement): HTMLDivElement => {
    const d = document.createElement('div');
    d.className = 'cam-editor__buttons';
    d.append(a, b);
    return d;
  };
  const resetOne = button('Restablecer cámara', handlers.onResetOne);
  const buttons = [
    row(button('Ver a través de la cámara', handlers.onPreview), resetOne),
    row(
      button('Exportar JSON', handlers.onExport),
      options.canSaveToProject
        ? button('Guardar en el proyecto', handlers.onSaveProject, 'cam-editor__btn--primary')
        : button('Restablecer todas', handlers.onResetAll),
    ),
  ];
  if (options.canSaveToProject) buttons.push(row(button('Restablecer todas', handlers.onResetAll), document.createElement('span')));

  root.append(
    title,
    hint,
    field('Cámara', select),
    field('Tipo', kind),
    field('Lente', lens),
    field('Ocultar', hidden),
    position,
    field('Giro', pan),
    panOut,
    field('Inclinación', tilt),
    tiltOut,
    status,
    ...buttons,
  );
  document.body.append(root);

  // Keys typed into the form must not reach the walkthrough shortcuts.
  root.addEventListener('keydown', (e) => e.stopPropagation());

  return {
    setVisible(v) {
      root.hidden = !v;
      pip.hidden = !v;
    },
    previewRect: () => (pip.hidden ? null : pip.getBoundingClientRect()),
    isVisible: () => !root.hidden,
    show(index, camera, mountText, edited) {
      select.selectedIndex = index;
      kind.value = camera.kind;
      fillLenses(camera.kind, camera.lens.mm);
      const set = (input: HTMLInputElement, v: number): void => {
        if (document.activeElement !== input) input.value = String(Math.round(v * 100) / 100);
      };
      set(x, camera.position.x);
      set(y, camera.position.y);
      set(h, camera.position.h);
      hidden.checked = camera.hidden;
      pan.value = String(camera.panDeg);
      tilt.value = String(camera.tiltDeg);
      panOut.textContent = `Giro ${camera.panDeg}° desde la normal del muro`;
      tiltOut.textContent = `Inclinación ${camera.tiltDeg}° hacia abajo · HFOV ${camera.lens.hfov}°`;
      pipLabel.textContent = `${camera.id} · ${camera.lens.mm} mm · HFOV ${camera.lens.hfov}° · en vivo`;
      status.textContent = `${mountText}${edited ? ' · editada' : ''}`;
      status.dataset.warn = String(mountText.startsWith('⚠'));
      resetOne.disabled = !edited;
    },
    setStatus(text) {
      status.textContent = text;
    },
  };
}
