-- ============================================================
-- SCHEMA COMPLETO — Assistente Pessoal
-- Cole e execute no Supabase SQL Editor:
-- https://supabase.com/dashboard → seu projeto → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────
-- 1. EVENTS (Calendário)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  start_date  TIMESTAMPTZ NOT NULL,
  end_date    TIMESTAMPTZ,
  color       TEXT,
  category    TEXT,
  repeat      TEXT DEFAULT 'none',
  google_event_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- 2. BANKS (Contas bancárias)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banks (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  icon       TEXT DEFAULT '🏦',
  balance    NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- 3. CREDIT_CARDS (Cartões de crédito)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  bank_id     BIGINT REFERENCES public.banks(id) ON DELETE SET NULL,
  "limit"     NUMERIC(12, 2) DEFAULT 0,
  closing_day INTEGER,
  due_day     INTEGER,
  color       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- 4. CARD_INVOICES (Faturas dos cartões)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.card_invoices (
  id         BIGSERIAL PRIMARY KEY,
  card_id    BIGINT REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  amount     NUMERIC(12, 2) DEFAULT 0,
  status     TEXT DEFAULT 'open',
  month      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- 5. TRANSACTIONS (Transações financeiras)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id          BIGSERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category    TEXT,
  bank_id     BIGINT REFERENCES public.banks(id) ON DELETE SET NULL,
  card_id     BIGINT REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- 6. TASKS (Tarefas)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- 7. PASSWORDS (Senhas)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.passwords (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  username   TEXT,
  password   TEXT,
  url        TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Para app pessoal sem autenticação multi-usuário,
-- liberamos acesso total via anon key.
-- ============================================================

ALTER TABLE public.events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_invoices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passwords      ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (acesso total via anon key)
DO $$
DECLARE
  tbls TEXT[] := ARRAY['events','banks','credit_cards','card_invoices','transactions','tasks','passwords'];
  tbl  TEXT;
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "allow_all" ON public.%I;
      CREATE POLICY "allow_all" ON public.%I
        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    ', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================
-- EXPOR SCHEMA PARA POSTGREST (recarrega o cache)
-- ============================================================
NOTIFY pgrst, 'reload schema';
