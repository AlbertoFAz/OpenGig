-- Actualiza la política de inserción de conciertos:
-- ARTIST y VENUE solo pueden crear conciertos públicos.
-- USER y COLLABORATOR pueden crear conciertos públicos o privados.

DROP POLICY IF EXISTS insert_authenticated ON public.concerts;

-- Todo usuario autenticado puede insertar conciertos propios.
-- ARTIST y VENUE quedan restringidos a PUBLIC.
CREATE POLICY insert_authenticated ON public.concerts
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND (
      CASE
        WHEN EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('ARTIST', 'VENUE')
        ) THEN visibility = 'PUBLIC'
        ELSE true
      END
    )
  );
