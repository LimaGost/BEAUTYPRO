-- =============================================================================
-- BeautyPro — Criar superadmin no banco GLOBAL (mustech2)
--
-- Execute no banco mustech2:
--   psql -h pgsql.mustech.com.br -U mustech2 -d mustech2 -f create_superadmin.sql
--
-- Troque os valores abaixo antes de rodar.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_name  TEXT := 'Iury Lima';               -- << TROQUE se quiser
    v_email TEXT := 'iurylima705@gmail.com';   -- << TROQUE se quiser
    v_senha TEXT := 'SuaSenhaForte123!';       -- << TROQUE (obrigatório)
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
        RAISE NOTICE 'Superadmin % atualizado.', v_email;
    ELSE
        INSERT INTO users (name, email, password, role)
        VALUES (v_name, lower(v_email), v_hash, 'superadmin');
        RAISE NOTICE 'Superadmin % criado com sucesso.', v_email;
    END IF;
END $$;

-- Confirma
SELECT id, name, email, role, created_at FROM users WHERE role = 'superadmin';
