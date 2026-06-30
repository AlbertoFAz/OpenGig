-- ============================================================
-- 0018: Notificaciones CONCERT_PUBLISHED
-- Avisa a artistas registrados y a la sala cuando son
-- vinculados a un concierto recién publicado o editado.
-- ============================================================

-- Añadir el nuevo valor al enum (idempotente desde PG 14)
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'CONCERT_PUBLISHED';

-- ── Trigger: notificar artista registrado al vincularlo ──────

CREATE OR REPLACE FUNCTION public.notify_concert_artist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator      UUID;
  v_concert_name TEXT;
  v_creator_name TEXT;
BEGIN
  -- Solo actúa para artistas registrados
  IF NEW.artist_profile_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT c.created_by, c.name, p.display_name
    INTO v_creator, v_concert_name, v_creator_name
  FROM public.concerts c
  JOIN public.profiles p ON p.id = c.created_by
  WHERE c.id = NEW.concert_id;

  -- No notificar si el artista es el propio creador del concierto
  IF NEW.artist_profile_id = v_creator THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (user_id, type, message, payload)
  VALUES (
    NEW.artist_profile_id,
    'CONCERT_PUBLISHED',
    v_creator_name || ' te ha mencionado como artista en "' || v_concert_name || '".',
    jsonb_build_object('concert_id', NEW.concert_id, 'creator_id', v_creator)
  );

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_concert_artist ON public.concert_artists;
CREATE TRIGGER trg_notify_concert_artist
  AFTER INSERT ON public.concert_artists
  FOR EACH ROW EXECUTE FUNCTION public.notify_concert_artist();

-- ── Trigger: notificar a la sala cuando se vincula ──────────

CREATE OR REPLACE FUNCTION public.notify_concert_venue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_name TEXT;
BEGIN
  -- Solo actúa cuando venue_id está presente y cambia (o es nuevo)
  IF NEW.venue_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'UPDATE' AND (OLD.venue_id IS NOT DISTINCT FROM NEW.venue_id) THEN
    RETURN NULL;
  END IF;

  -- No notificar si la sala es el propio creador
  IF NEW.venue_id = NEW.created_by THEN
    RETURN NULL;
  END IF;

  SELECT display_name INTO v_creator_name
  FROM public.profiles WHERE id = NEW.created_by;

  INSERT INTO public.notifications (user_id, type, message, payload)
  VALUES (
    NEW.venue_id,
    'CONCERT_PUBLISHED',
    v_creator_name || ' ha indicado tu sala en "' || NEW.name || '".',
    jsonb_build_object('concert_id', NEW.id, 'creator_id', NEW.created_by)
  );

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_concert_venue ON public.concerts;
CREATE TRIGGER trg_notify_concert_venue
  AFTER INSERT OR UPDATE OF venue_id ON public.concerts
  FOR EACH ROW EXECUTE FUNCTION public.notify_concert_venue();
