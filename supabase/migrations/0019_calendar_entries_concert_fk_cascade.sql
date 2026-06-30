-- Cambiar ON DELETE SET NULL a ON DELETE CASCADE:
-- al borrar un concierto, las entradas de calendario vinculadas se eliminan también.
-- Las entradas personales (sin concert_id) no se ven afectadas.
ALTER TABLE public.calendar_entries
  DROP CONSTRAINT calendar_entries_concert_id_fkey;

ALTER TABLE public.calendar_entries
  ADD CONSTRAINT calendar_entries_concert_id_fkey
    FOREIGN KEY (concert_id) REFERENCES public.concerts(id) ON DELETE CASCADE;
