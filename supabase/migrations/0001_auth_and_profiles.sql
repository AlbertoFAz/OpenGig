-- ============================================================
-- 0001_auth_and_profiles.sql
-- Tabla de perfiles de usuario, triggers de sincronización con
-- auth.users y políticas RLS.
-- ============================================================

-- Enum de roles (solo USER por ahora; se ampliará en fase 4)
CREATE TYPE public.user_role AS ENUM ('USER');

-- ── Tabla profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username      TEXT        UNIQUE NOT NULL,
  display_name  TEXT        NOT NULL DEFAULT '',
  role          public.user_role NOT NULL DEFAULT 'USER',
  prestige      INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── Trigger: mantener updated_at ────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Trigger: crear perfil al registrar usuario ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter       INTEGER := 0;
BEGIN
  -- Derivar username desde el email (parte antes del @)
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  -- Eliminar caracteres no alfanuméricos ni guion bajo
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');
  -- Garantizar unicidad añadiendo un sufijo numérico si hace falta
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', final_username),
    'USER'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Políticas RLS ────────────────────────────────────────────

-- Cualquiera puede leer perfiles públicos
CREATE POLICY select_public ON public.profiles
  FOR SELECT USING (TRUE);

-- Solo el dueño puede actualizar su perfil
CREATE POLICY update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Solo el dueño puede eliminar su perfil
CREATE POLICY delete_own ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ── Grants de tabla (RLS restringe filas; los grants dan acceso a nivel tabla) ──
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE, DELETE ON public.profiles TO authenticated;
