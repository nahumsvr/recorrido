import type { Teleport } from '../data/teleports.ts';

/** "Go to" buttons; pending destinations are shown disabled with their note. */
export function createTeleportMenu(teleports: readonly Teleport[], onSelect: (t: Teleport) => void): HTMLElement {
  const root = document.createElement('nav');
  root.className = 'teleport-menu';
  root.setAttribute('aria-label', 'Teletransporte');
  const title = document.createElement('h2');
  title.textContent = 'Ir a';
  root.append(title);

  const list = document.createElement('div');
  list.className = 'teleport-menu__list';
  for (const t of teleports) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = t.label;
    button.dataset.teleport = t.id;
    if (t.note) button.title = t.note;
    if (!t.position) button.disabled = true;
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelect(t);
    });
    list.append(button);
  }
  root.append(list);
  return root;
}
