import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'beautypro-secret-change-in-production';
const JWT_EXPIRES = '7d';

router.post('/register', async (req, res) => {
  const { name, email, password, cpf, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Este email já está cadastrado.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password, cpf, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'admin')
       RETURNING id, name, email, role`,
      [name.trim(), email.toLowerCase(), hash, cpf || null, phone || null]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ token, user, company: null });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }

    const user = result.rows[0];
    const storedHash = user.password || user.password_hash;
    const valid = await bcrypt.compare(password, storedHash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }

    const company = await _getCompany(user.company_id);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, company });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const r = await query(
      'SELECT id, name, email, role, company_id FROM users WHERE id = $1',
      [payload.id]
    );
    if (!r.rows.length) return res.status(401).json({ error: 'Usuário não encontrado.' });

    const user = r.rows[0];
    const company = await _getCompany(user.company_id);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, company });
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
});

async function _getCompany(companyId) {
  if (!companyId) return null;
  const r = await query('SELECT * FROM companies WHERE id = $1', [companyId]);
  return r.rows[0] ?? null;
}

export default router;
