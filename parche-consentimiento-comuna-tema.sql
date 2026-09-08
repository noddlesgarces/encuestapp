-- ============================================================
-- PARCHE — corrige la encuesta ANOVA ya creada
-- ============================================================
-- Corre esto DESPUÉS de migracion-logica-condicional.sql (esa
-- agrega la columna "tema" que este parche usa).
-- No inserta preguntas nuevas: solo ajusta la encuesta que ya
-- sembraste con seed-encuesta-anova.sql.

-- 1) Tema claro + banner/logo (por si no quedaron aplicados)
update encuestas set
  tema = 'claro',
  color_primario = '#2E5FD9',
  logo_url = 'assets/logo-anova.png',
  banner_url = 'assets/banner-anova.png'
where id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5';

-- 2) Si responde que NO es afrodescendiente (o no sabe / prefiere no
--    responder), la encuesta termina ahí mismo — no sigue respondiendo.
update preguntas set
  salta_a = '{"valores": ["No", "No sabe / no está seguro(a)", "Prefiere no responder"], "destino_categoria": "FIN"}'::jsonb
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5'
  and texto = '¿Se considera usted afrodescendiente?';

-- 3) Comuna de residencia: pasa de radio a lista desplegable
--    (las listas de comunas son largas — hasta 32 opciones)
update preguntas set
  tipo = 'seleccion'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5'
  and texto = '¿Cuál es su comuna de residencia?';

-- 4) Mismo criterio para el establecimiento específico (hospital/CESFAM
--    puede tener hasta 19 opciones)
update preguntas set
  tipo = 'seleccion'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5'
  and texto = '¿En cuál de los siguientes establecimientos de salud se atiende habitualmente?';
