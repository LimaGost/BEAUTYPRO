-- =============================================================================
-- BeautyPro — Script completo de criação e atualização do banco
--
-- Execute no banco mustech2:
--   psql -h pgsql.mustech.com.br -U mustech2 -d mustech2 -f api/update_database.sql
--
-- Este script é 100% idempotente: pode ser rodado várias vezes sem problema.
-- Ele cria o que não existe e adiciona o que está faltando.
-- =============================================================================

-- ── Extensões ─────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABELA: companies
-- =============================================================================

CREATE TABLE IF NOT EXISTS companies (
    id               SERIAL      PRIMARY KEY,
    name             TEXT        NOT NULL,
    db_name          TEXT        NOT NULL UNIQUE,
    hours_configured BOOLEAN     NOT NULL DEFAULT false,
    created_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Colunas adicionadas ao longo do tempo (idempotente)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj        TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone       TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email       TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address     TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city        TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id     INTEGER REFERENCES users(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug        VARCHAR(180);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS whatsapp    VARCHAR(30);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url    TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT true;

-- =============================================================================
-- TABELA: users
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id         SERIAL    PRIMARY KEY,
    name       TEXT      NOT NULL,
    email      TEXT      UNIQUE NOT NULL,
    password   TEXT      NOT NULL,
    role       TEXT      NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf        TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Renomeia password_hash → password se ainda existir com nome antigo
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users RENAME COLUMN password_hash TO password;
    END IF;
END $$;

-- =============================================================================
-- TABELA: business_hours
-- =============================================================================

CREATE TABLE IF NOT EXISTS business_hours (
    id          SERIAL   PRIMARY KEY,
    company_id  INTEGER  NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time   TEXT,
    close_time  TEXT,
    is_open     BOOLEAN  NOT NULL DEFAULT true,
    UNIQUE (company_id, day_of_week)
);

ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS is_open     BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS has_break   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS break_start TIME;
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS break_end   TIME;

-- =============================================================================
-- DADOS DERIVADOS — preenche campos novos em registros existentes
-- =============================================================================

-- Preenche user_id nas empresas usando a relação inversa (users.company_id)
UPDATE companies c
SET user_id = u.id
FROM users u
WHERE u.company_id = c.id
  AND c.user_id IS NULL;

-- Gera slug para empresas que ainda não têm
UPDATE companies SET slug = lower(name)                                        WHERE slug IS NULL;
UPDATE companies SET slug = regexp_replace(slug, '[áàãâä]',     'a',  'g')    WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug, '[éèêë]',      'e',  'g')    WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug, '[íìîï]',      'i',  'g')    WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug, '[óòõôö]',     'o',  'g')    WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug, '[úùûü]',      'u',  'g')    WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug, '[ç]',         'c',  'g')    WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug, '[^a-z0-9]+',  '-',  'g')    WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug, '^-|-$',       '',   'g')    WHERE slug IS NOT NULL;

-- =============================================================================
-- ÍNDICES
-- =============================================================================

CREATE INDEX        IF NOT EXISTS idx_users_email         ON users(email);
CREATE INDEX        IF NOT EXISTS idx_users_company_id    ON users(company_id);
CREATE INDEX        IF NOT EXISTS idx_bh_company_id       ON business_hours(company_id);
CREATE INDEX        IF NOT EXISTS idx_companies_db_name   ON companies(db_name);
CREATE INDEX        IF NOT EXISTS idx_companies_user_id   ON companies(user_id);
CREATE INDEX        IF NOT EXISTS idx_companies_is_active ON companies(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug      ON companies(slug);

-- =============================================================================
-- ENUM user_role — garante que 'superadmin' existe no tipo
-- (ALTER TYPE ADD VALUE não pode rodar dentro de transação, por isso fica aqui)
-- =============================================================================

DO $$
BEGIN
    -- Verifica se o tipo user_role existe
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Adiciona 'superadmin' somente se ainda não estiver no enum
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'user_role' AND e.enumlabel = 'superadmin'
        ) THEN
            ALTER TYPE user_role ADD VALUE 'superadmin';
        END IF;
    END IF;
END $$;

-- Se a coluna role for TEXT (sem enum), garante que não quebre
-- (este bloco é inofensivo se a coluna já for TEXT)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'role'
          AND data_type = 'text'
    ) THEN
        -- Coluna já é TEXT, não precisa de nada
        NULL;
    END IF;
END $$;

-- =============================================================================
-- SUPERADMIN — cria ou atualiza o usuário administrador do sistema
--
-- !! TROQUE a senha antes de rodar !!
-- =============================================================================

DO $$
DECLARE
    v_name  TEXT := 'ADMINISTRADOR';
    v_email TEXT := 'admin@beautypro.com';
    v_senha TEXT := 'admin123';       -- << TROQUE AQUI
    v_hash  TEXT;
BEGIN
    v_hash := crypt(v_senha, gen_salt('bf', 10));

    IF EXISTS (SELECT 1 FROM users WHERE email = lower(v_email)) THEN
        UPDATE users
        SET name       = v_name,
            password   = v_hash,
            role       = 'superadmin',
            updated_at = NOW()
        WHERE email = lower(v_email);
        RAISE NOTICE '✓ Superadmin "%" atualizado.', v_email;
    ELSE
        INSERT INTO users (name, email, password, role)
        VALUES (v_name, lower(v_email), v_hash, 'superadmin');
        RAISE NOTICE '✓ Superadmin "%" criado.', v_email;
    END IF;
END $$;

-- =============================================================================
-- VERIFICAÇÃO FINAL — mostra o estado atual das tabelas
-- =============================================================================

SELECT '── EMPRESAS ──────────────────────────────' AS info;
SELECT id, name, slug, hours_configured, is_active, created_at FROM companies ORDER BY id;

SELECT '── USUÁRIOS ──────────────────────────────' AS info;
SELECT id, name, email, role, company_id, created_at FROM users ORDER BY id;

SELECT '── HORÁRIOS ──────────────────────────────' AS info;
SELECT company_id, day_of_week, is_open, open_time, close_time, has_break FROM business_hours ORDER BY company_id, day_of_week;
