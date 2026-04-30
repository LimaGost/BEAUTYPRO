-- =============================================================================
-- BeautyPro — Schema do banco EXCLUSIVO de cada empresa
--
-- Executado automaticamente ao registrar uma nova empresa (AuthController).
-- NÃO inclui users/companies/business_hours — essas ficam no banco global.
--
-- Rodado via:  $companyPdo->exec(file_get_contents($schemaFile));
-- Idempotente: usa CREATE TABLE IF NOT EXISTS e ADD COLUMN IF NOT EXISTS.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Clientes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name   TEXT         NOT NULL,
    last_name    TEXT,
    phone        TEXT,
    email        TEXT,
    birthdate    DATE,
    notes        TEXT,
    tags         JSONB        NOT NULL DEFAULT '[]',
    anamnesis    JSONB        NOT NULL DEFAULT '{}',
    visit_count  INTEGER      NOT NULL DEFAULT 0,
    total_spent  DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_date TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Profissionais
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- Serviços
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- Produtos
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- Agendamentos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    date              DATE          NOT NULL,
    start_time        TEXT,
    end_time          TEXT,
    client_id         UUID          REFERENCES clients(id)       ON DELETE SET NULL,
    client_name       TEXT,
    professional_id   UUID          REFERENCES professionals(id) ON DELETE SET NULL,
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

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'internal';

-- -----------------------------------------------------------------------------
-- Transações (receitas e despesas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    type              TEXT          NOT NULL CHECK (type IN ('income', 'expense')),
    expense_type      TEXT,
    amount            DECIMAL(10,2) NOT NULL DEFAULT 0,
    date              DATE          NOT NULL,
    description       TEXT,
    payment_method    TEXT,
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

-- -----------------------------------------------------------------------------
-- Templates de mensagem WhatsApp
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS message_templates (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT      NOT NULL,
    type       TEXT      NOT NULL DEFAULT 'custom',
    content    TEXT      NOT NULL,
    active     BOOLEAN   NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_appointments_date         ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client       ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status       ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date         ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type         ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_clients_phone             ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_total_spent       ON clients(total_spent DESC);
CREATE INDEX IF NOT EXISTS idx_professionals_active      ON professionals(active);
CREATE INDEX IF NOT EXISTS idx_services_active           ON services(active);
CREATE INDEX IF NOT EXISTS idx_products_active           ON products(active);
