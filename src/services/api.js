import { Capacitor } from '@capacitor/core';

export const BASE = Capacitor.isNativePlatform()
  ? 'https://eleganceesteticastudio.mustech.com.br'
  : (import.meta.env.VITE_API_URL || '');

function token() {
  return localStorage.getItem('bp_token');
}

export async function request(method, path, body) {
  const tk  = token();
  const sep = path.includes('?') ? '&' : '?';
  const url = tk ? `${BASE}${path}${sep}_token=${encodeURIComponent(tk)}` : `${BASE}${path}`;

  const headers = { 'Content-Type': 'application/json' };
  if (tk) headers['Authorization'] = `Bearer ${tk}`;

  const res = await fetch(url, {
    method,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch {}
    throw new Error(msg || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function publicRequest(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch {}
    throw new Error(msg || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}
