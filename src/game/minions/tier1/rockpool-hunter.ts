import { defineMinion } from "../define";

export default defineMinion({
  id: "rockpool_hunter",
  name: "Rockpool Hunter",
  tier: 1,
  tribes: ["Murloc"],
  baseAtk: 1,
  baseHp: 2,
  baseKeywords: [],
  hooks: {
    onBattlecry: (ctx) => {
      // Find first friendly Murloc on the player's board
      const player = ctx.state.players.find((p) => p.id === ctx.playerId);
      const target = player?.board.find(
        (m) => m.cardId !== ctx.self.cardId && m.tribes.includes("Murloc"),
      );
      if (!target || !player) return ctx.state;

      // Clone state, player, and board immutably
      const newPlayers = ctx.state.players.map((p) =>
        p.id === ctx.playerId
          ? {
              ...p,
              board: p.board.map((m) =>
                m.instanceId === target.instanceId ? { ...m, atk: m.atk + 1, hp: m.hp + 1 } : m,
              ),
            }
          : p,
      );

      return { ...ctx.state, players: newPlayers };
    },
  },
});
