import type { Hero, HeroId } from "../types";
import { stubHero } from "./stub";
import { patchwerk } from "./patchwerk";
import { georgeTheFallen } from "./george-the-fallen";
import { sirFinley } from "./sir-finley";
import { edwinVanCleef } from "./edwin-van-cleef";
import { scabbsCutterbutter } from "./scabbs-cutterbutter";
import { ragnaros } from "./ragnaros";
import { ysera } from "./ysera";
import { millificentManastorm } from "./millificent-manastorm";
import { jandiceBarov } from "./jandice-barov";
import { afKay } from "./af-kay";

export const HEROES: Record<HeroId, Hero> = {
  [stubHero.id]: stubHero,
  [patchwerk.id]: patchwerk,
  [georgeTheFallen.id]: georgeTheFallen,
  [sirFinley.id]: sirFinley,
  [edwinVanCleef.id]: edwinVanCleef,
  [scabbsCutterbutter.id]: scabbsCutterbutter,
  [ragnaros.id]: ragnaros,
  [ysera.id]: ysera,
  [millificentManastorm.id]: millificentManastorm,
  [jandiceBarov.id]: jandiceBarov,
  [afKay.id]: afKay,
};

export function getHero(id: HeroId): Hero {
  const hero = HEROES[id];
  if (!hero) throw new Error(`Unknown hero: ${id}`);
  return hero;
}

/** Returns all non-stub hero IDs (for hero selection pool). */
export function getAllHeroIds(): HeroId[] {
  return Object.keys(HEROES).filter((id) => id !== "stub_hero");
}
