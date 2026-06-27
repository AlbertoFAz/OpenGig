-- ============================================================
-- 0014_admin_role.sql
-- Añadir rol ADMIN al enum user_role.
-- ALTER TYPE ADD VALUE debe ir en su propia transacción.
-- ============================================================

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'ADMIN';
