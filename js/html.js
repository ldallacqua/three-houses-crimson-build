// A tagged template that escapes every interpolated value unless it is itself the result of html``
// or raw(). Views build strings with it; the router writes them into the page in one go.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export class Safe {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ESC[c]);

export const raw = (value) => new Safe(String(value));

function render(value) {
  if (value == null || value === false || value === true) return '';
  if (value instanceof Safe) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return esc(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) out += render(values[i]) + strings[i + 1];
  return new Safe(out);
}

/** Notes text: escaped, then **bold** and *italic*. */
export function md(text) {
  return raw(
    esc(text ?? '')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>'),
  );
}
