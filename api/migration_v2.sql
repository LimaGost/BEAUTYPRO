-- =============================================================================
-- BeautyPro — Migration v2
-- Execute no banco GLOBAL (mustech2):
--   psql -h pgsql.mustech.com.br -U mustech2 -d mustech2 -f api/migration_v2.sql
-- =============================================================================

-- ── companies: novas colunas ──────────────────────────────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id    INTEGER REFERENCES users(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug       VARCHAR(180);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS whatsapp   VARCHAR(30);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url   TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- Popula user_id a partir de users.company_id (relação inversa)
UPDATE companies c
SET user_id = u.id
FROM users u
WHERE u.company_id = c.id AND c.user_id IS NULL;

-- Gera slug para empresas existentes (normaliza acentos + espaços)
UPDATE companies SET slug = lower(name) WHERE slug IS NULL;
UPDATE companies SET slug = regexp_replace(slug, '[áàãâä]', 'a', 'g');
UPDATE companies SET slug = regexp_replace(slug, '[éèêë]',  'e', 'g');
UPDATE companies SET slug = regexp_replace(slug, '[íìîï]',  'i', 'g');
UPDATE companies SET slug = regexp_replace(slug, '[óòõôö]', 'o', 'g');
UPDATE companies SET slug = regexp_replace(slug, '[úùûü]',  'u', 'g');
UPDATE companies SET slug = regexp_replace(slug, '[ç]',     'c', 'g');
UPDATE companies SET slug = regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
UPDATE companies SET slug = regexp_replace(slug, '^-|-$',   '',  'g');

-- Garante unicidade do slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

-- ── business_hours: horário de intervalo ──────────────────────────────────────
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS is_open     BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS has_break   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS break_start TIME;
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS break_end   TIME;

-- ── Índices extras ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_companies_user_id  ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
