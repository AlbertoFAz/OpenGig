import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/repositories/profiles";
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
  const result = await getProfileByUsername(username);
  if (!result.ok) notFound();

  return <PublicProfileContent profile={result.data} />;
}
