import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUserCalendarEntries } from "@/lib/repositories/calendar-entries";
import { PrivateCalendar } from "@/components/calendar/PrivateCalendar";
import { NewPersonalEntryDialog } from "@/components/concert/NewPersonalEntryDialog";

export const metadata = { title: "Mi calendario — OpenGig" };

export default async function MyCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getUserCalendarEntries();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Mi calendario</h1>
        <NewPersonalEntryDialog />
      </div>

      <PrivateCalendar entries={entries} userId={user.id} />
    </div>
  );
}
