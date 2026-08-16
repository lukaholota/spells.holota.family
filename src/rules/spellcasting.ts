import type { SpellcastingCharacter, SpellcastingClassLevel, SpellcastingKind } from "./types";

export type CasterLevel = { casterLevel: number; pactLevel: number };

export function calculateCasterLevel(character: SpellcastingCharacter): CasterLevel {
  const multiclasses = character.multiclasses ?? [];
  const mainLevel = clamp(toInteger(character.level, 1) - multiclasses.reduce((sum, multiclass) => sum + toInteger(multiclass.classLevel, 0), 0), 1, 20);
  const classLevels = [{ classLevel: mainLevel, characterClass: character.characterClass, subclass: character.subclass }, ...multiclasses];

  return classLevels.reduce(addCasterLevel, { casterLevel: 0, pactLevel: 0 });
}

export function getStandardSpellSlots(casterLevel: number, progression: Record<number, readonly number[]>): number[] {
  return [...(progression[clamp(casterLevel, 0, 20)] ?? [])];
}

export function getPactMagicSlots(pactLevel: number, progression: Record<number, { slots: number; level: number }>): { slots: number; level: number } | null {
  return progression[clamp(pactLevel, 0, 20)] ?? null;
}

export function normalizeSpellSlotArray(raw: unknown): number[] {
  const values = Array.isArray(raw) ? raw : [];
  return Array.from({ length: 9 }, (_, index) => normalizeSlotValue(values[index]));
}

export function getMaximumStandardSpellSlots(
  character: SpellcastingCharacter,
  progression: Record<number, readonly number[]>,
): number[] {
  const { casterLevel } = calculateCasterLevel(character);
  return normalizeSpellSlotArray(getStandardSpellSlots(casterLevel, progression));
}

export function getMaximumPactSpellSlots(
  character: SpellcastingCharacter,
  progression: Record<number, { slots: number; level: number }>,
): number {
  const { pactLevel } = calculateCasterLevel(character);
  return Math.max(0, Math.trunc(getPactMagicSlots(pactLevel, progression)?.slots ?? 0));
}

export function applySpellSlotMaximumDelta(
  current: readonly number[],
  beforeMaximum: readonly number[],
  afterMaximum: readonly number[],
): number[] {
  return Array.from({ length: 9 }, (_, index) => {
    const maximum = normalizeSlotValue(afterMaximum[index]);
    const next = normalizeSlotValue(current[index]) + normalizeSlotValue(afterMaximum[index]) - normalizeSlotValue(beforeMaximum[index]);
    return clamp(next, 0, maximum);
  });
}

function addCasterLevel(total: CasterLevel, classLevel: SpellcastingClassLevel): CasterLevel {
  const level = clamp(toInteger(classLevel.classLevel, 1), 1, 20);
  const kind = getEffectiveSpellcastingKind(classLevel);
  if (kind === "PACT") return { ...total, pactLevel: clamp(total.pactLevel + level, 0, 20) };
  if (classLevel.characterClass?.name?.startsWith("ARTIFICER")) return { ...total, casterLevel: clamp(total.casterLevel + Math.ceil(level / 2), 0, 20) };
  return { ...total, casterLevel: clamp(total.casterLevel + getCasterLevelContribution(level, kind), 0, 20) };
}

function getEffectiveSpellcastingKind(classLevel: SpellcastingClassLevel): SpellcastingKind {
  const classKind = classLevel.characterClass?.spellcastingType;
  if (classKind && classKind !== "NONE") return classKind;

  const subclassKind = classLevel.subclass?.spellcastingType;
  return subclassKind && subclassKind !== "NONE" ? subclassKind : "NONE";
}

function getCasterLevelContribution(level: number, kind: SpellcastingKind): number {
  if (kind === "FULL") return level;
  if (kind === "HALF") return Math.floor(level / 2);
  if (kind === "THIRD") return Math.floor(level / 3);
  return 0;
}

function toInteger(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeSlotValue(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0;
}
