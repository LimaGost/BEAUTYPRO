-- =============================================================================
-- BeautyPro — PARTE 2: BANCO DE CADA EMPRESA (bp_*)
-- =============================================================================
-- Execute ESTE arquivo conectado ao banco de cada empresa.
--
-- Como descobrir o nome do banco de cada empresa:
--   → Rode a PARTE 1 primeiro. Ao final aparece a lista "BANCOS DE EMPRESA".
--   → Os nomes serão algo como: bp_1, bp_2, bp_3 ...
--
-- No DBeaver, para cada banco de empresa:
--   1. Painel esquerdo → clique com botão direito no banco (ex: bp_1) → "SQL Editor"
--   2. Cole todo este script
--   3. Ctrl+A para selecionar tudo → Ctrl+Enter para executar
--   4. Repita para cada banco de empresa listado
--
-- Este script é 100% idempotente.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- EXTENSÕES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- TABELA: clients (clientes)
-- =============================================================================

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

-- Colunas que podem estar faltando em versões antigas
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_name    TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email        TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birthdate    DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes        TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags         JSONB NOT NULL DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS anamnesis    JSONB NOT NULL DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS visit_count  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_spent  DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP NOT NULL DEFAULT NOW();


-- =============================================================================
-- TABELA: professionals (profissionais)
-- =============================================================================

CREATE TABLE IF NOT EXISTS professionals (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name               TEXT          NOT NULL,
    email              TEXT,
    phone              TEXT,
    color              TEXT          NOT NULL DEFAULT '#C9A861',
    commission_percent DECIMAL(5,2)  NOT NULL DEFAULT 0,
    document           TEXT,
    document_type      TEXT          NOT NULL DEFAULT 'cpf',
    has_schedule       BOOLEAN       NOT NULL DEFAULT true,
    permissions        JSONB         NOT NULL DEFAULT '[]',
    specialties        JSONB         NOT NULL DEFAULT '[]',
    work_schedule      JSONB         NOT NULL DEFAULT '{}',
    active             BOOLEAN       NOT NULL DEFAULT true,
    created_at         TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP     NOT NULL DEFAULT NOW()
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
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMP NOT NULL DEFAULT NOW();


-- =============================================================================
-- TABELA: services (serviços)
-- =============================================================================

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


-- =============================================================================
-- TABELA: products (produtos)
-- =============================================================================

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


-- =============================================================================
-- TABELA: appointments (agendamentos)
-- =============================================================================

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

-- Colunas críticas que podem faltar em bancos criados antes das atualizações
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_name       TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS professional_name TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS services          JSONB NOT NULL DEFAULT '[]';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes             TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_amount      DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS type              TEXT NOT NULL DEFAULT 'appointment';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_phone    TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source            TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMP NOT NULL DEFAULT NOW();

-- Garante FK (pode não existir em bancos antigos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'appointments_client_id_fkey'
          AND table_name = 'appointments'
    ) THEN
        BEGIN
            ALTER TABLE appointments
                ADD CONSTRAINT appointments_client_id_fkey
                FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'appointments_professional_id_fkey'
          AND table_name = 'appointments'
    ) THEN
        BEGIN
            ALTER TABLE appointments
                ADD CONSTRAINT appointments_professional_id_fkey
                FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
END $$;

-- Valida os status existentes (garante consistência)
UPDATE appointments SET status = 'scheduled'
WHERE status NOT IN ('scheduled', 'completed', 'cancelled', 'no-show', 'blocked');


-- =============================================================================
-- TABELA: transactions (financeiro — receitas e despesas)
-- =============================================================================

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

-- Garante o CHECK constraint de type de forma segura
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'transactions_type_check'
          AND table_name = 'transactions'
    ) THEN
        BEGIN
            ALTER TABLE transactions
                ADD CONSTRAINT transactions_type_check
                CHECK (type IN ('income', 'expense'));
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
END $$;

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


-- =============================================================================
-- TABELA: message_templates (templates de mensagem)
-- =============================================================================

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


-- =============================================================================
-- ÍNDICES (melhoram a performance das consultas)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_appointments_date         ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client       ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status       ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_source       ON appointments(source);
CREATE INDEX IF NOT EXISTS idx_transactions_date         ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type         ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_appt         ON transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone             ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_total_spent       ON clients(total_spent DESC);
CREATE INDEX IF NOT EXISTS idx_professionals_active      ON professionals(active);
CREATE INDEX IF NOT EXISTS idx_services_active           ON services(active);
CREATE INDEX IF NOT EXISTS idx_products_active           ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_stock            ON products(stock_quantity);


-- =============================================================================
-- VERIFICAÇÃO FINAL — mostra o estado atual deste banco de empresa
-- =============================================================================

SELECT '════════════════════════════════════' AS "";
SELECT 'VERIFICAÇÃO — BANCO DE EMPRESA'      AS "";
SELECT '════════════════════════════════════' AS "";

SELECT 'clients'           AS "Tabela", COUNT(*) AS "Registros" FROM clients
UNION ALL
SELECT 'professionals',                  COUNT(*) FROM professionals
UNION ALL
SELECT 'services',                       COUNT(*) FROM services
UNION ALL
SELECT 'products',                       COUNT(*) FROM products
UNION ALL
SELECT 'appointments',                   COUNT(*) FROM appointments
UNION ALL
SELECT 'transactions',                   COUNT(*) FROM transactions
UNION ALL
SELECT 'message_templates',              COUNT(*) FROM message_templates
ORDER BY 1;

SELECT '════════════════════════════════════'                                AS "";
SELECT 'COLUNAS DE appointments'                                             AS "";
SELECT '════════════════════════════════════'                                AS "";
SELECT column_name AS "Coluna", data_type AS "Tipo", column_default AS "Default"
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

SELECT '════════════════════════════════════'                                AS "";
SELECT 'COLUNAS DE transactions'                                             AS "";
SELECT '════════════════════════════════════'                                AS "";
SELECT column_name AS "Coluna", data_type AS "Tipo", column_default AS "Default"
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

SELECT '════════════════════════════════════'            AS "";
SELECT 'ÚLTIMOS 5 AGENDAMENTOS'                         AS "";
SELECT '════════════════════════════════════'            AS "";
SELECT id, date, start_time, status, source, client_name, total_amount
FROM appointments
ORDER BY created_at DESC
LIMIT 5;

SELECT '════════════════════════════════════'            AS "";
SELECT 'ÚLTIMAS 5 TRANSAÇÕES FINANCEIRAS'               AS "";
SELECT '════════════════════════════════════'            AS "";
SELECT id, type, amount, date, description, paid
FROM transactions
ORDER BY created_at DESC
LIMIT 5;
