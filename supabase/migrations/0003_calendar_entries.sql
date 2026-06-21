-- ============================================================
-- 0003_calendar_entries.sql
-- Visibilidad de conciertos y calendario privado del usuario.
-- ============================================================

-- ── 1. Enum de visibilidad para conciertos ───────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'concert_visibility') THEN
    CREATE TYPE public.concert_visibility AS ENUM ('PUBLIC', 'PRIVATE');
  END IF;
END$$;

-- ── 2. Columna visibility en concerts ────────────────────────
ALTER TABLE public.concerts
  ADD COLUMN IF NOT EXISTS visibility public.concert_visibility NOT NULL DEFAULT 'PUBLIC';

-- ── 3. Actualizar política select_all de concerts ────────────
-- Ahora solo muestra conciertos públicos o los propios del usuario
DROP POLICY IF EXISTS select_all ON public.concerts;

-- Los conciertos privados solo los ve su creador
CREATE POLICY select_public_or_own ON public.concerts
  FOR SELECT USING (
    visibility = 'PUBLIC' OR auth.uid() = created_by
  );

-- ── 4. Tabla calendar_entries ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calendar_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  -- Entrada vinculada a un concierto existente (nullable = entrada personal)
  concert_id  UUID        REFERENCES public.concerts (id) ON DELETE SET NULL,
  -- Campos propios solo necesarios en entradas personales
  title       TEXT,
  description TEXT,
  date_time   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Entrada personal requiere título y fecha; entrada vinculada no
  CONSTRAINT personal_entry_requires_title_and_date
    CHECK (concert_id IS NOT NULL OR (title IS NOT NULL AND date_time IS NOT NULL))
);

-- Índice general y único para evitar guardar el mismo concierto dos veces
CREATE INDEX IF NOT EXISTS idx_calendar_entries_user_id
  ON public.calendar_entries (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_calendar_entry_user_concert
  ON public.calendar_entries (user_id, concert_id)
  WHERE concert_id IS NOT NULL;

-- ── 5. Trigger updated_at ────────────────────────────────────
DROP TRIGGER IF EXISTS trg_calendar_entries_updated_at ON public.calendar_entries;
CREATE TRIGGER trg_calendar_entries_updated_at
  BEFORE UPDATE ON public.calendar_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 6. RLS ───────────────────────────────────────────────────
ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;

-- Solo el dueño puede leer sus propias entradas
CREATE POLICY select_own ON public.calendar_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Solo el dueño puede insertar entradas con su propio user_id
CREATE POLICY insert_own ON public.calendar_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Solo el dueño puede actualizar
CREATE POLICY update_own ON public.calendar_entries
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Solo el dueño puede eliminar
CREATE POLICY delete_own ON public.calendar_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ── 7. Grants ─────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_entries TO authenticated;

-- ── 8. Función pública para contar cuántos usuarios guardaron un concierto ──
-- SECURITY DEFINER para saltarse el RLS y contar todas las entradas,
-- sin exponer datos personales (solo devuelve un entero).
CREATE OR REPLACE FUNCTION public.get_concert_saved_count(p_concert_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.calendar_entries
  WHERE concert_id = p_concert_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_concert_saved_count(UUID) TO anon, authenticated;
