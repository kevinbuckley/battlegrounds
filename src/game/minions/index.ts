import type { MinionCard, MinionCardId } from "../types";
import allleyCat from "./tier1/alley-cat";
import bloodsailPirate from "./tier1/bloodsail-pirate";
import dragonspawnLieutenant from "./tier1/dragonspawn-lieutenant";
import flameImp from "./tier1/flame-imp";
import gnomaTinker from "./tier1/gnoma-tinker";
import murlocTidecaller from "./tier1/murloc-tidecaller";
import murlocTidehunter from "./tier1/murloc-tidehunter";
import rockpoolHunter from "./tier1/rockpool-hunter";
import rushMinion from "./tier1/rush-minion";
import venomousCrasher from "./tier1/venomous-crasher";
import { WindfuryMinion } from "./tier1/windfury-minion";
import wrathWeaver from "./tier1/wrath-weaver";
import annoyoTron from "./tier2/annoy-o-tron";
import glyphGuardian from "./tier2/glyph-guardian";
import harvestGolem from "./tier2/harvest-golem";
import prisoner from "./tier2/imprisoner";
import kaboomBot from "./tier2/kaboom-bot";
import metaltoothLeaper from "./tier2/metaltooth-leaper";
import murlocWarleader from "./tier2/murloc-warleader";
import rebornMinion from "./tier2/reborn-minion";
import scavengingHyena from "./tier2/scavenging-hyena";
import selflessHero from "./tier2/selfless-hero";
import spawnOfNzoth from "./tier2/spawn-of-nzoth";
import unstableGhoul from "./tier2/unstable-ghoul";
import vulgarHomunculus from "./tier2/vulgar-homunculus";
import arcaneTinker from "./tier3/arcane-tinker";
import gazelle from "./tier3/gazelle";
import markku from "./tier3/markku";
import queenOfPain from "./tier3/queen-of-pain";
import stonehillDefender from "./tier3/stonehill-defender";
import bloodsailCorsair from "./tier4/bloodsail-corsair";
import broodkinZealot from "./tier4/broodkin-zealot";
import crystalweaver from "./tier4/crystalweaver";
import nagaSecretGuardian from "./tier4/naga-secret-guardian";
import blingtron5000 from "./tier5/blingtron-5000";
import mogorTheCurseGolem from "./tier5/mogor-the-curse-golem";
import friggentNorthvalley from "./tier6/friggent-northvalley";
import terestianManferris from "./tier6/terestian-manferris";
import zixorProjectHope from "./tier6/zixor-project-hope";

export const MINIONS: Record<MinionCardId, MinionCard> = {
  [kaboomBot.id]: kaboomBot,
  [annoyoTron.id]: annoyoTron,
  [allleyCat.id]: allleyCat,
  [bloodsailPirate.id]: bloodsailPirate,
  [dragonspawnLieutenant.id]: dragonspawnLieutenant,
  [flameImp.id]: flameImp,
  [venomousCrasher.id]: venomousCrasher,
  [murlocTidecaller.id]: murlocTidecaller,
  [murlocTidehunter.id]: murlocTidehunter,
  [wrathWeaver.id]: wrathWeaver,
  [gnomaTinker.id]: gnomaTinker,
  [rockpoolHunter.id]: rockpoolHunter,
  [WindfuryMinion.id]: WindfuryMinion,
  [rushMinion.id]: rushMinion,
  [prisoner.id]: prisoner,
  [glyphGuardian.id]: glyphGuardian,
  [metaltoothLeaper.id]: metaltoothLeaper,
  [murlocWarleader.id]: murlocWarleader,
  [rebornMinion.id]: rebornMinion,
  [scavengingHyena.id]: scavengingHyena,
  [selflessHero.id]: selflessHero,
  [spawnOfNzoth.id]: spawnOfNzoth,
  [harvestGolem.id]: harvestGolem,
  [unstableGhoul.id]: unstableGhoul,
  [vulgarHomunculus.id]: vulgarHomunculus,
  [gazelle.id]: gazelle,
  [markku.id]: markku,
  [arcaneTinker.id]: arcaneTinker,
  [queenOfPain.id]: queenOfPain,
  [stonehillDefender.id]: stonehillDefender,
  [bloodsailCorsair.id]: bloodsailCorsair,
  [broodkinZealot.id]: broodkinZealot,
  [crystalweaver.id]: crystalweaver,
  [nagaSecretGuardian.id]: nagaSecretGuardian,
  [blingtron5000.id]: blingtron5000,
  [mogorTheCurseGolem.id]: mogorTheCurseGolem,
  [friggentNorthvalley.id]: friggentNorthvalley,
  [terestianManferris.id]: terestianManferris,
  [zixorProjectHope.id]: zixorProjectHope,
};

export function getMinion(id: MinionCardId): MinionCard {
  const card = MINIONS[id];
  if (!card) throw new Error(`Unknown minion: ${id}`);
  return card;
}
