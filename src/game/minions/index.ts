import type { MinionCard, MinionCardId } from "../types";

import allleyCat from "./tier1/alley-cat";
import dragonspawnLieutenant from "./tier1/dragonspawn-lieutenant";
import murlocTidecaller from "./tier1/murloc-tidecaller";
import murlocTidehunter from "./tier1/murloc-tidehunter";
import rockpoolHunter from "./tier1/rockpool-hunter";
import { WindfuryMinion } from "./tier1/windfury-minion";
import wrathWeaver from "./tier1/wrath-weaver";
import glyphGuardian from "./tier2/glyph-guardian";
import metaltoothLeaper from "./tier2/metaltooth-leaper";
import murlocWarleader from "./tier2/murloc-warleader";
import rebornMinion from "./tier2/reborn-minion";
import scavengingHyena from "./tier2/scavenging-hyena";
import selflessHero from "./tier2/selfless-hero";
import unstableGhoul from "./tier2/unstable-ghoul";
import vulgarHomunculus from "./tier2/vulgar-homunculus";
export const MINIONS: Record<MinionCardId, MinionCard> = {
  [allleyCat.id]: allleyCat,
  [dragonspawnLieutenant.id]: dragonspawnLieutenant,
  [murlocTidecaller.id]: murlocTidecaller,
  [murlocTidehunter.id]: murlocTidehunter,
  [wrathWeaver.id]: wrathWeaver,
  [rockpoolHunter.id]: rockpoolHunter,
  [WindfuryMinion.id]: WindfuryMinion,
  [glyphGuardian.id]: glyphGuardian,
  [metaltoothLeaper.id]: metaltoothLeaper,
  [murlocWarleader.id]: murlocWarleader,
  [rebornMinion.id]: rebornMinion,
  [scavengingHyena.id]: scavengingHyena,
  [selflessHero.id]: selflessHero,
  [unstableGhoul.id]: unstableGhoul,
  [vulgarHomunculus.id]: vulgarHomunculus,
};

export function getMinion(id: MinionCardId): MinionCard {
  const card = MINIONS[id];
  if (!card) throw new Error(`Unknown minion: ${id}`);
  return card;
}
