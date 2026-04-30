-- ============================================================
-- BeautyPro - Script de atualizacao do banco mustech2
-- Execute conectado ao banco: mustech2
-- Idempotente: pode rodar varias vezes sem perder dados
-- ============================================================


-- ---- EXTENSOES ---------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ---- TABELA: users -----------------------------------------

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
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Renomeia password_hash -> password se ainda existir
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


-- ---- TABELA: companies -------------------------------------

CREATE TABLE IF NOT EXISTS companies (
    id               SERIAL    PRIMARY KEY,
    name             TEXT      NOT NULL,
    db_name          TEXT      NOT NULL UNIQUE,
    hours_configured BOOLEAN   NOT NULL DEFAULT false,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj         TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone        TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email        TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address      TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city         TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id      INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug         VARCHAR(180);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS whatsapp     VARCHAR(30);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url     TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description  TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active    BOOLEAN NOT NULL DEFAULT true;

-- FK companies.user_id -> users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'companies_user_id_fkey'
          AND table_name = 'companies'
    ) THEN
        ALTER TABLE companies
            ADD CONSTRAINT companies_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- FK users.company_id -> companies.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_company_id_fkey'
          AND table_name = 'users'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_company_id_fkey
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ---- TABELA: business_hours --------------------------------

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


-- ---- TABELA: clients ---------------------------------------

