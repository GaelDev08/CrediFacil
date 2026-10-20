-- ====================================================================
-- CrediFacil - Esquema PostgreSQL para Supabase
-- Gestión de cotizaciones y simulaciones de crédito para entidades financieras
-- ====================================================================

-- 1. Tabla de Simulaciones Guardadas
create table if not exists public.credit_simulations (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    client_name text default 'Cliente General',
    client_doc text,
    principal numeric(14,2) not null,
    currency varchar(5) not null default 'USD',
    term integer not null,
    frequency varchar(20) not null default 'monthly',
    method varchar(30) not null default 'french',
    interest_rate numeric(8,4) not null,
    rate_type varchar(5) not null default 'TEA',
    tcea numeric(8,4) not null default 0,
    total_interest numeric(14,2) not null default 0,
    total_repayment numeric(14,2) not null default 0,
    loan_params jsonb not null default '{}'::jsonb,
    schedule_data jsonb not null default '[]'::jsonb,
    user_id uuid references auth.users(id) on delete set null
);

-- Índices de consulta rápida
create index if not exists idx_credit_simulations_created_at on public.credit_simulations(created_at desc);
create index if not exists idx_credit_simulations_currency on public.credit_simulations(currency);

-- 2. Habilitar Seguridad a Nivel de Filas (RLS)
alter table public.credit_simulations enable row level security;

-- Política de lectura pública (para compartir cotizaciones mediante enlace)
create policy "Simulaciones públicas legibles para cualquiera"
    on public.credit_simulations for select
    using (true);

-- Política de inserción (cualquiera puede generar y guardar una cotización)
create policy "Cualquiera puede guardar una simulación"
    on public.credit_simulations for insert
    with check (true);
