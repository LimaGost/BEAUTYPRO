// ── Números ───────────────────────────────────────────────────────────────────

export function onlyNumbers(value) {
  return String(value ?? '').replace(/\D/g, '');
}

// ── Celular brasileiro ────────────────────────────────────────────────────────

export function formatBrazilianCellphone(value) {
  const d = onlyNumbers(value).slice(0, 11);
  if (d.length === 0)  return '';
  if (d.length <= 2)   return `(${d}`;
  if (d.length <= 7)   return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Aceita 10 dígitos (fixo) ou 11 dígitos (celular com 9)
export function formatBrazilianPhone(value) {
  const d = onlyNumbers(value).slice(0, 11);
  if (d.length === 0)  return '';
  if (d.length <= 2)   return `(${d}`;
  if (d.length <= 6)   return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function validateBrazilianCellphone(value) {
  const d = onlyNumbers(value);
  if (d.length !== 11) return false;
  if (/^(\d)\1+$/.test(d)) return false;  // sequência repetida (11111111111)
  const ddd = parseInt(d.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;  // DDD inválido
  if (d[2] !== '9') return false;           // celular começa com 9 após DDD
  return true;
}

// Aceita celular (11 dígitos) ou fixo (10 dígitos)
export function validateBrazilianPhone(value) {
  const d = onlyNumbers(value);
  if (d.length !== 10 && d.length !== 11) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  const ddd = parseInt(d.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  return true;
}
