-- ============================================================
-- 0015_account_status_endorsements.sql
-- Estado de cuenta, aprobación de artistas/salas, avales de
-- conciertos y políticas RLS de administrador.
-- ============================================================

-- ── 1. Estado de cuenta en profiles ─────────────────────────
-- ACTIVE   → cuenta normal
-- PENDING  → artista/sala a la espera de aprobación del admin
-- BLOCKED  → acceso a publicar suspendido por el admin

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE'
  CHECK (status IN ('ACTIVE', 'PENDING', 'BLOCKED'));

-- Los artistas y salas comienzan en PENDING hasta que el admin les dé el visto bueno.
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
  account_status TEXT;
BEGIN
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');
  IF base_username = '' THEN base_username := 'user'; END IF;

  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  BEGIN
    desired_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    desired_role := 'USER';
  END;
  IF desired_role IS NULL THEN desired_role := 'USER'; END IF;

  -- ARTIST y VENUE arrancan en PENDING; el resto en ACTIVE
  IF desired_role IN ('ARTIST', 'VENUE') THEN
    account_status := 'PENDING';
  ELSE
    account_status := 'ACTIVE';
  END IF;

  INSERT INTO public.profiles (id, username, display_name, role, status)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', final_username),
    desired_role,
    account_status
  );
  RETURN NEW;
END;
$$;

-- ── 2. Avales de artistas en concert_artists ─────────────────
-- Un artista vinculado puede avalar ("endorsed") el concierto.
-- endorsed_at NULL = no avalado, NOT NULL = avalado con fecha.
ALTER TABLE public.concert_artists
  ADD COLUMN IF NOT EXISTS endorsed_at TIMESTAMPTZ;

-- ── 3. Aval de sala en concerts ──────────────────────────────
ALTER TABLE public.concerts
  ADD COLUMN IF NOT EXISTS venue_endorsed_at TIMESTAMPTZ;

-- ── 4. RLS — el admin puede leer y gestionar todo ────────────

-- Helper: devuelve TRUE si el usuario activo es ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- profiles: admin puede actualizar cualquier perfil (aprobar, bloquear)
DROP POLICY IF EXISTS admin_update ON public.profiles;
CREATE POLICY admin_update ON public.profiles
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- profiles: admin puede eliminar cualquier perfil
DROP POLICY IF EXISTS admin_delete ON public.profiles;
CREATE POLICY admin_delete ON public.profiles
  FOR DELETE USING (public.is_admin());

-- concerts: admin puede eliminar cualquier concierto
DROP POLICY IF EXISTS admin_delete ON public.concerts;
CREATE POLICY admin_delete ON public.concerts
  FOR DELETE USING (public.is_admin());

-- ── 5. RLS — publicar conciertos requiere status ACTIVE ──────
-- Sustituye la política del 0005 que solo comprobaba el rol.
DROP POLICY IF EXISTS insert_authenticated ON public.concerts;
CREATE POLICY insert_authenticated ON public.concerts
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND (
      visibility = 'PRIVATE'
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('ARTIST', 'VENUE', 'COLLABORATOR', 'ADMIN')
          AND status = 'ACTIVE'
      )
    )
  );

-- Bloquear actualización de conciertos a usuarios BLOCKED
DROP POLICY IF EXISTS update_own ON public.concerts;
CREATE POLICY update_own ON public.concerts
  FOR UPDATE USING (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND status != 'BLOCKED'
    )
  )
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND status != 'BLOCKED'
    )
  );

-- ── 6. RLS — avales de concert_artists ──────────────────────
-- El artista vinculado puede actualizar endorsed_at de su fila
DROP POLICY IF EXISTS endorse_own ON public.concert_artists;
CREATE POLICY endorse_own ON public.concert_artists
  FOR UPDATE USING (artist_profile_id = auth.uid())
  WITH CHECK (artist_profile_id = auth.uid());

GRANT UPDATE ON public.concert_artists TO authenticated;

-- ── 7. Notificación al admin cuando llega una cuenta PENDING ─
CREATE OR REPLACE FUNCTION public.notify_admin_pending_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo actúa cuando status pasa a PENDING (registro de artista/sala)
  IF NEW.status = 'PENDING' THEN
    INSERT INTO public.notifications (user_id, type, payload)
    SELECT
      p.id,
      'PENDING_APPROVAL',
      jsonb_build_object(
        'pending_user_id',   NEW.id,
        'pending_username',  NEW.username,
        'pending_role',      NEW.role::TEXT,
        'display_name',      NEW.display_name
      )
    FROM public.profiles p
    WHERE p.role = 'ADMIN';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_pending ON public.profiles;
CREATE TRIGGER trg_notify_admin_pending
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_pending_account();

-- Grants adicionales
GRANT UPDATE (status) ON public.profiles TO authenticated;
