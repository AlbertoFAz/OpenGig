-- ============================================================
-- 0005_roles_and_profiles.sql
-- Columnas de perfil por rol, trigger actualizado, RLS de
-- concerts por rol, venue_id en concerts y bucket de imágenes.
-- Los nuevos valores del enum ya están disponibles porque
-- 0004_extend_enum.sql se ejecutó en su propia transacción.
-- ============================================================

-- ── 1. Nuevas columnas en profiles ──────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS biography          TEXT,
  ADD COLUMN IF NOT EXISTS image_url          TEXT,
  ADD COLUMN IF NOT EXISTS social_links       JSONB    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS venue_address      TEXT,
  ADD COLUMN IF NOT EXISTS venue_capacity     INTEGER,
  ADD COLUMN IF NOT EXISTS collaborator_scope TEXT;

-- ── 2. Trigger actualizado: acepta rol desde metadata ────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username  TEXT;
  final_username TEXT;
  counter        INTEGER := 0;
  desired_role   public.user_role;
BEGIN
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');
  IF base_username = '' THEN base_username := 'user'; END IF;

  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  -- Leer rol del metadata; si es inválido o ausente, asignar USER
  BEGIN
    desired_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    desired_role := 'USER';
  END;
  IF desired_role IS NULL THEN desired_role := 'USER'; END IF;

  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', final_username),
    desired_role
  );
  RETURN NEW;
END;
$$;

-- ── 3. venue_id en concerts (FK opcional a sala registrada) ──
-- venue_name y venue_address se mantienen como texto libre fallback.
ALTER TABLE public.concerts
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 4. Actualizar RLS de concerts para restricción por rol ───
-- Solo ARTIST/VENUE/COLLABORATOR pueden publicar conciertos
-- públicos. Un USER solo puede crear conciertos PRIVADOS.
DROP POLICY IF EXISTS insert_authenticated ON public.concerts;
CREATE POLICY insert_authenticated ON public.concerts
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND (
      visibility = 'PRIVATE'
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ARTIST', 'VENUE', 'COLLABORATOR')
      )
    )
  );

-- ── 5. Bucket de imágenes de perfil ─────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "profile-images select" ON storage.objects;
CREATE POLICY "profile-images select" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile-images insert" ON storage.objects;
CREATE POLICY "profile-images insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images'
    AND auth.uid()::TEXT = (SPLIT_PART(name, '/', 1))
  );

DROP POLICY IF EXISTS "profile-images update" ON storage.objects;
CREATE POLICY "profile-images update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images'
    AND auth.uid()::TEXT = (SPLIT_PART(name, '/', 1))
  );

DROP POLICY IF EXISTS "profile-images delete" ON storage.objects;
CREATE POLICY "profile-images delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images'
    AND auth.uid()::TEXT = (SPLIT_PART(name, '/', 1))
  );

-- Grants de escritura en profiles para campos nuevos
GRANT UPDATE ON public.profiles TO authenticated;
