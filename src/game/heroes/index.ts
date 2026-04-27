import type { Hero, HeroId } from "../types";
import { afKay } from "./af-kay";
import { edwinVanCleef } from "./edwin-van-cleef";
import { georgeTheFallen } from "./george-the-fallen";
import { jandiceBarov } from "./jandice-barov";
import { lichBazHial } from "./lich-bazhial";
import { millificentManastorm } from "./millificent-manastorm";
import { patchwerk } from "./patchwerk";
import { ragnaros } from "./ragnaros";
import { rakanishu } from "./rakanishu";
import { scabbsCutterbutter } from "./scabbs-cutterbutter";
import { sirFinley } from "./sir-finley";
import { stubHero } from "./stub";
import { yoggSaron } from "./yogg-saron";
import { ysera } from "./ysera";

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
  [lichBazHial.id]: lichBazHial,
  [rakanishu.id]: rakanishu,
  [yoggSaron.id]: yoggSaron,
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
