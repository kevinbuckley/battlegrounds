import { defineMinion } from "../define";

export default defineMinion({
  id: "wrath_weaver",
  name: "Wrath Weaver",
  tier: 1,
  tribes: ["Demon"],
  baseAtk: 1,
  baseHp: 3,
  baseKeywords: ["cleave"],
  spellDamage: 0,
  hooks: {
    // End of turn: Deal 1 damage to your hero and give all friendly demons +2/+2
    onTurnEnd: ({ state, playerId, self }) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return state;

      // Deal 1 damage to your hero
      let newPlayers = state.players.map((p, i) =>
        i === playerId ? { ...p, hp: Math.max(0, p.hp - 1) } : p,
      );

      // Give all friendly demons +2/+2 (excluding self)
      const demonMinions = (player.board ?? []).filter(
        (m) => m.instanceId !== self.instanceId && m.tribes.includes("Demon"),
      );

      if (demonMinions.length > 0) {
        const newBoard = player.board.map((m) =>
          demonMinions.some((d) => d.instanceId === m.instanceId)
            ? { ...m, atk: m.atk + 2, hp: m.hp + 2 }
            : m,
        );
        newPlayers = newPlayers.map((p, i) => (i === playerId ? { ...p, board: newBoard } : p));
      }

      return {
        ...state,
        players: newPlayers,
      };
    },
  },
});
