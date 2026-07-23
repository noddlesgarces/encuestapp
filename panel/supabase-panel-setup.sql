-- Permite que SOLO usuarios logueados (autenticados vía magic link)
-- puedan LEER las respuestas. El formulario público sigue sin poder leer nada,
-- solo insertar (eso ya estaba configurado en supabase-setup.sql).
create policy "permitir leer a usuarios autenticados"
on respuestas
for select
to authenticated
using (true);

-- ------------------------------------------------------------------
-- PASOS MANUALES QUE FALTAN (se hacen desde el dashboard, no por SQL):
--
-- 1. Ve a Authentication → Sign In / Providers → Email
--    y desactiva "Allow new users to sign up".
--    Esto evita que cualquier persona con solo escribir su correo
--    pueda crearse una cuenta y entrar al panel.
--
-- 2. Ve a Authentication → Users → "Add user" → "Invite user"
--    y agrega ahí el email de tu cliente (ej: jrgvegal@gmail.com).
--    Solo los emails que invites ahí van a poder pedir el magic link
--    y entrar al panel.
--
-- 3. Ve a Authentication → URL Configuration → "Redirect URLs"
--    y agrega la URL de tu panel una vez deployado, por ejemplo:
--    https://encuestapp-two.vercel.app/panel/
-- ------------------------------------------------------------------
