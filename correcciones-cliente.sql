-- ============================================================
-- CORRECCIONES DEL CLIENTE (ANOVA) — 8 sept 2026
-- ============================================================
-- Corre esto en Supabase → SQL Editor. Actualiza la encuesta y
-- preguntas ya creadas (no inserta filas nuevas).

update encuestas set
  titulo = 'ENCUESTA DE CARACTERIZACIÓN Y EXPERIENCIA USUARIA',
  descripcion = 'POBLACIÓN AFRODESCENDIENTE EN LA
RED ASISTENCIAL PÚBLICA DE LA REGIÓN DE LOS RÍOS',
  texto_consentimiento = 'Usted está siendo invitado(a) a participar en una encuesta cuyo objetivo es conocer las características, experiencias y opiniones de personas afrodescendientes respecto de la atención recibida en establecimientos de salud de la Región de Los Ríos.

Su participación es voluntaria y la encuesta tiene una duración aproximada de 10 minutos. La información proporcionada será utilizada exclusivamente con fines de investigación y análisis.

Las respuestas serán analizadas de manera general y agregada. En ningún caso los resultados permitirán identificarla(o) individualmente ni asociar sus respuestas con su identidad. La información será tratada de manera confidencial.

Puede decidir no participar, no responder alguna pregunta o finalizar la encuesta en cualquier momento, sin ninguna consecuencia para usted.',
  logo_url = null
where id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5';

update preguntas set texto = 'P1. ¿Se considera usted afrodescendiente?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Se considera usted afrodescendiente?';

update preguntas set texto = 'P2. Para clasificar sus respuestas con las de otras personas, indíquenos su género.'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = 'Para clasificar sus respuestas con las de otras personas, indíquenos su género.';

update preguntas set texto = 'P3. ¿Cuál es su fecha de nacimiento?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Cuál es su fecha de nacimiento?';

update preguntas set texto = 'P4. ¿Cuál es su región de residencia?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Cuál es su región de residencia?';

update preguntas set texto = 'P5. ¿Cuál es su comuna de residencia?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Cuál es su comuna de residencia?';

update preguntas set texto = 'P6. ¿Su nacionalidad es…?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Su nacionalidad es…?';

update preguntas set texto = 'P7. ¿Cuál es el nivel educacional más alto que ha completado?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Cuál es el nivel educacional más alto que ha completado?';

update preguntas set texto = 'P8. ¿Cuál es su actividad principal?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Cuál es su actividad principal?';

update preguntas set texto = 'P8.1. Si trabaja, ¿cuál es su rango de ingresos?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = 'Si trabaja, ¿cuál es su rango de ingresos?';

update preguntas set texto = 'P9. ¿Tiene hijos/as o personas a su cargo?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Tiene hijos/as o personas a su cargo?';

update preguntas set texto = 'P10. ¿Se atiende o ha recibido atención en algún centro de salud de la Región de Los Ríos?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Se atiende o ha recibido atención en algún centro de salud de la Región de Los Ríos?';

update preguntas set texto = 'P11. Generalmente, ¿a qué acude cuando se atiende en un centro de salud de la Región de Los Ríos?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = 'Generalmente, ¿a qué acude cuando se atiende en un centro de salud de la Región de Los Ríos?';

update preguntas set texto = 'P12. ¿Con qué frecuencia se atiende en centros de salud de la Región de Los Ríos?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Con qué frecuencia se atiende en centros de salud de la Región de Los Ríos?';

update preguntas set texto = 'P13. ¿En qué tipo de establecimiento de salud se atiende con mayor frecuencia?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿En qué tipo de establecimiento de salud se atiende con mayor frecuencia?';

update preguntas set texto = 'P15. Pensando en su experiencia más reciente, ¿qué tan satisfecho(a) quedó con la atención recibida?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = 'Pensando en su experiencia más reciente, ¿qué tan satisfecho(a) quedó con la atención recibida?';

update preguntas set texto = 'P18. Considerando todos los aspectos de la atención, ¿cómo evaluaría en general el servicio recibido en el centro de salud donde se atiende habitualmente?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = 'Considerando todos los aspectos de la atención, ¿cómo evaluaría en general el servicio recibido en el centro de salud donde se atiende habitualmente?';

