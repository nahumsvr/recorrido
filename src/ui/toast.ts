export interface Toast {
  /** Shows a transient message for `ms`. */
  show(text: string, tone?: 'info' | 'warn' | 'ok', ms?: number): void;
  /** Persistent hint line (null hides it). Transient messages take priority. */
  setHint(text: string | null): void;
}

export function createToast(): Toast {
  const root = document.createElement('div');
  root.className = 'toast';
  root.hidden = true;
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  document.body.append(root);

  let hint: string | null = null;
  let timer: number | undefined;
  let transient = false;

  const render = (): void => {
    if (!transient) {
      root.hidden = hint === null;
      root.textContent = hint ?? '';
      root.dataset.tone = 'info';
    }
  };

  return {
    show(text, tone = 'info', ms = 2400) {
      window.clearTimeout(timer);
      transient = true;
      root.hidden = false;
      root.textContent = text;
      root.dataset.tone = tone;
      timer = window.setTimeout(() => {
        transient = false;
        render();
      }, ms);
    },
    setHint(text) {
      if (text === hint) return;
      hint = text;
      render();
    },
  };
}
