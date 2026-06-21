-- ============================================================
-- 0006_concert_artists.sql
-- Tabla N:M entre conciertos y artistas registrados.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.concert_artists (
  concert_id        UUID NOT NULL REFERENCES public.concerts(id)  ON DELETE CASCADE,
  artist_profile_id UUID NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  PRIMARY KEY (concert_id, artist_profile_id)
);

ALTER TABLE public.concert_artists ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver qué artistas participan en un concierto
CREATE POLICY select_all ON public.concert_artists
  FOR SELECT USING (TRUE);

-- Solo el creador del concierto puede añadir artistas
CREATE POLICY insert_concert_owner ON public.concert_artists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.concerts
      WHERE id = concert_id AND created_by = auth.uid()
    )
  );

-- Solo el creador del concierto puede eliminar artistas
CREATE POLICY delete_concert_owner ON public.concert_artists
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.concerts
      WHERE id = concert_id AND created_by = auth.uid()
    )
  );

GRANT SELECT ON public.concert_artists TO anon, authenticated;
GRANT INSERT, DELETE ON public.concert_artists TO authenticated;
