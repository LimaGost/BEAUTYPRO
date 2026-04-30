import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireSuperAdmin);

// GET /api/admin/stats
router.get('/stats', async (_req, res) => {
  try {
    const [usersR, companiesR, recentR] = await Promise.all([
      query('SELECT COUNT(*) FROM users WHERE role != $1', ['superadmin']),
      query('SELECT COUNT(*) FROM companies'),
      query(
        `SELECT COUNT(*) FROM users
         WHERE role != 'superadmin' AND created_at >= NOW() - INTERVAL '30 days'`
      ),
    ]);

    res.json({
      total_users:      parseInt(usersR.rows[0].count),
      total_companies:  parseInt(companiesR.rows[0].count),
      new_last_30_days: parseInt(recentR.rows[0].count),
    });
  } catch (err) {
    console.error('admin stats error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /api/admin/companies
router.get('/companies', async (_req, res) => {
  try {
    const result = await query(`
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.city,
        c.hours_configured,
        c.created_at,
        u.name  AS owner_name,
        u.email AS owner_email
      FROM companies c
      LEFT JOIN users u ON u.company_id = c.id AND u.role = 'admin'
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('admin companies error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /api/admin/users
router.get('/users', async (_req, res) => {
  try {
    const result = await query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.created_at,
        c.name AS company_name
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE u.role != 'superadmin'
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('admin users error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id=$1 AND role != $2', [req.params.id, 'superadmin']);
    res.status(204).end();
  } catch (err) {
    console.error('admin delete user error:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
