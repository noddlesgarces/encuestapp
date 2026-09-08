-- ============================================================
-- ESQUEMA COMPLETO — encuestas, preguntas y respuestas
-- ============================================================
-- Corre este archivo completo en Supabase → SQL Editor.
-- Si ya tenías la tabla vieja de "respuestas" (q1..q6), bórrala antes:
--   drop table if exists respuestas;

create extension if not exists pgcrypto;

-- ENCUESTAS: cada una con su propio título y set de preguntas
create table encuestas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  creado_en timestamptz not null default now()
);

-- PREGUNTAS: pertenecen a una encuesta, agrupadas por categoría
create table preguntas (
  id uuid primary key default gen_random_uuid(),
  encuesta_id uuid not null references encuestas(id) on delete cascade,
  categoria text not null default 'General',
  texto text not null,
  opciones jsonb not null default '[]'::jsonb,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

-- RESPUESTAS: una fila por persona que completa una encuesta
create table respuestas (
  id uuid primary key default gen_random_uuid(),
  encuesta_id uuid not null references encuestas(id) on delete cascade,
  respuestas jsonb not null,
  creado_en timestamptz not null default now()
);

alter table encuestas enable row level security;
alter table preguntas enable row level security;
alter table respuestas enable row level security;

-- ------------------------------------------------------------
-- Acceso público (anon): solo lo necesario para responder
-- ------------------------------------------------------------
create policy "anon lee encuestas" on encuestas
  for select to anon using (true);

create policy "anon lee preguntas" on preguntas
  for select to anon using (true);

create policy "anon inserta respuestas" on respuestas
  for insert to anon with check (true);

-- ------------------------------------------------------------
-- Acceso admin (authenticated, vía magic link): todo
-- ------------------------------------------------------------
create policy "admin lee encuestas" on encuestas
  for select to authenticated using (true);
create policy "admin crea encuestas" on encuestas
  for insert to authenticated with check (true);
create policy "admin edita encuestas" on encuestas
  for update to authenticated using (true);
create policy "admin borra encuestas" on encuestas
  for delete to authenticated using (true);

create policy "admin lee preguntas" on preguntas
  for select to authenticated using (true);
create policy "admin crea preguntas" on preguntas
  for insert to authenticated with check (true);
create policy "admin edita preguntas" on preguntas
  for update to authenticated using (true);
create policy "admin borra preguntas" on preguntas
  for delete to authenticated using (true);

create policy "admin lee respuestas" on respuestas
  for select to authenticated using (true);
