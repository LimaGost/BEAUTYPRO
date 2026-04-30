import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

const ENTITY_TABLE_MAP = {
  appointment:     'appointments',
  client:          'clients',
  professional:    'professionals',
  service:         'services',
  product:         'products',
  transaction:     'transactions',
  messagetemplate: 'message_templates',
};

const ALLOWED_COLUMNS = {
  appointments: new Set([
    'id', 'date', 'start_time', 'end_time', 'client_id', 'client_name',
    'professional_id', 'professional_name', 'services', 'status', 'notes',
    'total_amount', 'type', 'created_at', 'updated_at',
  ]),
  clients: new Set([
    'id', 'first_name', 'last_name', 'phone', 'email', 'birthdate',
    'notes', 'tags', 'visit_count', 'total_spent', 'created_date', 'updated_at',
  ]),
  professionals: new Set([
    'id', 'name', 'email', 'phone', 'color', 'commission_percent', 'document',
    'document_type', 'has_schedule', 'permissions', 'specialties', 'active',
    'created_at', 'updated_at',
  ]),
  services: new Set([
    'id', 'name', 'category', 'price', 'duration_minutes', 'active',
    'description', 'created_at', 'updated_at',
  ]),
  products: new Set([
    'id', 'name', 'category', 'price', 'cost', 'stock_quantity',
    'min_stock', 'unit', 'active', 'created_at', 'updated_at',
  ]),
  transactions: new Set([
    'id', 'type', 'expense_type', 'amount', 'date', 'description',
    'payment_method', 'appointment_id', 'client_id', 'client_name',
    'professional_id', 'professional_name', 'services', 'category',
    'paid', 'created_at', 'updated_at',
  ]),
  message_templates: new Set([
    'id', 'name', 'type', 'content', 'active', 'created_at', 'updated_at',
  ]),
};

// Colunas que armazenam JSON
const JSONB_COLUMNS = {
  appointments: new Set(['services']),
  professionals: new Set(['permissions', 'specialties']),
  transactions: new Set(['services']),
  clients: new Set(['tags']),
};

function getTable(entityName) {
  return ENTITY_TABLE_MAP[entityName.toLowerCase()];
}

function coerceValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

// GET /api/entities/:entity
// Suporta filtros via query params e ordenação via _sort (prefixo - para DESC)
router.get('/:entity', async (req, res) => {
  try {
    const table = getTable(req.params.entity);
    if (!table) return res.status(404).json({ error: 'Entidade não encontrada' });

    const allowedCols = ALLOWED_COLUMNS[table];
    const { _sort, ...filters } = req.query;

    const conditions = [];
    const params = [];

    for (const [key, value] of Object.entries(filters)) {
      if (!allowedCols.has(key)) continue;
      params.push(coerceValue(value));
      conditions.push(`"${key}" = $${params.length}`);
    }

    let sql = `SELECT * FROM ${table}`;
    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;

    if (_sort) {
      const desc = _sort.startsWith('-');
      const field = desc ? _sort.slice(1) : _sort;
      if (allowedCols.has(field)) {
        sql += ` ORDER BY "${field}" ${desc ? 'DESC NULLS LAST' : 'ASC NULLS LAST'}`;
      }
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET entities error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/entities/:entity
router.post('/:entity', async (req, res) => {
  try {
    const table = getTable(req.params.entity);
    if (!table) return res.status(404).json({ error: 'Entidade não encontrada' });

    const allowedCols = ALLOWED_COLUMNS[table];
    const jsonbCols = JSONB_COLUMNS[table] || new Set();
    const data = req.body;

    const columns = [];
    const placeholders = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      if (!allowedCols.has(key) || key === 'id') continue;
      columns.push(`"${key}"`);
      params.push(jsonbCols.has(key) ? JSON.stringify(value) : value);
      placeholders.push(`$${params.length}`);
    }

    if (columns.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido fornecido' });
    }

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST entities error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/entities/:entity/:id
router.put('/:entity/:id', async (req, res) => {
  try {
    const table = getTable(req.params.entity);
    if (!table) return res.status(404).json({ error: 'Entidade não encontrada' });

    const allowedCols = ALLOWED_COLUMNS[table];
    const jsonbCols = JSONB_COLUMNS[table] || new Set();
    const data = req.body;
    const { id } = req.params;

    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      if (!allowedCols.has(key) || key === 'id') continue;
      params.push(jsonbCols.has(key) ? JSON.stringify(value) : value);
      setClauses.push(`"${key}" = $${params.length}`);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido fornecido' });
    }

    if (allowedCols.has('updated_at')) {
      setClauses.push(`"updated_at" = NOW()`);
    }

    params.push(id);
    const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`;
    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT entities error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/entities/:entity/:id
router.delete('/:entity/:id', async (req, res) => {
  try {
    const table = getTable(req.params.entity);
    if (!table) return res.status(404).json({ error: 'Entidade não encontrada' });

    await query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE entities error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
