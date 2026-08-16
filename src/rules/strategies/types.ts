import type { AbilityKey, AbilityScores, BackgroundASIChoice, ClassProgression } from "../types";

export type RulesetId = "RULES_2014" | "RULES_2024";

export type OriginFeatRequirement = {
  required: boolean;
  originFeatId: number | null;
};

export type RulesStrategy = {
  readonly ruleset: RulesetId;
  needsSubclassSelection(progression: ClassProgression, hasSubclass: boolean, level: number): boolean;
  isAbilityScoreIncreaseLevel(progression: ClassProgression, level: number): boolean;
  isEpicBoonLevel(progression: ClassProgression, level: number): boolean;
  applySpeciesASI(scores: AbilityScores, speciesASI?: unknown): AbilityScores;
  applyBackgroundASI(scores: AbilityScores, allowedAbilities: readonly AbilityKey[], choice: BackgroundASIChoice): AbilityScores;
  validateBackgroundASI(allowedAbilities: readonly AbilityKey[], choice: BackgroundASIChoice): boolean;
  getOriginFeatRequirement(background: { originFeatId?: number | null }): OriginFeatRequirement;
};

