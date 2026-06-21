import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json([]);

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, image_url")
    .eq("role", "ARTIST")
    .ilike("display_name", `%${q}%`)
    .limit(10);

  return NextResponse.json(data ?? []);
}
