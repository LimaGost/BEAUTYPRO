import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// GET /api/company — retorna empresa + horários do usuário autenticado
router.get('/', async (req, res) => {
  try {
    const userResult = await query(
      'SELECT company_id FROM users WHERE id = $1',
      [req.user.id]
    );
    const companyId = userResult.rows[0]?.company_id;
    if (!companyId) return res.json(null);

    const companyResult = await query(
      'SELECT * FROM companies WHERE id = $1',
      [companyId]
    );
    const company = companyResult.rows[0];
    if (!company) return res.json(null);

    const hoursResult = await query(
      'SELECT * FROM business_hours WHERE company_id = $1 ORDER BY day_of_week',
      [companyId]
    );
    company.business_hours = hoursResult.rows;
    res.json(company);
  } catch (err) {
    console.error('company GET error:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// PUT /api/company — cria ou atualiza empresa + horários
router.put('/', async (req, res) => {
  const { name, cnpj, phone, email, address, city, business_hours } = req.body;

  if (!name) return res.status(400).json({ error: 'Nome da empresa é obrigatório.' });

  try {
    const userResult = await query(
      'SELECT company_id FROM users WHERE id = $1',
      [req.user.id]
    );
    let companyId = userResult.rows[0]?.company_id;

    if (companyId) {
      // Atualiza empresa existente
      await query(
        `UPDATE companies SET name=$1, cnpj=$2, phone=$3, email=$4, address=$5, city=$6,
         hours_configured=true, updated_at=NOW() WHERE id=$7`,
        [name, cnpj || null, phone || null, email || null, address || null, city || null, companyId]
      );
    } else {
      // Cria nova empresa e vincula ao usuário
      const dbName = `bp_${req.user.id}`;
      const created = await query(
        `INSERT INTO companies (name, cnpj, phone, email, address, city, db_name, hours_configured)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING id`,
        [name, cnpj || null, phone || null, email || null, address || null, city || null, dbName]
      );
      companyId = created.rows[0].id;
      await query('UPDATE users SET company_id=$1 WHERE id=$2', [companyId, req.user.id]);
    }

    // Upsert horários
    if (Array.isArray(business_hours)) {
      for (const h of business_hours) {
        await query(
          `INSERT INTO business_hours (company_id, day_of_week, open_time, close_time, is_open)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (company_id, day_of_week)
           DO UPDATE SET open_time=$3, close_time=$4, is_open=$5`,
          [companyId, h.day_of_week, h.open_time || '09:00', h.close_time || '18:00', h.is_open ?? true]
        );
      }
    }

    const companyResult = await query('SELECT * FROM companies WHERE id = $1', [companyId]);
    const company = companyResult.rows[0];
    const hoursResult = await query(
      'SELECT * FROM business_hours WHERE company_id=$1 ORDER BY day_of_week',
      [companyId]
    );
    company.business_hours = hoursResult.rows;
    res.json(company);
  } catch (err) {
    console.error('company PUT error:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
