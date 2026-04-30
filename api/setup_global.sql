-- =============================================================================
-- BeautyPro — Setup do banco GLOBAL (mustech2)
--
-- Execute no banco mustech2:
--   psql -h pgsql.mustech.com.br -U mustech2 -d mustech2 -f setup_global.sql
--
-- Este script é idempotente: pode ser rodado múltiplas vezes com segurança.
-- Usa CREATE TABLE IF NOT EXISTS e ADD COLUMN IF NOT EXISTS.
--
-- Tabelas aqui: companies, users, business_hours
-- Tabelas das entidades (clients, appointments, etc.) ficam em cada banco
-- exclusivo de empresa — veja server/schema.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Empresas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id               SERIAL PRIMARY KEY,
    name             TEXT        NOT NULL,
    cnpj             TEXT,
    phone            TEXT,
    email            TEXT,
    address          TEXT,
    city             TEXT,
    db_name          TEXT        NOT NULL UNIQUE,
    hours_configured BOOLEAN     NOT NULL DEFAULT false,
    created_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Garante colunas caso a tabela já exista de versão anterior
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj             TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone            TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email            TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address          TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city             TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS db_name          TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS hours_configured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP NOT NULL DEFAULT NOW();

-- -----------------------------------------------------------------------------
-- Usuários
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL    PRIMARY KEY,
    name       TEXT      NOT NULL,
    email      TEXT      UNIQUE NOT NULL,
    password   TEXT      NOT NULL,     -- hash bcrypt
    cpf        TEXT,
    phone      TEXT,
    role       TEXT      NOT NULL DEFAULT 'admin',
    company_id INTEGER   REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Garante colunas caso a tabela já exista de versão anterior
-- (ex.: versão antiga usava "password_hash" em vez de "password")
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf        TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Se existia coluna "password_hash", renomeia para "password"
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

-- -----------------------------------------------------------------------------
-- Horários de funcionamento
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_hours (
    id          SERIAL   PRIMARY KEY,
    company_id  INTEGER  NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time   TEXT,
    close_time  TEXT,
    is_open     BOOLEAN  NOT NULL DEFAULT true,
    UNIQUE (company_id, day_of_week)
);

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id  ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_bh_company_id     ON business_hours(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_db_name ON companies(db_name);