CREATE TABLE IF NOT EXISTS clients (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name   TEXT          NOT NULL,
    last_name    TEXT,
    phone        TEXT,
    email        TEXT,
    birthdate    DATE,
    notes        TEXT,
    tags         JSONB         NOT NULL DEFAULT '[]',
    anamnesis    JSONB         NOT NULL DEFAULT '{}',
    visit_count  INTEGER       NOT NULL DEFAULT 0,
    total_spent  DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_date TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_name   TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email       TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birthdate   DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes       TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags        JSONB NOT NULL DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS anamnesis   JSONB NOT NULL DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP NOT NULL DEFAULT NOW();


-- ---- TABELA: professionals ---------------------------------

CREATE TABLE IF NOT EXISTS professionals (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name               TEXT         NOT NULL,
    email              TEXT,
    phone              TEXT,
    color              TEXT         NOT NULL DEFAULT '#C9A861',
    commission_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    document           TEXT,
    document_type      TEXT         NOT NULL DEFAULT 'cpf',
    has_schedule       BOOLEAN      NOT NULL DEFAULT true,
    permissions        JSONB        NOT NULL DEFAULT '[]',
    specialties        JSONB        NOT NULL DEFAULT '[]',
    work_schedule      JSONB        NOT NULL DEFAULT '{}',
    active             BOOLEAN      NOT NULL DEFAULT true,
    photo_url          TEXT,
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

ALTER TABLE professionals ADD COLUMN IF NOT EXISTS email              TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS phone              TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS color              TEXT NOT NULL DEFAULT '#C9A861';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS commission_percent DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS document           TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS document_type      TEXT NOT NULL DEFAULT 'cpf';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS has_schedule       BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS permissions        JSONB NOT NULL DEFAULT '[]';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS specialties        JSONB NOT NULL DEFAULT '[]';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS work_schedule      JSONB NOT NULL DEFAULT '{}';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS active             BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS photo_url          TEXT;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMP NOT NULL DEFAULT NOW();


-- ---- TABELA: services --------------------------------------

CREATE TABLE IF NOT EXISTS services (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT          NOT NULL,
    category         TEXT,
    price            DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER,
    active           BOOLEAN       NOT NULL DEFAULT true,
    description      TEXT,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

ALTER TABLE services ADD COLUMN IF NOT EXISTS category         TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price            DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS active           BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS description      TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP NOT NULL DEFAULT NOW();


-- ---- TABELA: products --------------------------------------

CREATE TABLE IF NOT EXISTS products (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT          NOT NULL,
    category       TEXT,
    price          DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost           DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER       NOT NULL DEFAULT 0,
    min_stock      INTEGER       NOT NULL DEFAULT 1,
    unit           TEXT          NOT NULL DEFAULT 'un',
    active         BOOLEAN       NOT NULL DEFAULT true,
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS category       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost           DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock      INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit           TEXT NOT NULL DEFAULT 'un';
ALTER TABLE products ADD COLUMN IF NOT EXISTS active         BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMP NOT NULL DEFAULT NOW();


-- ---- TABELA: appointments ----------------------------------

CREATE TABLE IF NOT EXISTS appointments (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    date              DATE          NOT NULL,
    start_time        TEXT,
    end_time          TEXT,
    client_id         UUID,
    client_name       TEXT,
    professional_id   UUID,
    professional_name TEXT,
    services          JSONB         NOT NULL DEFAULT '[]',
    status            TEXT          NOT NULL DEFAULT 'scheduled',
    notes             TEXT,
    total_amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
    type              TEXT          NOT NULL DEFAULT 'appointment',
    customer_phone    TEXT,
    source            TEXT          NOT NULL DEFAULT 'internal',
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_name       TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS professional_name TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS services          JSONB NOT NULL DEFAULT '[]';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes             TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_amount      DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS type              TEXT NOT NULL DEFAULT 'appointment';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_phone    TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source            TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMP NOT NULL DEFAULT NOW();


-- Converte status de ENUM para TEXT (caso tenha sido criado como enum)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'appointments'
          AND column_name = 'status'
          AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE appointments ALTER COLUMN status TYPE TEXT;
    END IF;
END $$;

-- Corrige status invalidos
UPDATE appointments
SET status = 'scheduled'
WHERE status NOT IN ('scheduled','completed','cancelled','no-show','blocked');

-- ---- TABELA: transactions ----------------------------------

CREATE TABLE IF NOT EXISTS transactions (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    type              TEXT          NOT NULL DEFAULT 'income',
    expense_type      TEXT,
    amount            DECIMAL(10,2) NOT NULL DEFAULT 0,
    date              DATE          NOT NULL,
    description       TEXT,
    payment_method    TEXT          DEFAULT 'cash',
    appointment_id    UUID,
    client_id         UUID,
    client_name       TEXT,
    professional_id   UUID,
    professional_name TEXT,
    services          JSONB         NOT NULL DEFAULT '[]',
    category          TEXT,
    paid              BOOLEAN       NOT NULL DEFAULT true,
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS expense_type      TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method    TEXT DEFAULT 'cash';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS appointment_id    UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_id         UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_name       TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS professional_id   UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS professional_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS services          JSONB NOT NULL DEFAULT '[]';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category          TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid              BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMP NOT NULL DEFAULT NOW();


-- ---- TABELA: message_templates ----------------------------

CREATE TABLE IF NOT EXISTS message_templates (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT      NOT NULL,
    type       TEXT      NOT NULL DEFAULT 'custom',
    content    TEXT      NOT NULL DEFAULT '',
    active     BOOLEAN   NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS type       TEXT NOT NULL DEFAULT 'custom';
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS active     BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();


-- ---- PREENCHE DADOS DERIVADOS ------------------------------

-- user_id nas empresas a partir de users.company_id
UPDATE companies c
SET user_id = u.id
FROM users u
WHERE u.company_id = c.id
  AND c.user_id IS NULL;

-- Remove qualquer restricao de unicidade do db_name
-- (single-DB: todas as empresas passam a usar 'mustech2')
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'companies_db_name_key'
          AND table_name = 'companies'
    ) THEN
        ALTER TABLE companies DROP CONSTRAINT companies_db_name_key;
    END IF;
END $$;

DROP INDEX IF EXISTS idx_companies_db_name;

-- Normaliza db_name para mustech2 (arquitetura single-DB)
UPDATE companies SET db_name = 'mustech2';

-- Gera slug para empresas sem slug
UPDATE companies SET slug = lower(name)                                   WHERE slug IS NULL;
UPDATE companies SET slug = regexp_replace(slug,'[áàãâä]','a','g')        WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug,'[éèêë]','e','g')         WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug,'[íìîï]','i','g')         WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug,'[óòõôö]','o','g')        WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug,'[úùûü]','u','g')         WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug,'[ç]','c','g')            WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug,'[^a-z0-9]+','-','g')     WHERE slug IS NOT NULL;
UPDATE companies SET slug = regexp_replace(slug,'^-|-$','','g')           WHERE slug IS NOT NULL;


-- ---- COLUNA company_id NAS TABELAS DE ENTIDADE -------------
-- Arquitetura single-DB: todas as entidades ficam em mustech2
-- isoladas pelo company_id. Idempotente.

ALTER TABLE clients           ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE professionals     ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE services          ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE products          ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE appointments      ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE transactions      ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;

-- Vincula registros existentes sem company_id a primeira empresa encontrada
-- (seguro para ambientes com empresa única)
UPDATE clients           SET company_id = (SELECT id FROM companies ORDER BY id LIMIT 1) WHERE company_id IS NULL;
UPDATE professionals     SET company_id = (SELECT id FROM companies ORDER BY id LIMIT 1) WHERE company_id IS NULL;
UPDATE services          SET company_id = (SELECT id FROM companies ORDER BY id LIMIT 1) WHERE company_id IS NULL;
UPDATE products          SET company_id = (SELECT id FROM companies ORDER BY id LIMIT 1) WHERE company_id IS NULL;
UPDATE appointments      SET company_id = (SELECT id FROM companies ORDER BY id LIMIT 1) WHERE company_id IS NULL;
UPDATE transactions      SET company_id = (SELECT id FROM companies ORDER BY id LIMIT 1) WHERE company_id IS NULL;
UPDATE message_templates SET company_id = (SELECT id FROM companies ORDER BY id LIMIT 1) WHERE company_id IS NULL;


