import { buildPool } from "../../shop";
import type { PlayerState } from "../../types";
import { defineMinion, instantiate } from "../define";
import { MINIONS } from "../index";

export default defineMinion({
  id: "shifter_zerus",
  name: "Shifter Zerus",
  tier: 1,
  tribes: ["Beast"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onTurnStart: (ctx) => {
      const player = ctx.state.players[ctx.playerId] as PlayerState;
      const pool = buildPool(ctx.state.tribesInLobby);
      const available = Object.entries(pool).filter(
        ([id, n]) =>
          n > 0 &&
          id !== "shifter_zerus" &&
          (MINIONS[id as keyof typeof MINIONS]?.tier ?? 99) <= player.tier,
      );
      if (available.length === 0) return ctx.state;
      const chosenId = ctx.rng.pick(available.map(([id]) => id)) as string;
      const chosenCard = MINIONS[chosenId as keyof typeof MINIONS];
      if (!chosenCard) return ctx.state;
      const newMinion = instantiate(chosenCard);
      const board = player.board;
      const idx = board.findIndex((m) => m.instanceId === ctx.self.instanceId);
      if (idx === -1) return ctx.state;
      const newBoard = [...board];
      newBoard[idx] = newMinion;
      return {
        ...ctx.state,
        players: ctx.state.players.map((p) =>
          p.id === ctx.playerId ? { ...p, board: newBoard } : p,
        ),
      };
    },
  },
});
