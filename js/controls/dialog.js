// A confirmation in a modal <dialog>, in place of window.confirm: same look as the page, Escape
// or a click outside cancels, and focus starts on the safe button.

/**
 * @param {{ title: string, body: string, confirm?: string, cancel?: string, danger?: boolean }} opts
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, body, confirm = 'Confirmar', cancel = 'Cancelar', danger = false }) {
  const dialog = document.getElementById('dialog');
  if (!dialog?.showModal) return Promise.resolve(window.confirm(`${title}\n\n${body}`));
  dialog.querySelector('#dialog-title').textContent = title;
  dialog.querySelector('#dialog-body').textContent = body;
  const ok = dialog.querySelector('[data-dialog="ok"]');
  ok.textContent = confirm;
  ok.classList.toggle('danger', danger);
  dialog.querySelector('[data-dialog="cancel"]').textContent = cancel;
  dialog.returnValue = '';
  dialog.showModal();
  dialog.querySelector('[data-dialog="cancel"]').focus();
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
  });
}

export function initDialog() {
  const dialog = document.getElementById('dialog');
  if (!dialog) return;
  dialog.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dialog]');
    if (btn) dialog.close(btn.dataset.dialog);
    // The dialog box fills the element; a click on the element itself is on the backdrop.
    else if (e.target === dialog) dialog.close('');
  });
}
