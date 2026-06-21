-- ============================================================
-- Notificación LIKE_RECEIVED al autor del concierto
-- ============================================================

-- Actualizar la función del trigger para que también envíe la notificación
CREATE OR REPLACE FUNCTION public.recalculate_author_prestige()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_author UUID;
  v_concert_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT created_by, name INTO v_author, v_concert_name
      FROM public.concerts WHERE id = NEW.concert_id;
  ELSE
    SELECT created_by, name INTO v_author, v_concert_name
      FROM public.concerts WHERE id = OLD.concert_id;
  END IF;

  IF v_author IS NULL THEN RETURN NULL; END IF;

  -- Recalcular prestigio
  UPDATE public.profiles
    SET prestige = public.calculate_prestige(v_author)
  WHERE id = v_author;

  -- Notificación LIKE_RECEIVED (solo en INSERT y solo si no es el propio autor)
  IF TG_OP = 'INSERT' AND NEW.user_id <> v_author THEN
    INSERT INTO public.notifications (user_id, type, message, payload)
    VALUES (
      v_author,
      'LIKE_RECEIVED',
      'Alguien le ha dado like a tu concierto "' || v_concert_name || '".',
      jsonb_build_object('concert_id', NEW.concert_id, 'liker_id', NEW.user_id)
    );
  END IF;

  -- Comprobar si el nuevo prestigio activa una promoción
  PERFORM public.check_promotion(v_author);

  RETURN NULL;
END;
$$;
