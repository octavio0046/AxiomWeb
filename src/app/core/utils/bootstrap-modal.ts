type BootstrapModalInstance = {
  show: () => void;
  hide: () => void;
};

type BootstrapModalApi = {
  getOrCreateInstance: (
    el: Element,
    options?: { backdrop?: boolean | 'static'; keyboard?: boolean; focus?: boolean }
  ) => BootstrapModalInstance;
  getInstance: (el: Element) => BootstrapModalInstance | null;
};

function getModalApi(): BootstrapModalApi | null {
  return (window as unknown as { bootstrap?: { Modal?: BootstrapModalApi } }).bootstrap?.Modal ?? null;
}

function clearStuckBackdrops(): void {
  document.querySelectorAll('.modal-backdrop').forEach((node) => node.remove());
  document.body.classList.remove('modal-open');
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
}

/** Abre un modal Bootstrap moviéndolo a document.body (evita pantalla gris). */
export function showBootstrapModal(id: string): void {
  const Modal = getModalApi();
  const el = document.getElementById(id);
  if (!Modal || !el) {
    console.error(`[Axiom] No se pudo abrir el modal "${id}". ¿Está cargado bootstrap.bundle?`);
    return;
  }

  clearStuckBackdrops();

  if (el.parentElement !== document.body) {
    document.body.appendChild(el);
  }

  Modal.getOrCreateInstance(el, {
    backdrop: true,
    keyboard: true,
    focus: true,
  }).show();
}

export function hideBootstrapModal(id: string): void {
  const Modal = getModalApi();
  const el = document.getElementById(id);
  if (!Modal || !el) return;

  Modal.getInstance(el)?.hide();

  window.setTimeout(() => {
    if (!document.querySelector('.modal.show')) {
      clearStuckBackdrops();
    }
  }, 250);
}
