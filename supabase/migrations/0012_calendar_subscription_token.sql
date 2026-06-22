-- Añade token de suscripción a calendarios privados.
-- El token permite a Google Calendar / Apple Calendar acceder al .ics sin cookies de sesión.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS calendar_subscription_token uuid UNIQUE DEFAULT gen_random_uuid() NOT NULL;

-- Política RLS: el token es de solo lectura para el propio dueño del perfil.
-- La ruta API lo lee usando service_role, por lo que no necesita política SELECT adicional.
-- Regenerar token: el dueño puede hacer UPDATE de su propio perfil (política ya existente update_own).
