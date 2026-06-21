import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const patchSchema = z.object({
  display_name: z.string().min(1).max(80).optional(),
  biography: z.string().max(1000).nullable().optional(),
  social_links: z.record(z.string(), z.string()).optional(),
  image_url: z.string().url().nullable().optional(),
  venue_address: z.string().max(200).nullable().optional(),
  venue_capacity: z.number().int().min(1).nullable().optional(),
  collaborator_scope: z.string().max(200).nullable().optional(),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const d = parsed.data;
  // Construir el payload solo con los campos presentes para satisfacer exactOptionalPropertyTypes
  const payload: ProfileUpdate = {
    ...(d.display_name !== undefined ? { display_name: d.display_name } : {}),
    ...(d.biography !== undefined ? { biography: d.biography } : {}),
    ...(d.social_links !== undefined ? { social_links: d.social_links } : {}),
    ...(d.image_url !== undefined ? { image_url: d.image_url } : {}),
    ...(d.venue_address !== undefined ? { venue_address: d.venue_address } : {}),
    ...(d.venue_capacity !== undefined ? { venue_capacity: d.venue_capacity } : {}),
    ...(d.collaborator_scope !== undefined ? { collaborator_scope: d.collaborator_scope } : {}),
  };

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
