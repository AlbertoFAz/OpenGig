import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (ids.length === 0) return NextResponse.json([]);

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, image_url")
    .in("id", ids);

  return NextResponse.json(data ?? []);
}
