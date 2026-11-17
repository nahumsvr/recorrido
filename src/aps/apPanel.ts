import type { Vector3 } from 'three';
import type { ApGroupId } from '../data/aps.ts';
import { MOUNT_TOLERANCE_M } from './apLayer.ts';
import type { ApItem } from './apLayer.ts';

const GROUP_LABEL: Record<ApGroupId, string> = {
  table: 'Design table',
  model: 'SketchUp model',
};

export interface ApPanel {
  /** Shows `item` (or hides with null); `pinned` adds a close button. */
  show(item: ApItem | null, pinned: boolean): void;
  /** Updates the live distance line. */
  updateDistance(eye: Vector3): void;
  onClose(cb: () => void): void;
}

export function createApPanel(): ApPanel {
  const root = document.createElement('aside');
  root.className = 'ap-panel';
  root.hidden = true;
  root.setAttribute('aria-live', 'polite');
  document.body.append(root);

  let current: ApItem | null = null;
  let closeCb: (() => void) | null = null;
  let distanceEl: HTMLElement | null = null;

  return {
    show(item, pinned) {
      if (item === current && root.dataset.pinned === String(pinned)) return;
      current = item;
      root.hidden = !item;
      root.dataset.pinned = String(pinned);
      if (!item) return;
      const { ap } = item;
      root.dataset.group = ap.group;
      root.replaceChildren();

      const header = document.createElement('header');
      const title = document.createElement('h2');
      title.textContent = ap.id;
      header.append(title);
      if (pinned) {
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'ap-panel__close';
        close.setAttribute('aria-label', 'Close');
        close.textContent = '×';
        close.addEventListener('click', () => closeCb?.());
        header.append(close);
      }
      root.append(header);

      const dl = document.createElement('dl');
      const row = (k: string, v: string) => {
        const dt = document.createElement('dt');
        dt.textContent = k;
        const dd = document.createElement('dd');
        dd.textContent = v;
        dl.append(dt, dd);
        return dd;
      };
      row('Group', GROUP_LABEL[ap.group]);
      row('Model', ap.model);
      row('Zone', ap.zone);
      row('Mount height', `${ap.position.h.toFixed(1)} m`);
      row('Position (plan)', `X ${ap.position.x.toFixed(1)} · Y ${ap.position.y.toFixed(1)} m`);
      row('Mount', item.mountKind === 'ceiling' ? 'Ceiling' : item.mountKind === 'wall' ? 'Wall' : 'Wall (not found in model)');
      distanceEl = row('Distance', '');
      root.append(dl);

      if (!item.mounted) {
        const warn = document.createElement('p');
        warn.className = 'ap-panel__warn';
        warn.textContent =
          item.wallDistance === null
            ? 'No wall within 3 m of these coordinates in the 3D model. Check the mounting spot.'
            : `Nearest wall in the 3D model is ${item.wallDistance.toFixed(2)} m away (> ${MOUNT_TOLERANCE_M} m). Check the mounting spot.`;
        root.append(warn);
      }
    },
    updateDistance(eye) {
      if (current && distanceEl) distanceEl.textContent = `${current.position.distanceTo(eye).toFixed(1)} m from you`;
    },
    onClose(cb) {
      closeCb = cb;
    },
  };
}
