-- ============================================================
-- 0002_concerts.sql
-- Tabla de conciertos, bucket de imágenes, índices y políticas RLS.
-- ============================================================

-- ── Tabla concerts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.concerts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  description   TEXT        NOT NULL DEFAULT '',
  date_time     TIMESTAMPTZ NOT NULL,
  venue_name    TEXT        NOT NULL,
  venue_address TEXT        NOT NULL DEFAULT '',
  image_url     TEXT,
  ticket_url    TEXT,
  price         NUMERIC(10, 2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concerts_date_time  ON public.concerts (date_time);
CREATE INDEX IF NOT EXISTS idx_concerts_created_by ON public.concerts (created_by);

ALTER TABLE public.concerts ENABLE ROW LEVEL SECURITY;

-- ── Trigger updated_at ───────────────────────────────────────
DROP TRIGGER IF EXISTS trg_concerts_updated_at ON public.concerts;
CREATE TRIGGER trg_concerts_updated_at
  BEFORE UPDATE ON public.concerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Función auxiliar ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.concert_is_past(concert public.concerts)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT concert.date_time < NOW();
$$;

-- ── Políticas RLS ─────────────────────────────────────────────

-- Cualquiera puede leer cualquier concierto
CREATE POLICY select_all ON public.concerts
  FOR SELECT USING (TRUE);

-- Solo usuarios autenticados pueden insertar conciertos propios
CREATE POLICY insert_authenticated ON public.concerts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Solo el creador puede modificar su concierto
CREATE POLICY update_own ON public.concerts
  FOR UPDATE USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Solo el creador puede eliminar su concierto
CREATE POLICY delete_own ON public.concerts
  FOR DELETE USING (auth.uid() = created_by);

-- ── Grants ───────────────────────────────────────────────────
GRANT SELECT ON public.concerts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.concerts TO authenticated;

-- ── Bucket de imágenes (Storage) ─────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'concert-images',
  'concert-images',
  TRUE,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "concert-images lectura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'concert-images');

CREATE POLICY "concert-images subida autenticada"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'concert-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "concert-images eliminar propio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'concert-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
