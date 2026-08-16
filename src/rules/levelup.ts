import type { AbilityScores, SpellcastingCharacter } from "./types";
import {
  applySpellSlotMaximumDelta,
  getMaximumPactSpellSlots,
  getMaximumStandardSpellSlots,
  normalizeSpellSlotArray,
} from "./spellcasting";

export type LevelUpState = {
  level: number;
  scores: AbilityScores;
  maxHp: number;
  currentHp: number;
  currentSpellSlots: unknown;
  currentPactSlots: number;
  spellcasting: SpellcastingCharacter;
  featureIds: readonly number[];
  proficientSkills: readonly string[];
  expertiseSkills: readonly string[];
  additionalSaveProficiencies: readonly string[];
};

export type LevelUpChoices = {
  scores: AbilityScores;
  hitDieIncrease: number;
  hasTough: boolean;
  takesTough: boolean;
  spellcastingAfter: SpellcastingCharacter;
  featureIdsToAdd?: readonly number[];
  featureIdsToRemove?: readonly number[];
  proficientSkillsToAdd?: readonly string[];
  expertiseSkillsToAdd?: readonly string[];
  saveProficienciesToAdd?: readonly string[];
};

export type LevelUpContent = {
  standardProgression: Record<number, readonly number[]>;
  pactProgression: Record<number, { slots: number; level: number }>;
};

export function applyLevelUp(before: LevelUpState, choices: LevelUpChoices, content: LevelUpContent): LevelUpState {
  const nextLevel = before.level + 1;
  const scores = clampScores(choices.scores);
  const conModifierDelta = abilityModifier(scores.CON) - abilityModifier(before.scores.CON);
  const toughBonus = choices.takesTough ? 2 * nextLevel : choices.hasTough ? 2 : 0;
  const hitPointDelta = Math.max(0, toInteger(choices.hitDieIncrease)) + abilityModifier(scores.CON) + toughBonus + conModifierDelta * before.level;
  const beforeStandardMaximum = getMaximumStandardSpellSlots(before.spellcasting, content.standardProgression);
  const afterStandardMaximum = getMaximumStandardSpellSlots(choices.spellcastingAfter, content.standardProgression);
  const beforePactMaximum = getMaximumPactSpellSlots(before.spellcasting, content.pactProgression);
  const afterPactMaximum = getMaximumPactSpellSlots(choices.spellcastingAfter, content.pactProgression);
  const currentPactSlots = Math.max(0, toInteger(before.currentPactSlots));

  return {
    level: nextLevel,
    scores,
    maxHp: before.maxHp + hitPointDelta,
    currentHp: before.currentHp + hitPointDelta,
    currentSpellSlots: applySpellSlotMaximumDelta(normalizeSpellSlotArray(before.currentSpellSlots), beforeStandardMaximum, afterStandardMaximum),
    currentPactSlots: Math.max(0, Math.min(afterPactMaximum, currentPactSlots + afterPactMaximum - beforePactMaximum)),
    spellcasting: choices.spellcastingAfter,
    featureIds: uniqueFiniteIntegers([...before.featureIds, ...(choices.featureIdsToAdd ?? [])])
      .filter((featureId) => !choices.featureIdsToRemove?.includes(featureId)),
    proficientSkills: uniqueStrings([...before.proficientSkills, ...(choices.proficientSkillsToAdd ?? []), ...(choices.expertiseSkillsToAdd ?? [])]),
    expertiseSkills: uniqueStrings([...before.expertiseSkills, ...(choices.expertiseSkillsToAdd ?? [])]),
    additionalSaveProficiencies: uniqueStrings([...before.additionalSaveProficiencies, ...(choices.saveProficienciesToAdd ?? [])]),
  };
}

export function mergeUniqueLines(base: unknown, extras: readonly string[]): string {
  const lines = typeof base === "string" ? base.split(/\r?\n/) : [];
  return Array.from(new Set([...lines, ...extras].map((line) => line.trim()).filter(Boolean))).join("\n");
}

function clampScores(scores: AbilityScores): AbilityScores {
  return {
    STR: Math.min(20, toInteger(scores.STR)),
    DEX: Math.min(20, toInteger(scores.DEX)),
    CON: Math.min(20, toInteger(scores.CON)),
    INT: Math.min(20, toInteger(scores.INT)),
    WIS: Math.min(20, toInteger(scores.WIS)),
    CHA: Math.min(20, toInteger(scores.CHA)),
  };
}

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function toInteger(value: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}

function uniqueFiniteIntegers(values: readonly number[]): number[] {
  return Array.from(new Set(values.filter(Number.isFinite).map(Math.trunc)));
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}
