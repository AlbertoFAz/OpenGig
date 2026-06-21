-- ============================================================
-- Fase 5: Likes, prestigio y ranking
-- ============================================================

-- Tabla de likes (un like por usuario por concierto)
CREATE TABLE IF NOT EXISTS public.likes (
  user_id    UUID NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  concert_id UUID NOT NULL REFERENCES public.concerts(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, concert_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer likes (para mostrar contadores)
CREATE POLICY select_all ON public.likes
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Solo el propio usuario puede insertar su like
CREATE POLICY insert_own ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Solo el dueño del like puede eliminarlo
CREATE POLICY delete_own ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT ON public.likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.likes TO authenticated;

-- Columna likes_count en concerts, mantenida por triggers
ALTER TABLE public.concerts
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- Función que incrementa/decrementa likes_count
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.concerts SET likes_count = likes_count + 1 WHERE id = NEW.concert_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.concerts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.concert_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_likes_count ON public.likes;
CREATE TRIGGER trg_update_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();

-- ============================================================
-- Función de cálculo de prestigio con decaimiento exponencial
-- ============================================================
-- Cada like vale exp(-months_old / 6), donde months_old es el
-- número de meses desde que se dio el like.
CREATE OR REPLACE FUNCTION public.calculate_prestige(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prestige NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(
    EXP(-EXTRACT(EPOCH FROM (now() - l.created_at)) / (6.0 * 30 * 24 * 3600))
  ), 0)
  INTO v_prestige
  FROM public.likes l
  JOIN public.concerts c ON c.id = l.concert_id
  WHERE c.created_by = p_user_id;

  RETURN ROUND(v_prestige)::INTEGER;
END;
$$;

-- Trigger que recalcula el prestigio del autor tras cada like
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
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_prestige ON public.likes;
CREATE TRIGGER trg_recalculate_prestige
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_author_prestige();

-- Función utilitaria para recalcular el prestigio de todos los usuarios
CREATE OR REPLACE FUNCTION public.refresh_all_prestige()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles p
  SET prestige = public.calculate_prestige(p.id);
END;
$$;
