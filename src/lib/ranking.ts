import type { Database } from "@/types/database.types";

type Concert = Database["public"]["Tables"]["concerts"]["Row"];

export interface RankableConcert extends Concert {
  profiles?: { display_name: string; prestige: number } | null;
}

export interface RankingStrategy {
  score(concert: RankableConcert): number;
}

/** score = likes_count + prestige_del_autor * 0.5 */
export class WeightedLikesAndPrestige implements RankingStrategy {
  score(concert: RankableConcert): number {
    const likes = concert.likes_count ?? 0;
    const prestige = concert.profiles?.prestige ?? 0;
    return likes + prestige * 0.5;
  }
}

export function rankConcerts(
  concerts: RankableConcert[],
  strategy: RankingStrategy = new WeightedLikesAndPrestige()
): RankableConcert[] {
  return [...concerts].sort((a, b) => strategy.score(b) - strategy.score(a));
}
