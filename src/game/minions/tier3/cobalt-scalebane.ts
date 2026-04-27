import { defineMinion } from "../define";

export default defineMinion({
  id: "cobalt_scalebane",
  name: "Cobalt Scalebane",
  tier: 3,
  tribes: ["Dragon"],
  baseAtk: 5,
  baseHp: 5,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // End of turn: Give a random friendly minion +3 ATK
    onTurnEnd: ({ state, playerId, self }) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return state;

      const friendlyMinions = player.board.filter((m) => m.instanceId !== self.instanceId);
      if (friendlyMinions.length === 0) return state;

      const target = friendlyMinions[Math.floor(Math.random() * friendlyMinions.length)];
      if (!target) return state;

      const newBoard = player.board.map((m) =>
        m.instanceId === target.instanceId ? { ...m, atk: m.atk + 3 } : m,
      );

      return {
        ...state,
        players: state.players.map((p) => (p.id === playerId ? { ...p, board: newBoard } : p)),
      };
    },
  },
});
