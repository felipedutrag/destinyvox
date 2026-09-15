-- ==============================================================================
-- DESTINYVOX: Schema do Banco de Dados Supabase (epxhppjhivpwljpjpznm)
-- Tabelas: profiles (Auth), numerology_maps (Cálculos & IA), payments (GGPIX)
-- ==============================================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PERFIS DE USUÁRIO (Vinculada ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    cpf TEXT,
    birth_date DATE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TABELA DE MAPAS NUMEROLÓGICOS (Cálculos & Interpretações)
CREATE TABLE IF NOT EXISTS public.numerology_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    birth_date DATE NOT NULL,
    
    -- Pilares Matemáticos Principais
    life_path INTEGER NOT NULL,          -- Caminho de Vida (Destino)
    expression INTEGER NOT NULL,         -- Expressão (Nome Completo)
    soul_urge INTEGER NOT NULL,          -- Motivação / Desejo da Alma (Vogais)
    personality INTEGER NOT NULL,        -- Personalidade Exterior (Consoantes)
    birthday INTEGER NOT NULL,           -- Dia do Aniversário (Dom Inato)
    maturity INTEGER NOT NULL,           -- Maturidade (Caminho + Expressão)
    personal_year INTEGER NOT NULL,      -- Ano Pessoal
    personal_month INTEGER,              -- Mês Pessoal
    personal_day INTEGER,                -- Dia Pessoal
    
    -- Metadados & Conteúdo Hermético
    archetype JSONB,                     -- Título, elemento, cor, palavras-chave
    dictum TEXT,                         -- Ditame da alma
    full_interpretation JSONB,           -- Interpretação profunda completa / Dossier IA
    pdf_url TEXT,                        -- Link do PDF gerado (Storage ou CDN)
    status TEXT NOT NULL DEFAULT 'completed', -- 'processing', 'completed', 'failed'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABELA DE PAGAMENTOS (GGPIX / PIX)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    map_id UUID REFERENCES public.numerology_maps(id) ON DELETE SET NULL,
    
    gateway TEXT NOT NULL DEFAULT 'ggpix', -- 'ggpix' | 'stripe'
    external_id TEXT UNIQUE NOT NULL,      -- ID rastreador interno (MAPA_...)
    transaction_id TEXT,                   -- ID retornado pela GGPIX
    
    payer_name TEXT NOT NULL,
    payer_email TEXT NOT NULL,
    payer_cpf TEXT,
    
    amount_cents INTEGER NOT NULL,         -- Ex: 1990 para R$ 19,90
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'EXPIRED', 'FAILED'
    
    pix_code TEXT,                         -- Código Copia e Cola
    pix_qr_code_base64 TEXT,
    
    paid_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_maps_user_id ON public.numerology_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_maps_customer_email ON public.numerology_maps(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON public.payments(external_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.numerology_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
CREATE POLICY "Service role full access on profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own maps" ON public.numerology_maps;
CREATE POLICY "Users can view own maps" ON public.numerology_maps FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on maps" ON public.numerology_maps;
CREATE POLICY "Service role full access on maps" ON public.numerology_maps FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on payments" ON public.payments;
CREATE POLICY "Service role full access on payments" ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger para criar perfil automaticamente no Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
