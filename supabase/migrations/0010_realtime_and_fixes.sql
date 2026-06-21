-- ============================================================
-- Fase 5 — correcciones post-implementación
-- ============================================================

-- 1. Habilitar Realtime en las tablas que lo necesitan
ALTER PUBLICATION supabase_realtime ADD TABLE public.concerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Habilitar RLS en system_config (solo lectura pública, sin escritura desde cliente)
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer la configuración del sistema (umbral de promoción, etc.)
CREATE POLICY select_all ON public.system_config
  FOR SELECT USING (true);
