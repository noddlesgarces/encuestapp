-- Tabla donde caen las respuestas de la encuesta
create table respuestas (
  id uuid primary key,
  respuestas jsonb not null,
  creado_en timestamptz not null default now()
);

-- Activa seguridad a nivel de fila (obligatorio en Supabase)
alter table respuestas enable row level security;

-- Permite que cualquiera pueda INSERTAR (mandar respuestas),
-- pero NO leer, editar ni borrar. Eso lo ves tú solo desde el dashboard.
create policy "permitir insertar respuestas"
on respuestas
for insert
to anon
with check (true);
