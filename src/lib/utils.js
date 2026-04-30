import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


// Converte qualquer valor (string, null, undefined) para número seguro
export const toNum = (v) => parseFloat(v) || 0;

// Formata valor monetário com 2 casas decimais
export const fmtMoney = (v) => toNum(v).toFixed(2);
