import type { GameState, PlayerState, PlayerId } from "./types";

export function getPlayer(state: GameState, id: PlayerId): PlayerState {
  const p = state.players.find((p) => p.id === id);
  if (!p) throw new Error(`Player ${id} not found`);
  return p;
}

export function updatePlayer(
  state: GameState,
  id: PlayerId,
  fn: (p: PlayerState) => PlayerState,
): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === id ? fn(p) : p)),
  };
}
