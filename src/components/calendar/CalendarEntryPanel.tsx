"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CalendarEntryWithConcert } from "@/lib/repositories/calendar-entries";

interface CalendarEntryPanelProps {
  entry: CalendarEntryWithConcert;
  onClose: () => void;
  onDeleted: () => void;
}

export function CalendarEntryPanel({ entry, onClose, onDeleted }: CalendarEntryPanelProps) {
  const [deleting, setDeleting] = useState(false);

  const dt = entry.date_time ? new Date(entry.date_time) : null;
  const title = entry.title ?? "Entrada personal";
  const description = entry.description;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/me/calendar/entries/${entry.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Error al eliminar.");
      }
      toast.success("Entrada eliminada.");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-background/80 absolute inset-0 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-background relative z-10 w-full max-w-md rounded-t-2xl border p-6 shadow-xl sm:rounded-2xl">
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground absolute right-4 top-4"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-1 text-lg font-semibold">{title}</h2>

        {dt && (
          <p className="text-muted-foreground mb-3 text-sm">
            {dt.toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}

        {description && <p className="text-sm">{description}</p>}

        <div className="mt-5 flex justify-end">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            {deleting ? "Eliminando…" : "Eliminar entrada"}
          </Button>
        </div>
      </div>
    </div>
  );
}
