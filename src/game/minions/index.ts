import type { MinionCard, MinionCardId } from "../types";
import allleyCat from "./tier1/alley-cat";
import bloodsailPirate from "./tier1/bloodsail-pirate";
import { bountyMinion } from "./tier1/bounty-minion";
import bristlebackBoys from "./tier1/bristleback-boys";
import comboMinion from "./tier1/combo-minion";
import dragonspawnLieutenant from "./tier1/dragonspawn-lieutenant";
import flameImp from "./tier1/flame-imp";
import gnomaTinker from "./tier1/gnoma-tinker";
import murlocTidecaller from "./tier1/murloc-tidecaller";
import murlocTidehunter from "./tier1/murloc-tidehunter";
import murlocTinyfin from "./tier1/murloc-tinyfin";
import rockpoolHunter from "./tier1/rockpool-hunter";
import rushMinion from "./tier1/rush-minion";
import tauntMinion from "./tier1/taunt-minion";
import venomousCrasher from "./tier1/venomous-crasher";
import { WindfuryMinion } from "./tier1/windfury-minion";
import wrathWeaver from "./tier1/wrath-weaver";
import annoyoTron from "./tier2/annoy-o-tron";
import deflectoBot from "./tier2/deflect-o-bot";
import glyphGuardian from "./tier2/glyph-guardian";
import grombiTheRotunda from "./tier2/grombi-the-rotunda";
import harvestGolem from "./tier2/harvest-golem";
import prisoner from "./tier2/imprisoner";
import kaboomBot from "./tier2/kaboom-bot";
import knifeJuggler from "./tier2/knife-juggler";
import metaltoothLeaper from "./tier2/metaltooth-leaper";
import murlocWarleader from "./tier2/murloc-warleader";
import nightmareAmalgam from "./tier2/nightmare-amalgam";
import packLeader from "./tier2/pack-leader";
import pogoHopper from "./tier2/pogo-hopper";
import rebornMinion from "./tier2/reborn-minion";
import scavengingHyena from "./tier2/scavenging-hyena";
import selflessHero from "./tier2/selfless-hero";
import spawnOfNzoth from "./tier2/spawn-of-nzoth";
import unstableGhoul from "./tier2/unstable-ghoul";
import vulgarHomunculus from "./tier2/vulgar-homunculus";
import arcaneTinker from "./tier3/arcane-tinker";
import cobaltScalebane from "./tier3/cobalt-scalebane";
import coldlightSeer from "./tier3/coldlight-seer";
import frostboundGolem from "./tier3/frostbound-golem";
import gazelle from "./tier3/gazelle";
import gromsch from "./tier3/gromsch";
import infestedWolf from "./tier3/infested-wolf";
import markku from "./tier3/markku";
import queenOfPain from "./tier3/queen-of-pain";
import screwjankClunker from "./tier3/screwjank-clunker";
import soulJuggler from "./tier3/soul-juggler";
import stonehillDefender from "./tier3/stonehill-defender";
import annihilanBattlemaster from "./tier4/annihilan-battlemaster";
import bloodsailCorsair from "./tier4/bloodsail-corsair";
import bolvarFireblood from "./tier4/bolvar-fireblood";
import broodkinZealot from "./tier4/broodkin-zealot";
import caveHydra from "./tier4/cave-hydra";
import crystalweaver from "./tier4/crystalweaver";
import defenderOfArgus from "./tier4/defender-of-argus";
import drakonidEnforcer from "./tier4/drakonid-enforcer";
import nagaSecretGuardian from "./tier4/naga-secret-guardian";
import oldMurkEye from "./tier4/old-murk-eye";
import securityRover from "./tier4/security-rover";
import toxfin from "./tier4/toxfin";
import virmenSensei from "./tier4/virmen-sensei";
import baronRivendare from "./tier5/baron-rivendare";
import bigFernal from "./tier5/big-fernal";
import blingtron5000 from "./tier5/blingtron-5000";
import brannBronzebeard from "./tier5/brann-bronzebeard";
import junkbot from "./tier5/junkbot";
import lightfangEnforcer from "./tier5/lightfang-enforcer";
import mogorTheCurseGolem from "./tier5/mogor-the-curse-golem";
import murozond from "./tier5/murozond";
import strongshellScavenger from "./tier5/strongshell-scavenger";
import foeReaper4000 from "./tier6/foe-reaper-4000";
import friggentNorthvalley from "./tier6/friggent-northvalley";
import gentleMegasaur from "./tier6/gentle-megasaur";
import ghastcoiler from "./tier6/ghastcoiler";
import kalecgosArcaneAspect from "./tier6/kalecgos-arcane-aspect";
import mamaBear from "./tier6/mama-bear";
import sneedOldShredder from "./tier6/sneed-old-shredder";
import terestianManferris from "./tier6/terestian-manferris";
import zixorProjectHope from "./tier6/zixor-project-hope";