-- ---- INDICES -----------------------------------------------

CREATE INDEX        IF NOT EXISTS idx_users_email              ON users(email);
CREATE INDEX        IF NOT EXISTS idx_users_company_id         ON users(company_id);
CREATE INDEX        IF NOT EXISTS idx_bh_company_id            ON business_hours(company_id);
CREATE INDEX        IF NOT EXISTS idx_companies_db_name        ON companies(db_name);
CREATE INDEX        IF NOT EXISTS idx_companies_user_id        ON companies(user_id);
CREATE INDEX        IF NOT EXISTS idx_companies_is_active      ON companies(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug           ON companies(slug);
CREATE INDEX        IF NOT EXISTS idx_clients_company          ON clients(company_id);
CREATE INDEX        IF NOT EXISTS idx_clients_phone            ON clients(phone);
CREATE INDEX        IF NOT EXISTS idx_professionals_company    ON professionals(company_id);
CREATE INDEX        IF NOT EXISTS idx_professionals_active     ON professionals(active);
CREATE INDEX        IF NOT EXISTS idx_services_company         ON services(company_id);
CREATE INDEX        IF NOT EXISTS idx_services_active          ON services(active);
CREATE INDEX        IF NOT EXISTS idx_products_company         ON products(company_id);
CREATE INDEX        IF NOT EXISTS idx_products_active          ON products(active);
CREATE INDEX        IF NOT EXISTS idx_appointments_company     ON appointments(company_id);
CREATE INDEX        IF NOT EXISTS idx_appointments_date        ON appointments(date);
CREATE INDEX        IF NOT EXISTS idx_appointments_status      ON appointments(status);
CREATE INDEX        IF NOT EXISTS idx_appointments_source      ON appointments(source);
CREATE INDEX        IF NOT EXISTS idx_transactions_company     ON transactions(company_id);
CREATE INDEX        IF NOT EXISTS idx_transactions_date        ON transactions(date);
CREATE INDEX        IF NOT EXISTS idx_transactions_type        ON transactions(type);
CREATE INDEX        IF NOT EXISTS idx_transactions_appt        ON transactions(appointment_id);
CREATE INDEX        IF NOT EXISTS idx_msgtpl_company           ON message_templates(company_id);


-- ---- VERIFICACAO FINAL -------------------------------------

SELECT 'EMPRESAS'        AS tabela, COUNT(*) AS registros FROM companies
UNION ALL
SELECT 'USUARIOS',       COUNT(*) FROM users
UNION ALL
SELECT 'HORARIOS',       COUNT(*) FROM business_hours
UNION ALL
SELECT 'CLIENTES',       COUNT(*) FROM clients
UNION ALL
SELECT 'PROFISSIONAIS',  COUNT(*) FROM professionals
UNION ALL
SELECT 'SERVICOS',       COUNT(*) FROM services
UNION ALL
SELECT 'PRODUTOS',       COUNT(*) FROM products
UNION ALL
SELECT 'AGENDAMENTOS',   COUNT(*) FROM appointments
UNION ALL
SELECT 'TRANSACOES',     COUNT(*) FROM transactions
UNION ALL
SELECT 'MSG_TEMPLATES',  COUNT(*) FROM message_templates
ORDER BY tabela;

SELECT id, name, slug, db_name, is_active, hours_configured,
       (SELECT COUNT(*) FROM clients      WHERE clients.company_id = companies.id)      AS clientes,
       (SELECT COUNT(*) FROM appointments WHERE appointments.company_id = companies.id) AS agendamentos
FROM companies
ORDER BY id;

-- ---- ADMIN GLOBAL ------------------------------------------
-- Adiciona campo role na tabela users (idempotente)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Corrige usuários criados antes desta migração (tinham role='admin' por padrão do código antigo)
-- Mantém apenas o usuário cujo e-mail você definir como admin global:
-- Edite o e-mail abaixo para o seu e-mail de admin antes de executar:
UPDATE users SET role = 'user' WHERE role = 'admin' OR role IS NULL;
UPDATE users SET role = 'admin' WHERE email = 'iurylima705@gmail.com';

-- Verifica resultado
SELECT id, name, email, role FROM users ORDER BY role DESC, created_at;
