-- ============================================================
-- Fase 5: Notificaciones in-app y sistema de promoción
-- ============================================================

-- Tabla de configuración del sistema (umbral de promoción, etc.)
CREATE TABLE IF NOT EXISTS public.system_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO public.system_config (key, value)
VALUES ('promotion_prestige_threshold', '100')
ON CONFLICT (key) DO NOTHING;

-- Tipos de notificación
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'PROMOTION_OFFER',
    'LIKE_RECEIVED',
    'CONCERT_UPDATED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       public.notification_type NOT NULL,
  message    TEXT        NOT NULL,
  payload    JSONB       NOT NULL DEFAULT '{}',
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario puede leer sus notificaciones
CREATE POLICY select_own ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Solo el propio usuario puede marcar como leída (UPDATE read_at)
CREATE POLICY update_own_read_state ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
-- service_role necesita ALL para crear notificaciones desde triggers/funciones y para tests de integración
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.promotion_logs TO service_role;
GRANT ALL ON public.system_config TO service_role;

-- Tabla de logs de promoción
CREATE TABLE IF NOT EXISTS public.promotion_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_role    TEXT        NOT NULL,
  to_role      TEXT        NOT NULL,
  promoted_at  TIMESTAMPTZ,
  rejected_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promotion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own ON public.promotion_logs
  FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON public.promotion_logs TO authenticated;

-- ============================================================
-- Función check_promotion: crea oferta de promoción si procede
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_promotion(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_threshold  INTEGER;
  v_prestige   INTEGER;
  v_role       TEXT;
  v_pending    INTEGER;
  v_last_reject TIMESTAMPTZ;
BEGIN
  -- Obtener umbral de la config
  SELECT value::INTEGER INTO v_threshold
  FROM public.system_config WHERE key = 'promotion_prestige_threshold';

  -- Obtener perfil del usuario
  SELECT prestige, role INTO v_prestige, v_role
  FROM public.profiles WHERE id = p_user_id;

  -- Solo aplica a usuarios con rol USER
  IF v_role <> 'USER' THEN RETURN; END IF;

  -- Si no supera el umbral, no hacer nada
  IF v_prestige < v_threshold THEN RETURN; END IF;

  -- Comprobar si ya hay una oferta pendiente sin responder
  SELECT COUNT(*) INTO v_pending
  FROM public.notifications
  WHERE user_id = p_user_id
    AND type = 'PROMOTION_OFFER'
    AND read_at IS NULL;
  IF v_pending > 0 THEN RETURN; END IF;

  -- Comprobar si fue rechazada hace menos de 30 días
  SELECT MAX(rejected_at) INTO v_last_reject
  FROM public.promotion_logs
  WHERE user_id = p_user_id AND rejected_at IS NOT NULL;
  IF v_last_reject IS NOT NULL AND v_last_reject > now() - INTERVAL '30 days' THEN RETURN; END IF;

  -- Crear notificación de oferta de promoción
  INSERT INTO public.notifications (user_id, type, message, payload)
  VALUES (
    p_user_id,
    'PROMOTION_OFFER',
    '¡Tu prestigio ha alcanzado el nivel colaborador! Puedes aceptar el rol de Colaborador.',
    jsonb_build_object('from_role', 'USER', 'to_role', 'COLLABORATOR', 'prestige', v_prestige)
  );

  -- Registrar la oferta en el log
  INSERT INTO public.promotion_logs (user_id, from_role, to_role)
  VALUES (p_user_id, 'USER', 'COLLABORATOR');
END;
$$;

-- Llamar a check_promotion cada vez que se recalcule el prestigio
CREATE OR REPLACE FUNCTION public.recalculate_author_prestige()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_author UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT created_by INTO v_author FROM public.concerts WHERE id = NEW.concert_id;
  ELSE
    SELECT created_by INTO v_author FROM public.concerts WHERE id = OLD.concert_id;
  END IF;

  IF v_author IS NOT NULL THEN
    UPDATE public.profiles
    SET prestige = public.calculate_prestige(v_author)
    WHERE id = v_author;

    -- Comprobar si el nuevo prestigio activa una promoción
    PERFORM public.check_promotion(v_author);
  END IF;
  RETURN NULL;
END;
$$;