export const MINIONS: Record<MinionCardId, MinionCard> = {
  [kaboomBot.id]: kaboomBot,
  [knifeJuggler.id]: knifeJuggler,
  [grombiTheRotunda.id]: grombiTheRotunda,
  [annoyoTron.id]: annoyoTron,
  [allleyCat.id]: allleyCat,
  [bristlebackBoys.id]: bristlebackBoys,
  [bloodsailPirate.id]: bloodsailPirate,
  [dragonspawnLieutenant.id]: dragonspawnLieutenant,
  [flameImp.id]: flameImp,
  [venomousCrasher.id]: venomousCrasher,
  [murlocTidecaller.id]: murlocTidecaller,
  [murlocTinyfin.id]: murlocTinyfin,
  [murlocTidehunter.id]: murlocTidehunter,
  [wrathWeaver.id]: wrathWeaver,
  [gnomaTinker.id]: gnomaTinker,
  [rockpoolHunter.id]: rockpoolHunter,
  [comboMinion.id]: comboMinion,
  [WindfuryMinion.id]: WindfuryMinion,
  [rushMinion.id]: rushMinion,
  [tauntMinion.id]: tauntMinion,
  [prisoner.id]: prisoner,
  [glyphGuardian.id]: glyphGuardian,
  [metaltoothLeaper.id]: metaltoothLeaper,
  [deflectoBot.id]: deflectoBot,
  [murlocWarleader.id]: murlocWarleader,
  [rebornMinion.id]: rebornMinion,
  [scavengingHyena.id]: scavengingHyena,
  [selflessHero.id]: selflessHero,
  [packLeader.id]: packLeader,
  [nightmareAmalgam.id]: nightmareAmalgam,
  [pogoHopper.id]: pogoHopper,
  [spawnOfNzoth.id]: spawnOfNzoth,
  [harvestGolem.id]: harvestGolem,
  [unstableGhoul.id]: unstableGhoul,
  [vulgarHomunculus.id]: vulgarHomunculus,
  [gazelle.id]: gazelle,
  [gromsch.id]: gromsch,
  [frostboundGolem.id]: frostboundGolem,
  [markku.id]: markku,
  [arcaneTinker.id]: arcaneTinker,
  [coldlightSeer.id]: coldlightSeer,
  [cobaltScalebane.id]: cobaltScalebane,
  [infestedWolf.id]: infestedWolf,
  [queenOfPain.id]: queenOfPain,
  [soulJuggler.id]: soulJuggler,
  [stonehillDefender.id]: stonehillDefender,
  [screwjankClunker.id]: screwjankClunker,
  [bloodsailCorsair.id]: bloodsailCorsair,
  [annihilanBattlemaster.id]: annihilanBattlemaster,
  [bolvarFireblood.id]: bolvarFireblood,
  [broodkinZealot.id]: broodkinZealot,
  [drakonidEnforcer.id]: drakonidEnforcer,
  [crystalweaver.id]: crystalweaver,
  [defenderOfArgus.id]: defenderOfArgus,
  [nagaSecretGuardian.id]: nagaSecretGuardian,
  [securityRover.id]: securityRover,
  [toxfin.id]: toxfin,
  [oldMurkEye.id]: oldMurkEye,
  [caveHydra.id]: caveHydra,
  [virmenSensei.id]: virmenSensei,
  [bigFernal.id]: bigFernal,
  [blingtron5000.id]: blingtron5000,
  [baronRivendare.id]: baronRivendare,
  [brannBronzebeard.id]: brannBronzebeard,
  [junkbot.id]: junkbot,
  [mogorTheCurseGolem.id]: mogorTheCurseGolem,
  [lightfangEnforcer.id]: lightfangEnforcer,
  [murozond.id]: murozond,
  [strongshellScavenger.id]: strongshellScavenger,
  [friggentNorthvalley.id]: friggentNorthvalley,
  [ghastcoiler.id]: ghastcoiler,
  [gentleMegasaur.id]: gentleMegasaur,
  [kalecgosArcaneAspect.id]: kalecgosArcaneAspect,
  [terestianManferris.id]: terestianManferris,
  [zixorProjectHope.id]: zixorProjectHope,
  [mamaBear.id]: mamaBear,
  [foeReaper4000.id]: foeReaper4000,
  [sneedOldShredder.id]: sneedOldShredder,
  [bountyMinion.id]: bountyMinion,
};

export function getMinion(id: MinionCardId): MinionCard {
  const card = MINIONS[id];
  if (!card) throw new Error(`Unknown minion: ${id}`);
  return card;
}
