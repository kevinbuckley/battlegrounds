import type { Hero, Keyword } from "../types";
import { getPlayer, updatePlayer } from "../utils";

const RANDOM_KEYWORDS: Keyword[] = [
  "taunt",
  "divineShield",
  "windfury",
  "poisonous",
  "reborn",
  "venomous",
  "cleave",
  "lifesteal",
  "rush",
  "freeze",
  "magnetic",
  "combo",
  "bounty",
];

export const yoggSaron: Hero = {
  id: "yogg_saron",
  name: "Yogg-Saron",
  description: "Hero Power (2): Give all friendly minions a random keyword.",
  startHp: 30,
  startArmor: 7,
  power: { kind: "active", cost: 2, usesPerTurn: 1 },

  onHeroPower: (state, playerId, _target, rng) => {
    const player = getPlayer(state, playerId);
    if (player.board.length === 0) return state;

    const chosenKeyword = rng.pick(RANDOM_KEYWORDS);

    return updatePlayer(state, playerId, (p) => ({
      ...p,
      board: p.board.map((m) => ({
        ...m,
        keywords: new Set([...m.keywords, chosenKeyword]),
      })),
    }));
  },
};
