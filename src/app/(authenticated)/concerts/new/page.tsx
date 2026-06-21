import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ConcertForm } from "@/components/concert/ConcertForm";

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
      <Card>
        <CardHeader>
          <CardTitle>Publicar concierto</CardTitle>
          <CardDescription>
            {userRole === "USER"
              ? "Como aficionado, puedes crear conciertos privados en tu calendario personal."
              : "Completa el formulario para añadir un concierto al calendario público."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConcertForm userRole={userRole} />
        </CardContent>
      </Card>
    </div>
  );
}
