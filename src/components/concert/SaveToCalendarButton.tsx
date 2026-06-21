"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, CalendarMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SaveToCalendarButtonProps {
  concertId: string;
  initialSaved: boolean;
  savedCount: number;
}

export function SaveToCalendarButton({
  concertId,
  initialSaved,
  savedCount: initialCount,
}: SaveToCalendarButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const method = saved ? "DELETE" : "POST";
      const res = await fetch(`/api/me/calendar/concerts/${concertId}`, { method });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? "Error al actualizar el calendario.");
        return;
      }

      setSaved(!saved);
      setCount((c) => (saved ? c - 1 : c + 1));
      toast.success(saved ? "Eliminado de tu calendario." : "Guardado en tu calendario.");
    });
  }

  return (
    <Button variant={saved ? "secondary" : "outline"} onClick={toggle} disabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : saved ? (
        <CalendarMinus className="mr-2 h-4 w-4" />
      ) : (
        <CalendarPlus className="mr-2 h-4 w-4" />
      )}
      {saved ? "Eliminar de mi calendario" : "Guardar en mi calendario"}
      <span className="text-muted-foreground ml-2 text-xs">({count})</span>
    </Button>
  );
}
