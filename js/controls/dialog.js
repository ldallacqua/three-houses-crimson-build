// A confirmation in a modal <dialog>, in place of window.confirm: same look as the page, Escape
// or a click outside cancels, and focus starts on the safe button.
//
// The answer comes from the click (or Escape) itself, not from the dialog's close event, which some
// browsers only deliver on the next rendered frame.

let settle = null;

/** Close the dialog and answer the pending question once. */
function finish(value) {
  const dialog = document.getElementById('dialog');
  const resolve = settle;
  settle = null;
  if (dialog?.open) dialog.close(value);
  resolve?.(value === 'ok' || value === 'cancel' ? value : '');
}

/**
 * A choice between two answers. Resolves 'ok', 'cancel', or '' when dismissed (Escape, a click
 * outside), so a dismissal can mean "not now" where both buttons do something.
 * @param {{ title: string, body: string, confirm?: string, cancel?: string, danger?: boolean }} opts
 * @returns {Promise<'ok' | 'cancel' | ''>}
 */
export function chooseDialog({ title, body, confirm = 'Confirmar', cancel = 'Cancelar', danger = false }) {
  const dialog = document.getElementById('dialog');
  if (!dialog?.showModal) return Promise.resolve(window.confirm(`${title}\n\n${body}`) ? 'ok' : 'cancel');
  finish('');
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
    settle = resolve;
  });
}

/** Yes or no: true only for the confirm button. */
export async function confirmDialog(opts) {
  return (await chooseDialog(opts)) === 'ok';
}

export function initDialog() {
  const dialog = document.getElementById('dialog');
  if (!dialog) return;
  dialog.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dialog]');
    if (btn) finish(btn.dataset.dialog);
    // The dialog box fills the element; a click on the element itself is on the backdrop.
    else if (e.target === dialog) finish('');
  });
  // Escape.
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    finish('');
  });
  // Anything else that closes it answers with its return value. A late event from an earlier
  // question must not answer a dialog that is open again.
  dialog.addEventListener('close', () => {
    if (!dialog.open) finish(dialog.returnValue);
  });
}
