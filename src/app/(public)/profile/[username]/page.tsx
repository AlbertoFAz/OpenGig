import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/repositories/profiles";
import { createClient } from "@/lib/supabase/server";
import { PublicProfileContent } from "@/components/profile/PublicProfileContent";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return { title: `${username} — OpenGig` };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const [result, supabase] = await Promise.all([getProfileByUsername(username), createClient()]);
  if (!result.ok) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === result.data.id;

  return <PublicProfileContent profile={result.data} isOwner={isOwner} />;
}
