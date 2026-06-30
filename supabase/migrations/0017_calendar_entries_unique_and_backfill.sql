-- Evitar entradas duplicadas del mismo (usuario, concierto) en el calendario privado
CREATE UNIQUE INDEX IF NOT EXISTS calendar_entries_user_concert_unique
  ON public.calendar_entries (user_id, concert_id)
  WHERE concert_id IS NOT NULL;

-- Backfill: añadir al calendario del creador los conciertos públicos ya existentes
INSERT INTO public.calendar_entries (user_id, concert_id)
SELECT c.created_by, c.id
FROM public.concerts c
WHERE c.visibility = 'PUBLIC'
  AND NOT EXISTS (
    SELECT 1 FROM public.calendar_entries ce
    WHERE ce.user_id = c.created_by AND ce.concert_id = c.id
  );
