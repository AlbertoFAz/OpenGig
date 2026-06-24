"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Lock, Link as LinkIcon, Upload } from "lucide-react";

import { concertSchema, type ConcertInput } from "@/lib/schemas/concert";
import type { UserRole } from "@/lib/schemas/profile";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ArtistSelector, type ArtistOption } from "@/components/concert/ArtistSelector";
import { VenueSelector } from "@/components/concert/VenueSelector";
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
  defaultValues?: Partial<ConcertInput> & {
    id?: string;
    image_url?: string;
    artistIds?: string[];
    venueId?: string;
  };
  userRole?: UserRole;
}

export function ConcertForm({ defaultValues, userRole = "USER" }: ConcertFormProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [artistIds, setArtistIds] = useState<string[]>(defaultValues?.artistIds ?? []);
  const [artistObjects, setArtistObjects] = useState<ArtistOption[]>([]);
  const [artistError, setArtistError] = useState<string | null>(null);
  const [venueId, setVenueId] = useState<string | undefined>(defaultValues?.venueId);
  const [imageMode, setImageMode] = useState<"file" | "url">("file");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const isEditing = !!defaultValues?.id;
  const onlyPublic = userRole === "ARTIST" || userRole === "VENUE";

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
      visibility: defaultValues?.visibility ?? "PUBLIC",
    },
  });

  async function onSubmit(values: ConcertInput) {
    // Validar artistas (mínimo 1)
    if (artistIds.length === 0) {
      setArtistError(t.concert.artistsRequired);
      return;
    }
    setArtistError(null);

    // Auto-generar título a partir de los artistas si se dejó vacío
    const resolvedName =
      values.name?.trim() ||
      artistObjects.map((a) => a.display_name).join(" + ") ||
      artistIds.join(", ");

    setLoading(true);
    const supabase = createClient();

    try {
      let image_url: string | undefined = defaultValues?.image_url;

      if (imageMode === "url") {
        if (imageUrlInput.trim()) {
          try {
            new URL(imageUrlInput.trim());
          } catch {
            throw new Error(t.common.unexpectedError);
          }
          image_url = imageUrlInput.trim();
        }
      } else if (values.image instanceof File) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error(t.common.unexpectedError);

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
        name: resolvedName,
        description: values.description || undefined,
        date_time: new Date(values.date_time).toISOString(),
        venue_name: values.venue_name,
        venue_address: values.venue_address || undefined,
        ticket_url: values.ticket_url || undefined,
        price: values.price,
        image_url: image_url || undefined,
        visibility: onlyPublic ? "PUBLIC" : values.visibility,
        artistIds,
        venueId,
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

      toast.success(isEditing ? t.concert.updated : t.concert.published);

      if (!onlyPublic && values.visibility === "PRIVATE") {
        router.push("/me/calendar");
      } else {
        router.push(`/concerts/${concertId}`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.unexpectedError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
        {/* Artistas — obligatorio, va primero */}
        <div className="grid gap-2">
          <p className="text-sm font-medium">
            {t.concert.artists} <span className="text-destructive">*</span>
          </p>
          <ArtistSelector
            value={artistIds}
            onChange={(ids) => {
              setArtistIds(ids);
              if (ids.length > 0) setArtistError(null);
            }}
            onSelectionChange={setArtistObjects}
          />
          <p className="text-muted-foreground text-xs">{t.concert.artistsHint}</p>
          {artistError && <p className="text-destructive text-sm">{artistError}</p>}
        </div>

        {/* Nombre — opcional */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.concert.name}</FormLabel>
              <FormControl>
                <Input placeholder={t.concert.namePlaceholder} {...field} />
              </FormControl>
              <FormDescription>{t.concert.nameHint}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.concert.description}</FormLabel>
              <FormControl>
                <textarea
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t.concert.descriptionPlaceholder}
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
                <FormLabel>{t.concert.dateTime}</FormLabel>
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
                <FormLabel>{t.concert.price}</FormLabel>
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

        {/* Sala — VenueSelector */}
        <FormField
          control={form.control}
          name="venue_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.concert.venue}</FormLabel>
              <FormControl>
                <VenueSelector
                  value={field.value ?? ""}
                  onChange={(name, profileId) => {
                    field.onChange(name);
                    setVenueId(profileId);
                  }}
                />
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
              <FormLabel>{t.concert.address}</FormLabel>
              <FormControl>
                <Input placeholder={t.concert.addressPlaceholder} {...field} />
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
              <FormLabel>{t.concert.ticketUrl}</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>{t.concert.image}</FormLabel>

          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => setImageMode("file")}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                imageMode === "file"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              {t.concert.uploadFile}
            </button>
            <button
              type="button"
              onClick={() => setImageMode("url")}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                imageMode === "url"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              {t.concert.useUrl}
            </button>
          </div>

          {imageMode === "file" ? (
            <FormField
              control={form.control}
              name="image"
              render={({ field: { onChange, ref, name, onBlur, disabled } }) => (
                <>
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
                  <FormDescription>{t.concert.imageFileMeta}</FormDescription>
                  <FormMessage />
                </>
              )}
            />
          ) : (
            <>
              <FormControl>
                <Input
                  type="url"
                  placeholder={t.concert.imageUrlPlaceholder}
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                />
              </FormControl>
              <FormDescription>{t.concert.imageUrlMeta}</FormDescription>
            </>
          )}

          {defaultValues?.image_url && (
            <p className="text-muted-foreground text-xs">
              {t.concert.currentImage}{" "}
              <a
                href={defaultValues.image_url}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {t.concert.view}
              </a>
            </p>
          )}
        </FormItem>

        {onlyPublic ? (
          <div className="text-muted-foreground flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
            <Globe className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t.concert.publicOnlyHint}</span>
          </div>
        ) : (
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.concert.visibility}</FormLabel>
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
                      {t.concert.public}
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
                      {t.concert.private}
                    </button>
                  </div>
                </FormControl>
                <FormDescription>
                  {field.value === "PUBLIC" ? t.concert.publicDesc : t.concert.privateDesc}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? t.concert.saving : isEditing ? t.concert.saveChanges : t.concert.publish}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t.common.cancel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
