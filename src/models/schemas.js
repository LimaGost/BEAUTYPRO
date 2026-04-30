/**
 * schemas.js — Definições de domínio (Model layer)
 *
 * Centraliza constantes de negócio que são usadas em múltiplas Views.
 * Evita magic strings espalhados pelo código e facilita manutenção.
 */

// ── Serviços ──────────────────────────────────────────────────────────────────

/** Mapeamento categoria_id → label exibido ao usuário */
export const SERVICE_CATEGORY_LABELS = {
  sobrancelha:       'Sobrancelha',
  cilios:            'Cílios',
  micropigmentacao:  'Micropigmentação',
  limpeza_pele:      'Limpeza de Pele',
  dermaplaning:      'Dermaplaning',
  outros:            'Outros',
};

export const SERVICE_CATEGORY_OPTIONS = Object.entries(SERVICE_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
);

/** Formata minutos em string legível: 90 → "1h 30min" */
export function formatDuration(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ── Profissionais ─────────────────────────────────────────────────────────────

/** Paleta de cores para o avatar do profissional */
export const PROFESSIONAL_COLORS = [
  '#C9A861', '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

/** Valores iniciais do formulário de profissional */
export const PROFESSIONAL_FORM_DEFAULT = {
  name:               '',
  email:              '',
  phone:              '',
  color:              '#C9A861',
  commission_percent: 0,
  document:           '',
  document_type:      'cpf',
  has_schedule:       true,
  permissions:        [],
  active:             true,
  photo_url:          '',
};

// ── Despesas ──────────────────────────────────────────────────────────────────

/** Categorias disponíveis para classificar despesas */
export const EXPENSE_CATEGORIES = [
  'Aluguel', 'Água', 'Luz', 'Internet', 'Telefone',
  'Produtos', 'Material', 'Marketing', 'Manutenção',
  'Equipamentos', 'Salários', 'Comissões', 'Impostos',
  'Adiantamento / Vale', 'Outros',
];

/** Tipos de despesa disponíveis e seus labels */
export const EXPENSE_TYPE_LABELS = {
  regular:     'Regular',
  fixed:       'Fixa Mensal',
  installment: 'Parcelada',
};

/** Valores iniciais do formulário de despesa */
export const EXPENSE_FORM_DEFAULT = {
  type:         'expense',
  expense_type: 'regular',
  amount:       0,
  date:         '',
  description:  '',
  category:     '',
  paid:         true,
};

// ── Financeiro ────────────────────────────────────────────────────────────────

/** Meses do ano para seletores de período */
export const MONTHS = [
  { value: 0,  label: 'Janeiro' },
  { value: 1,  label: 'Fevereiro' },
  { value: 2,  label: 'Março' },
  { value: 3,  label: 'Abril' },
  { value: 4,  label: 'Maio' },
  { value: 5,  label: 'Junho' },
  { value: 6,  label: 'Julho' },
  { value: 7,  label: 'Agosto' },
  { value: 8,  label: 'Setembro' },
  { value: 9,  label: 'Outubro' },
  { value: 10, label: 'Novembro' },
  { value: 11, label: 'Dezembro' },
];

// ── Produtos ──────────────────────────────────────────────────────────────────

/** Valores iniciais do formulário de produto */
export const PRODUCT_FORM_DEFAULT = {
  name:           '',
  category:       '',
  price:          0,
  cost:           0,
  stock_quantity: 0,
  min_stock:      1,
  unit:           'un',
  active:         true,
};

// ── Mensagens WhatsApp ────────────────────────────────────────────────────────

/**
 * Variáveis de substituição suportadas nos templates.
 * O envio substitui cada chave pelo valor correspondente do contexto
 * (nome do cliente, data/hora do agendamento, etc.).
 */
export const TEMPLATE_VARIABLES = [
  { key: '{nome}',    label: 'Nome do cliente' },
  { key: '{data}',    label: 'Data do agendamento' },
  { key: '{hora}',    label: 'Hora do agendamento' },
  { key: '{servico}', label: 'Nome do serviço' },
  { key: '{valor}',   label: 'Valor do serviço' },
];
