import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConcertFormCard } from "@/components/concert/ConcertFormCard";

export default async function NewConcertPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role ?? "USER";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <ConcertFormCard mode="new" userRole={userRole} />
    </div>
  );
}
