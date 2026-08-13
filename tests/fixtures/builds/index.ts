import { build as humanFighterSoldier } from "./human-fighter-soldier";
import { build as fighterFightingStyle } from "./fighter-fighting-style";
import { build as barbarianUnarmoredDefense } from "./barbarian-unarmored-defense";
import { build as monkUnarmoredDefense } from "./monk-unarmored-defense";
import { build as bardFullCaster } from "./bard-full-caster";
import { build as clericDivineDomain } from "./cleric-divine-domain";
import { build as druidNoSubclass } from "./druid-no-subclass";
import { build as druidEarlySubclassBug } from "./druid-early-subclass-BUG";
import { build as rangerHalfCaster } from "./ranger-half-caster";
import { build as rogueExpertise } from "./rogue-expertise";
import { build as sorcererSorcerousOrigin } from "./sorcerer-sorcerous-origin";
import { build as warlockPactPatron } from "./warlock-pact-patron";
import { build as wizardNoSubclass } from "./wizard-no-subclass";
import { build as artificerBaseline } from "./artificer-baseline";
import { build as paladinBaseline } from "./paladin-baseline";
import { build as variantHumanTough } from "./variant-human-tough";
import { build as variantHumanSkillExpert } from "./variant-human-skill-expert";
import { build as halfElfRaceChoices } from "./half-elf-race-choices";
import { build as tieflingFiendVariant } from "./tiefling-fiend-variant";
import { build as dwarfTashaFlexibleAsi } from "./dwarf-tasha-flexible-asi";
import { build as elfEladrinMpmmSubrace } from "./elf-eladrin-mpmm-subrace";
import { build as elfHighSubrace } from "./elf-high-subrace";
import { build as warforgedBaseline } from "./warforged-baseline";
import { build as tortleBaseline } from "./tortle-baseline";
import { build as backgroundRewardedLucky } from "./background-rewarded-lucky";
import { build as backgroundFeatMismatchBug } from "./background-feat-mismatch-BUG";
import { build as simpleAsiSystem } from "./simple-asi-system";
import { build as customAsiSystem } from "./custom-asi-system";
import { build as fightingInitiateFeat } from "./fighting-initiate-feat";
import { build as prodigyFeat } from "./prodigy-feat";
import { build as longestPath } from "./longest-path";
import { build as fighterEquipmentChoices } from "./fighter-equipment-choices";
import { build as fighterOptionalFeatureEarlyBug } from "./fighter-optional-feature-early-BUG";
import { build as backgroundRewardedSkilled } from "./background-rewarded-skilled";
import { build as athleteFeatBug } from "./athlete-feat-BUG";
import type { Build } from "./types";

export const builds: Build[] = [
  humanFighterSoldier,
  fighterFightingStyle,
  barbarianUnarmoredDefense,
  monkUnarmoredDefense,
  bardFullCaster,
  clericDivineDomain,
  druidNoSubclass,
  druidEarlySubclassBug,
  rangerHalfCaster,
  rogueExpertise,
  sorcererSorcerousOrigin,
  warlockPactPatron,
  wizardNoSubclass,
  artificerBaseline,
  paladinBaseline,
  variantHumanTough,
  variantHumanSkillExpert,
  halfElfRaceChoices,
  tieflingFiendVariant,
  dwarfTashaFlexibleAsi,
  elfEladrinMpmmSubrace,
  elfHighSubrace,
  warforgedBaseline,
  tortleBaseline,
  backgroundRewardedLucky,
  backgroundFeatMismatchBug,
  simpleAsiSystem,
  customAsiSystem,
  fightingInitiateFeat,
  prodigyFeat,
  longestPath,
  fighterEquipmentChoices,
  fighterOptionalFeatureEarlyBug,
  backgroundRewardedSkilled,
  athleteFeatBug,
];
