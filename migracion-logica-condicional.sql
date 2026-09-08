-- ============================================================
-- MIGRACIÓN — lógica condicional, tipos de pregunta y theming
-- ============================================================
-- Corre esto UNA VEZ en Supabase → SQL Editor, después del
-- supabase-setup.sql original. Es seguro correrlo sobre la base
-- que ya tienes: solo agrega columnas nuevas con default, no
-- borra nada de lo existente.

-- PREGUNTAS: tipo de pregunta y reglas de lógica
alter table preguntas
  add column if not exists tipo text not null default 'opcion_unica',
  add column if not exists otro_trigger text,
  add column if not exists mostrar_si jsonb,
  add column if not exists salta_a jsonb,
  add column if not exists opciones_por jsonb,
  add column if not exists matriz_filas jsonb,
  add column if not exists escala_min int,
  add column if not exists escala_max int,
  add column if not exists escala_min_label text,
  add column if not exists escala_max_label text,
  add column if not exists requerida boolean not null default true;

-- tipo esperado: 'opcion_unica' | 'multiple' | 'texto' | 'texto_largo'
--               | 'fecha' | 'escala' | 'matriz'

-- ENCUESTAS: identidad visual y flujo de entrada
alter table encuestas
  add column if not exists logo_url text,
  add column if not exists banner_url text,
  add column if not exists color_primario text,
  add column if not exists tema text not null default 'oscuro',
  add column if not exists mostrar_identificacion boolean not null default false,
  add column if not exists texto_consentimiento text;

-- tema esperado: 'oscuro' (default, el look original) | 'claro'

-- Nada más que correr. Las políticas de RLS ya existentes
-- (select público, insert/update/delete solo authenticated)
-- siguen aplicando igual a estas columnas nuevas.
