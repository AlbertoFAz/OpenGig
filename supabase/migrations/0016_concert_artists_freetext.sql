-- ============================================================
-- 0016_concert_artists_freetext.sql
-- Permite asociar artistas no registrados (texto libre) a un
-- concierto. artist_profile_id pasa a ser nullable; artist_name
-- recoge el nombre cuando el artista no tiene perfil en la app.
-- ============================================================

-- 1. Columna surrogate para la nueva PK
ALTER TABLE public.concert_artists
  ADD COLUMN IF NOT EXISTS row_id UUID DEFAULT gen_random_uuid() NOT NULL;

-- 2. Eliminar la PK compuesta original
ALTER TABLE public.concert_artists
  DROP CONSTRAINT IF EXISTS concert_artists_pkey;

-- 3. Hacer artist_profile_id nullable
ALTER TABLE public.concert_artists
  ALTER COLUMN artist_profile_id DROP NOT NULL;

-- 4. Columna de texto libre para artistas sin perfil
ALTER TABLE public.concert_artists
  ADD COLUMN IF NOT EXISTS artist_name TEXT;

-- 5. Nueva PK
ALTER TABLE public.concert_artists ADD PRIMARY KEY (row_id);

-- 6. Índice único para evitar duplicados de artista registrado por concierto
CREATE UNIQUE INDEX IF NOT EXISTS concert_artists_registered_unique
  ON public.concert_artists (concert_id, artist_profile_id)
  WHERE artist_profile_id IS NOT NULL;

-- 7. Índice único para evitar duplicados de nombre libre por concierto
CREATE UNIQUE INDEX IF NOT EXISTS concert_artists_free_unique
  ON public.concert_artists (concert_id, lower(artist_name))
  WHERE artist_name IS NOT NULL;

-- 8. Al menos uno de los dos campos debe estar presente
ALTER TABLE public.concert_artists
  ADD CONSTRAINT concert_artists_identity_check CHECK (
    artist_profile_id IS NOT NULL
    OR (artist_name IS NOT NULL AND trim(artist_name) <> '')
  );
