"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { concertSchema, type ConcertInput } from "@/lib/schemas/concert";
import { createClient } from "@/lib/supabase/client";
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
  defaultValues?: Partial<ConcertInput> & { id?: string; image_url?: string };
}

export function ConcertForm({ defaultValues }: ConcertFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!defaultValues?.id;

  const form = useForm<ConcertInput>({
    resolver: zodResolver(concertSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description,
      date_time: defaultValues?.date_time ?? "",
      venue_name: defaultValues?.venue_name ?? "",
      venue_address: defaultValues?.venue_address,
      ticket_url: defaultValues?.ticket_url,
      price: defaultValues?.price,
    },
  });

  async function onSubmit(values: ConcertInput) {
    setLoading(true);
    const supabase = createClient();

    try {
      let image_url: string | undefined = defaultValues?.image_url;

      // Subir imagen si se seleccionó una nueva
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
        description: values.description,
        date_time: new Date(values.date_time).toISOString(),
        venue_name: values.venue_name,
        venue_address: values.venue_address,
        ticket_url: values.ticket_url || null,
        price: values.price ?? null,
        image_url: image_url ?? null,
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
      router.push(`/concerts/${concertId}`);
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
