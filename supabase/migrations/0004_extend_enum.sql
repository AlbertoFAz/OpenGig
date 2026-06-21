-- ============================================================
-- 0004_extend_enum.sql
-- Ampliar user_role con los nuevos valores de rol.
-- DEBE estar en un fichero separado porque ALTER TYPE ADD VALUE
-- no puede usarse junto a sentencias que referencien los
-- nuevos valores dentro de la misma transacción.
-- ============================================================

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'ARTIST';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'VENUE';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'COLLABORATOR';
