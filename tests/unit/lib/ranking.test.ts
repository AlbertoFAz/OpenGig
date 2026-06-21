import { describe, it, expect } from "vitest";
import { rankConcerts, WeightedLikesAndPrestige, type RankableConcert } from "@/lib/ranking";

function makeConcert(id: string, likes: number, prestige: number): RankableConcert {
  return {
    id,
    name: `Concierto ${id}`,
    date_time: new Date().toISOString(),
    venue_name: "Sala",
    venue_address: null,
    image_url: null,
    ticket_url: null,
    price: null,
    description: null,
    visibility: "PUBLIC",
    created_by: "user-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    likes_count: likes,
    venue_id: null,
    profiles: { display_name: "Artista", prestige },
  } as unknown as RankableConcert;
}

describe("WeightedLikesAndPrestige", () => {
  const strategy = new WeightedLikesAndPrestige();

  it("score = likes + prestige * 0.5", () => {
    const concert = makeConcert("a", 10, 20);
    expect(strategy.score(concert)).toBe(10 + 20 * 0.5);
  });

  it("score es 0 cuando no hay likes ni prestigio", () => {
    const concert = makeConcert("b", 0, 0);
    expect(strategy.score(concert)).toBe(0);
  });

  it("funciona sin perfil asociado (prestige = 0)", () => {
    const concert: RankableConcert = { ...makeConcert("c", 5, 0), profiles: null };
    expect(strategy.score(concert)).toBe(5);
  });
});

describe("rankConcerts", () => {
  it("ordena de mayor a menor score", () => {
    const concerts = [
      makeConcert("low", 1, 0),
      makeConcert("high", 50, 100),
      makeConcert("mid", 10, 20),
    ];
    const ranked = rankConcerts(concerts);
    expect(ranked[0]!.id).toBe("high");
    expect(ranked[1]!.id).toBe("mid");
    expect(ranked[2]!.id).toBe("low");
  });

  it("no muta el array original", () => {
    const concerts = [makeConcert("a", 5, 0), makeConcert("b", 1, 0)];
    const original = [...concerts];
    rankConcerts(concerts);
    expect(concerts[0]!.id).toBe(original[0]!.id);
  });

  it("devuelve array vacío si la entrada está vacía", () => {
    expect(rankConcerts([])).toHaveLength(0);
  });

  it("admite estrategia personalizada", () => {
    const concerts = [makeConcert("a", 100, 0), makeConcert("b", 0, 999)];
    // Estrategia que solo cuenta likes
    const ranked = rankConcerts(concerts, { score: (c) => c.likes_count ?? 0 });
    expect(ranked[0]!.id).toBe("a");
  });
});
