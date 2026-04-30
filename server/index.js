import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import entityRoutes from './routes/entities.js';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import adminRoutes from './routes/admin.js';
import { requireAuth } from './middleware/auth.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/entities', requireAuth, entityRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Em produção, serve o frontend buildado
if (isProd) {
  const distPath = join(__dirname, '..', 'dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    // Qualquer rota não-API devolve o index.html (React Router)
    app.get('*', (_req, res) => {
      res.sendFile(join(distPath, 'index.html'));
    });
  }
}

app.listen(PORT, () => {
  console.log(`BeautyPro ${isProd ? 'produção' : 'dev'} rodando na porta ${PORT}`);
});
