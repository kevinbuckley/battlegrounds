import type { Hero, HeroId, MinionInstance, PlayerId } from "../types";
import { getPlayer, updatePlayer } from "../utils";
import { HEROES } from "./index";

export const sirFinley: Hero = {
  id: "sir_finley",
  name: "Sir Finley Mrrgglton",
  description: "Hero Power (2): Swap your Hero Power with another available one.",
  startHp: 40,
  startArmor: 0,
  power: { kind: "active", cost: 2, usesPerTurn: 1 },

  onHeroPower: (state, playerId, target) => {
    const player = getPlayer(state, playerId);

    // Collect all other active hero powers (excluding our own and passive/start_of_game)
    const otherActiveHeroes: HeroId[] = [];
    for (const id of Object.keys(HEROES) as HeroId[]) {
      const hero = HEROES[id]!;
      if (id === "stub_hero" || id === "sir_finley") continue;
      if (hero.power.kind !== "active") continue;
      otherActiveHeroes.push(id);
    }

    // Pick 3 random hero powers to offer (or fewer if not enough exist)
    const shuffled = [...otherActiveHeroes].sort(() => state.seed + Math.random() - 0.5);
    const offers = shuffled.slice(0, 3);

    if (offers.length === 0) return state;

    // target is the index into the offers array (which hero power to swap to)
    const chosenIndex = typeof target === "number" ? target : 0;
    const chosenHeroId = offers[Math.min(chosenIndex, offers.length - 1)] as HeroId;
    const chosenHero = HEROES[chosenHeroId];
    if (!chosenHero || chosenHero.power.kind !== "active") return state;

    // Swap: replace our hero with the chosen one, keeping our HP, armor, board, etc.
    return updatePlayer(state, playerId, (p) => ({
      ...p,
      heroId: chosenHeroId,
      hp: chosenHero.startHp,
      armor: chosenHero.startArmor,
    }));
  },
};
