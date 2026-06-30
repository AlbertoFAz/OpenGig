import { notFound } from "next/navigation";
import { getConcertById } from "@/lib/repositories/concerts";
import { isConcertInCalendar } from "@/lib/repositories/calendar-entries";
import { getConcertArtists } from "@/lib/repositories/profiles";
import { hasLiked } from "@/lib/repositories/likes";
import { createClient } from "@/lib/supabase/server";
import { ConcertDetailContent } from "@/components/concert/ConcertDetailContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConcertDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getConcertById(id);
  if (!result.ok) notFound();

  const concert = result.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === concert.created_by;

  const { data: savedCountData } = await supabase.rpc("get_concert_saved_count", {
    p_concert_id: concert.id,
  });
  const savedCount = (savedCountData as number | null) ?? 0;

  const [alreadySaved, artists, alreadyLiked] = await Promise.all([
    user ? isConcertInCalendar(concert.id) : Promise.resolve(false),
    getConcertArtists(id),
    user ? hasLiked(concert.id) : Promise.resolve(false),
  ]);

  const isLinkedArtist = user
    ? artists.some((a) => a.kind === "registered" && a.id === user.id)
    : false;
  const isVenue = user ? concert.venue_id === user.id : false;

  return (
    <ConcertDetailContent
      concert={concert}
      artists={artists}
      alreadySaved={alreadySaved}
      alreadyLiked={alreadyLiked}
      userId={user?.id ?? null}
      isOwner={isOwner}
      savedCount={savedCount}
      isLinkedArtist={isLinkedArtist}
      isVenue={isVenue}
    />
  );
}
