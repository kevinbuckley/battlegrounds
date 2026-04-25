import type { Rng } from "@/lib/rng";
import type { Action, GameState, PlayerId } from "@/game/types";

export interface PlayerView {
  state: GameState;
  me: PlayerId;
}

export interface Strategy {
  name: string;
  decideRecruitActions(view: PlayerView, rng: Rng): Action[];
}

export function makePlayerView(state: GameState, me: PlayerId): PlayerView {
  // TODO: strip fog-of-war info (other players' shops, hands) before returning.
  return { state, me };
}
