"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { profileSchema, type ProfileInput } from "@/lib/schemas/profile";
import type { Profile } from "@/lib/repositories/profiles";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/providers/LocaleProvider";
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

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useLocale();

  const socialLinks = (profile.social_links ?? {}) as Record<string, string>;

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile.display_name ?? "",
      biography: profile.biography ?? "",
      social_links: {
        spotify: socialLinks["spotify"] ?? "",
        bandcamp: socialLinks["bandcamp"] ?? "",
        youtube: socialLinks["youtube"] ?? "",
        instagram: socialLinks["instagram"] ?? "",
        website: socialLinks["website"] ?? "",
      },
      venue_address: profile.venue_address ?? "",
      venue_capacity: profile.venue_capacity ?? undefined,
      collaborator_scope: profile.collaborator_scope ?? "",
    },
  });

  const role = profile.role;

  async function onSubmit(values: ProfileInput) {
    setLoading(true);
    const supabase = createClient();

    try {
      let image_url: string | undefined = profile.image_url ?? undefined;

      if (values.image instanceof File) {
        const ext = values.image.name.split(".").pop();
        const path = `${profile.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-images")
          .upload(path, values.image, { upsert: true });
        if (uploadError) throw new Error(uploadError.message);
        const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const cleanedSocialLinks = Object.fromEntries(
        Object.entries(values.social_links ?? {}).filter(([, v]) => v && v !== "")
      );

      const payload: Record<string, unknown> = {
        display_name: values.display_name,
        biography: values.biography || null,
        social_links: cleanedSocialLinks,
        image_url: image_url ?? null,
      };

      if (role === "VENUE") {
        payload["venue_address"] = values.venue_address || null;
        payload["venue_capacity"] = values.venue_capacity ?? null;
      }
      if (role === "COLLABORATOR") {
        payload["collaborator_scope"] = values.collaborator_scope || null;
      }

      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(((await res.json()) as { error: string }).error);

      toast.success(t.profile.updated);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.unexpectedError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <FormField
          control={form.control}
          name="image"
          render={({ field: { onChange, ref, name, onBlur, disabled } }) => (
            <FormItem>
              <FormLabel>{t.profile.imageLabel}</FormLabel>
              {profile.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image_url}
                  alt={t.profile.imageLabel}
                  className="mb-2 h-20 w-20 rounded-full object-cover"
                />
              )}
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
              <FormDescription>{t.profile.imageFileMeta}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.profile.displayName}</FormLabel>
              <FormControl>
                <Input placeholder={t.profile.displayNamePlaceholder} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="biography"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.profile.biography}</FormLabel>
              <FormControl>
                <textarea
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t.profile.biographyPlaceholder}
                  maxLength={1000}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {role === "VENUE" && (
          <>
            <FormField
              control={form.control}
              name="venue_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.profile.venueAddress}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.profile.venueAddressPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="venue_capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.profile.venueCapacity}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="500"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : parseInt(e.target.value, 10)
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {role === "COLLABORATOR" && (
          <FormField
            control={form.control}
            name="collaborator_scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.profile.collaboratorScope}</FormLabel>
                <FormControl>
                  <Input placeholder={t.profile.collaboratorScopePlaceholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {role === "ARTIST" && (
          <fieldset className="grid gap-4 rounded-lg border p-4">
            <legend className="px-1 text-sm font-medium">{t.profile.socialLinks}</legend>
            {(["spotify", "bandcamp", "youtube", "instagram", "website"] as const).map((key) => (
              <FormField
                key={key}
                control={form.control}
                name={`social_links.${key}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">{key}</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder={`https://${key}.com/...`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </fieldset>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? t.profile.saving : t.profile.saveChanges}
        </Button>
      </form>
    </Form>
  );
}
