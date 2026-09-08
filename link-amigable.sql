-- ============================================================
-- LINK AMIGABLE — corre esto DESPUÉS de haber agregado la columna
-- "slug" (ya viene en la versión más reciente de
-- migracion-logica-condicional.sql — vuelve a correr ese archivo,
-- es seguro, usa "add column if not exists").
-- ============================================================

update encuestas set
  slug = 'anova'
where id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5';

-- Con esto y el código nuevo (vercel.json + app.js), el link queda:
-- https://encuestapp-two.vercel.app/anova
-- El link viejo con ?e=... sigue funcionando exactamente igual.
