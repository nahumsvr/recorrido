import type { InfoCard, Verdict } from '../data/infoCards.ts';

const VERDICT_LABEL: Record<Verdict, string> = {
  pass: 'Cumple',
  fail: 'No cumple',
  check: 'Verificar en obra',
};

export interface InfoCardView {
  /** Shows `card`, or hides with null. */
  show(card: InfoCard | null): void;
  onClose(cb: () => void): void;
}

/** Card superior derecha con los datos de un cable, bandeja, manga o bocina y las normas que cumple o no. */
export function createInfoCard(): InfoCardView {
  const root = document.createElement('aside');
  root.className = 'info-card';
  root.hidden = true;
  root.setAttribute('aria-live', 'polite');
  document.body.append(root);
  let closeCb: (() => void) | null = null;

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  return {
    show(card) {
      root.hidden = !card;
      document.body.classList.toggle('info-open', card !== null);
      if (!card) return;
      root.replaceChildren();

      const header = el('header');
      const heading = el('div');
      heading.append(el('span', 'info-card__kind', card.kind), el('h2', undefined, card.title));
      const close = el('button', 'info-card__close', '×');
      close.type = 'button';
      close.setAttribute('aria-label', 'Cerrar');
      close.addEventListener('click', () => closeCb?.());
      header.append(heading, close);
      root.append(header, el('p', 'info-card__subtitle', card.subtitle));

      const dl = el('dl');
      for (const [k, v] of card.specs) dl.append(el('dt', undefined, k), el('dd', undefined, v));
      root.append(dl);

      if (card.checks.length > 0) {
        const tally = { pass: 0, fail: 0, check: 0 };
        for (const c of card.checks) tally[c.verdict]++;
        const summary = el('p', 'info-card__summary');
        summary.append(
          el('span', 'info-card__pill info-card__pill--pass', `${tally.pass} cumplen`),
          el('span', 'info-card__pill info-card__pill--fail', `${tally.fail} no cumplen`),
          el('span', 'info-card__pill info-card__pill--check', `${tally.check} por verificar`),
        );
        root.append(el('h3', undefined, 'Normativas'), summary);

        const list = el('ul', 'info-card__checks');
        for (const c of card.checks) {
          const li = el('li', `info-card__check info-card__check--${c.verdict}`);
          const head = el('div', 'info-card__check-head');
          head.append(el('span', 'info-card__standard', c.standard), el('span', 'info-card__verdict', VERDICT_LABEL[c.verdict]));
          li.append(head, el('div', 'info-card__detail', c.detail));
          list.append(li);
        }
        root.append(list);
      }
    },
    onClose(cb) {
      closeCb = cb;
    },
  };
}
