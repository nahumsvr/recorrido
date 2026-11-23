import type { Vector3 } from 'three';
import type { ApGroupId } from '../data/aps.ts';
import { accessPointNetwork, networkRows } from '../data/network.ts';
import { MOUNT_TOLERANCE_M } from './apLayer.ts';
import type { ApItem } from './apLayer.ts';

const GROUP_LABEL: Record<ApGroupId, string> = {
  table: 'Tabla de diseño',
  model: 'Modelo SketchUp',
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
        close.setAttribute('aria-label', 'Cerrar');
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
      row('Grupo', GROUP_LABEL[ap.group]);
      row('Modelo', ap.model);
      row('Zona', ap.zone);
      row('Altura de montaje', `${ap.position.h.toFixed(1)} m`);
      row('Posición (plano)', `X ${ap.position.x.toFixed(1)} · Y ${ap.position.y.toFixed(1)} m`);
      row('Montaje', item.mountKind === 'ceiling' ? 'Techo' : item.mountKind === 'wall' ? 'Muro' : 'Muro (no encontrado en el modelo)');
      const net = accessPointNetwork(ap.id);
      if (net) for (const [k, v] of networkRows(net)) row(k, v);
      distanceEl = row('Distancia', '');
      root.append(dl);

      if (!item.mounted) {
        const warn = document.createElement('p');
        warn.className = 'ap-panel__warn';
        warn.textContent =
          item.wallDistance === null
            ? 'No hay muro a menos de 3 m de estas coordenadas en el modelo 3D. Revisa el punto de montaje.'
            : `El muro más cercano en el modelo 3D está a ${item.wallDistance.toFixed(2)} m (> ${MOUNT_TOLERANCE_M} m). Revisa el punto de montaje.`;
        root.append(warn);
      }
    },
    updateDistance(eye) {
      if (current && distanceEl) distanceEl.textContent = `${current.position.distanceTo(eye).toFixed(1)} m de ti`;
    },
    onClose(cb) {
      closeCb = cb;
    },
  };
}
