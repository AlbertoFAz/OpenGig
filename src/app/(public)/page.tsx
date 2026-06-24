import { getFeaturedConcerts, getUpcomingConcerts } from "@/lib/repositories/concerts";
import { rankConcerts } from "@/lib/ranking";
import { HomeContent } from "@/components/home/HomeContent";

export const metadata = { title: "OpenGig — Concert calendar" };

export default async function HomePage() {
  const [upcomingConcerts, todayConcerts] = await Promise.all([
    getUpcomingConcerts(180),
    getFeaturedConcerts(),
  ]);

  const featured = rankConcerts(todayConcerts).slice(0, 10);

  return <HomeContent featured={featured} upcoming={upcomingConcerts} />;
}
