"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Lock, Info } from "lucide-react";

import { concertSchema, type ConcertInput } from "@/lib/schemas/concert";
import type { UserRole } from "@/lib/schemas/profile";
import { createClient } from "@/lib/supabase/client";
import { ArtistSelector } from "@/components/concert/ArtistSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ConcertFormProps {
  /** Si se pasa, el formulario está en modo edición */
  defaultValues?: Partial<ConcertInput> & {
    id?: string;
    image_url?: string;
    /** Artistas vinculados al concierto (solo en edición) */
    artistIds?: string[];
  };
  userRole?: UserRole;
}

export function ConcertForm({ defaultValues, userRole = "USER" }: ConcertFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [artistIds, setArtistIds] = useState<string[]>(defaultValues?.artistIds ?? []);
  const isEditing = !!defaultValues?.id;
  const canPublicize = userRole !== "USER";

  const form = useForm<ConcertInput>({
    resolver: zodResolver(concertSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      date_time: defaultValues?.date_time ?? "",
      venue_name: defaultValues?.venue_name ?? "",
      venue_address: defaultValues?.venue_address ?? "",
      ticket_url: defaultValues?.ticket_url ?? "",
      price: defaultValues?.price,
      // Si el usuario es USER, forzar PRIVATE
      visibility: canPublicize ? (defaultValues?.visibility ?? "PUBLIC") : "PRIVATE",
    },
  });

  async function onSubmit(values: ConcertInput) {
    setLoading(true);
    const supabase = createClient();

    try {
      let image_url: string | undefined = defaultValues?.image_url;

      if (values.image instanceof File) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");

        const ext = values.image.name.split(".").pop();
        const uniqueId = crypto.randomUUID();
        const path = `${user.id}/${uniqueId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("concert-images")
          .upload(path, values.image, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabase.storage.from("concert-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const payload = {
        name: values.name,
        description: values.description || undefined,
        date_time: new Date(values.date_time).toISOString(),
        venue_name: values.venue_name,
        venue_address: values.venue_address || undefined,
        ticket_url: values.ticket_url || undefined,
        price: values.price,
        image_url: image_url || undefined,
        visibility: canPublicize ? values.visibility : "PRIVATE",
        artistIds,
      };

      let concertId: string;

      if (isEditing) {
        const res = await fetch(`/api/concerts/${defaultValues.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(((await res.json()) as { error: string }).error);
        concertId = defaultValues.id!;
      } else {
        const res = await fetch("/api/concerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(((await res.json()) as { error: string }).error);
        const { id } = (await res.json()) as { id: string };
        concertId = id;
      }

      toast.success(isEditing ? "Concierto actualizado." : "Concierto publicado.");

      if (values.visibility === "PRIVATE" || !canPublicize) {
        router.push("/me/calendar");
      } else {
        router.push(`/concerts/${concertId}`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del concierto *</FormLabel>
              <FormControl>
                <Input placeholder="Ej. The Rolling Stones en Madrid" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <textarea
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe el concierto..."
                  maxLength={2000}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y hora *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                    }
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="venue_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sala / Recinto *</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Wizink Center" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="venue_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Av. de Felipe II, Madrid" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ticket_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de entradas</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field: { onChange, ref, name, onBlur, disabled } }) => (
            <FormItem>
              <FormLabel>Imagen del concierto</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={ref}
                  name={name}
                  onBlur={onBlur}
                  disabled={disabled}
                  onChange={(e) => onChange(e.target.files?.[0])}
                />
              </FormControl>
              <FormDescription>JPG, PNG o WebP · máximo 5 MB</FormDescription>
              {defaultValues?.image_url && (
                <p className="text-muted-foreground text-xs">
                  Imagen actual:{" "}
                  <a
                    href={defaultValues.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    ver
                  </a>
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selector de artistas — solo para roles que pueden publicar */}
        {canPublicize && (
          <div className="grid gap-2">
            <p className="text-sm font-medium">Artistas</p>
            <ArtistSelector value={artistIds} onChange={setArtistIds} />
            <p className="text-muted-foreground text-xs">
              Vincula los artistas registrados que actúan en este concierto.
            </p>
          </div>
        )}

        {/* Toggle de visibilidad */}
        {canPublicize ? (
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibilidad</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => field.onChange("PUBLIC")}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                        field.value === "PUBLIC"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Globe className="h-4 w-4" />
                      Público
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("PRIVATE")}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                        field.value === "PRIVATE"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Lock className="h-4 w-4" />
                      Privado
                    </button>
                  </div>
                </FormControl>
                <FormDescription>
                  {field.value === "PUBLIC"
                    ? "El concierto aparecerá en el calendario público."
                    : "Solo tú podrás verlo en tu calendario privado."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="text-muted-foreground flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Los aficionados solo pueden crear eventos privados. Cambia tu rol a Artista, Sala o
              Colaborador para publicar conciertos en el calendario público.
            </span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Guardando…" : isEditing ? "Guardar cambios" : "Publicar concierto"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