update preguntas set texto = 'P19. Pensando en su experiencia de atención en salud, ¿alguna vez ha sentido que ha recibido un trato diferente, injusto o discriminatorio debido a su origen, color de piel, nacionalidad, cultura u otro?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = 'Pensando en su experiencia de atención en salud, ¿alguna vez ha sentido que ha recibido un trato diferente, injusto o discriminatorio debido a su origen, color de piel, nacionalidad, cultura u otro?';

update preguntas set texto = 'P19.1. ¿Cuál fue el motivo o la situación que generó este trato diferente, injusto o discriminatorio?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Cuál fue el motivo o la situación que generó este trato diferente, injusto o discriminatorio?';

update preguntas set texto = 'P20. ¿Hay algún aspecto de la atención en el centro de salud que considere que debería mejorar?'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5' and texto = '¿Hay algún aspecto de la atención en el centro de salud que considere que debería mejorar?';

update preguntas set
  opciones = '["Hospital público", "CESFAM", "CECOSF", "Posta o estación médico-rural", "Clínica o centro médico privado", "Otro", "No sabe / no recuerda"]'::jsonb
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5'
  and texto = 'P13. ¿En qué tipo de establecimiento de salud se atiende con mayor frecuencia?';

-- P14 usa el id real de P13 (que ya existe en tu base) para la cascada,
-- así que lo resolvemos con una subconsulta en vez de un id fijo:
update preguntas set
  texto = 'P14. ¿En cuál establecimiento de salud se atiende habitualmente?',
  otro_trigger = '["Otro hospital público", "Otro CESFAM", "Otro"]'::jsonb,
  opciones_por = jsonb_build_object(
    'pregunta_id', (select id from preguntas where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5'
                    and texto = 'P13. ¿En qué tipo de establecimiento de salud se atiende con mayor frecuencia?'),
    'mapa', '{"Hospital público": ["Hospital Base Valdivia", "Hospital Juan Morey de La Unión", "Hospital de Río Bueno", "Hospital de Paillaco", "Hospital de Los Lagos", "Hospital de Lanco", "Hospital de Corral", "Hospital Santa Elisa de Mariquina", "Hospital Padre Bernabé de Lucerna de Panguipulli", "Otro hospital público", "No sabe / no recuerda"], "CESFAM": ["CESFAM Externo de Valdivia", "CESFAM Angachilla", "CESFAM Dr. Jorge Sabat", "CESFAM Las Ánimas", "CESFAM Niebla", "CESFAM de Corral", "CESFAM de Lanco", "CESFAM Malalhue", "CESFAM de Los Lagos", "CESFAM de Máfil", "CESFAM de Mariquina", "CESFAM de Paillaco", "CESFAM de Panguipulli", "CESFAM de La Unión", "CESFAM de Río Bueno", "CESFAM de Futrono", "CESFAM de Lago Ranco", "Otro CESFAM", "No sabe / no recuerda"], "CECOSF": "__texto__", "Posta o estación médico-rural": "__texto__", "Clínica o centro médico privado": ["Clínica Alemana de Valdivia", "RedSalud Valdivia", "Otro", "No sabe / no recuerda"], "Otro": "__omitir__"}'::jsonb
  )
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5'
  and texto = '¿En cuál de los siguientes establecimientos de salud se atiende habitualmente?';

update preguntas set
  texto = 'P16. Considerando una escala del 1 al 5, donde 1 es muy insatisfecho y 5 es muy satisfecho, ¿qué tan satisfecho(a) está con los siguientes aspectos de la atención recibida?',
  opciones = '["Muy insatisfecho", "Insatisfecho", "Ni satisfecho ni insatisfecho", "Satisfecho", "Muy satisfecho"]'::jsonb
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5'
  and texto = 'Considerando una escala del 1 al 5, ¿qué tan satisfecho(a) está con los siguientes aspectos de la atención recibida?';

update preguntas set
  texto = 'P17. ¿Qué tan probable es que recomiende el centro de salud donde se atiende habitualmente a un familiar o amigo? Utilice una escala de 1 a 5, donde 1 significa "nada probable" y 5 "muy probable".'
where encuesta_id = '43eedf11-fa65-4f6b-8ceb-0138a24f7dd5'
  and texto = '¿Qué tan probable es que recomiende el centro de salud donde se atiende habitualmente a un familiar o amigo?';
