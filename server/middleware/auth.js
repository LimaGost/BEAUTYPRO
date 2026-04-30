import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'beautypro-secret-change-in-production';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  const tokenFromQuery = req.query._token;
  const rawToken = auth?.startsWith('Bearer ') ? auth.slice(7) : tokenFromQuery;

  if (!rawToken) return res.status(401).json({ error: 'Não autenticado.' });

  try {
    req.user = jwt.verify(rawToken, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Acesso restrito.' });
  }
  next();
}
