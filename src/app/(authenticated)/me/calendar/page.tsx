import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

import { createClient } from "@/lib/supabase/server";
import { getUserCalendarEntries } from "@/lib/repositories/calendar-entries";
import { NewPersonalEntryDialog } from "@/components/concert/NewPersonalEntryDialog";
import { CalendarSubscribeButton } from "@/components/calendar/CalendarSubscribeButton";
import { CalendarPageHeader } from "@/components/calendar/CalendarPageHeader";

// ssr: false elimina el mismatch de hidratación causado por useState(new Date())
// (servidor UTC vs cliente UTC+2) y saca react-big-calendar del camino crítico.
const PrivateCalendar = dynamic(
  () =>
    import("@/components/calendar/PrivateCalendar").then((m) => ({
      default: m.PrivateCalendar,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[calc(100vh-14rem)] min-h-[520px] animate-pulse rounded-2xl bg-muted/40" />
    ),
  }
);

export const metadata = { title: "My calendar — OpenGig" };

export default async function MyCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [entries, profileResult] = await Promise.all([
    getUserCalendarEntries(),
    supabase.from("profiles").select("calendar_subscription_token").eq("id", user.id).maybeSingle(),
  ]);

  const subscriptionToken = profileResult.data?.calendar_subscription_token ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <CalendarPageHeader />
        <NewPersonalEntryDialog />
      </div>

      <PrivateCalendar entries={entries} userId={user.id} />

      {subscriptionToken && (
        <div className="mt-10">
          <CalendarSubscribeButton initialToken={subscriptionToken} />
        </div>
      )}
    </div>
  );
}
