export interface FeatureResourceClassLink {
  classId: number;
}

export interface FeatureResourceSubclassLink {
  subclass: {
    classId: number;
  };
}

export interface FeatureResourceFeatureLike {
  featureId?: number | null;
  usesCount: number | null;
  usesCountDependsOnProficiencyBonus: boolean;
  usesCountSpecial: unknown;
  classFeatures?: FeatureResourceClassLink[];
  subclassFeatures?: FeatureResourceSubclassLink[];
}

export interface FeatureResourcePersLike {
  level: number;
  classId?: number;
  class?: {
    classId: number;
  };
  multiclasses: Array<{
    classId: number;
    classLevel: number;
  }>;
  [key: string]: unknown;
}

interface FeatureUsesByLevelEntry {
  lvl?: unknown;
  uses?: unknown;
}

interface FeatureUsesFormula {
  equalsToClassLevel?: boolean;
  type?: unknown;
  operation?: unknown;
  minimum?: unknown;
  group?: unknown;
  base?: unknown;
  stat?: unknown;
  multiplier?: unknown;
}

function isFeatureUsesFormula(value: unknown): value is FeatureUsesFormula {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function getProficiencyBonus(level: number): number {
  if (!Number.isFinite(level) || level <= 0) return 2;
  return 2 + Math.floor((level - 1) / 4);
}

function getMainClassId(pers: FeatureResourcePersLike): number | null {
  if (typeof pers.classId === "number") return pers.classId;
  if (typeof pers.class?.classId === "number") return pers.class.classId;
  return null;
}

function getClassIdsForFeature(feature: FeatureResourceFeatureLike): Set<number> {
  return new Set<number>([
    ...(feature.classFeatures ?? []).map((cf) => cf.classId),
    ...(feature.subclassFeatures ?? []).map((sf) => sf.subclass.classId),
  ]);
}

export function getClassLevelForFeature(
  pers: FeatureResourcePersLike,
  feature: FeatureResourceFeatureLike
): number {
  const classIdsWithFeature = getClassIdsForFeature(feature);
  const mainClassId = getMainClassId(pers);

  if (mainClassId !== null && classIdsWithFeature.has(mainClassId)) {
    const multiclassSum = pers.multiclasses.reduce((acc, current) => acc + (Number(current.classLevel) || 0), 0);
    return Math.max(1, (Number(pers.level) || 1) - multiclassSum);
  }

  const mc = pers.multiclasses.find((entry) => classIdsWithFeature.has(entry.classId));
  if (mc) return Number(mc.classLevel) || 1;

  return Number(pers.level) || 1;
}

function getAbilityModFromPers(pers: FeatureResourcePersLike, stat: string): number {
  const key = String(stat || "").toLowerCase();
  const score = pers[key];
  if (typeof score !== "number") return 0;
  return Math.floor((score - 10) / 2);
}

export function calculateMaxUsesForFeature(
  pers: FeatureResourcePersLike,
  feature: FeatureResourceFeatureLike
): number | null {
  const special = feature.usesCountSpecial as
    | FeatureUsesByLevelEntry[]
    | FeatureUsesFormula
    | null;

  if (Array.isArray(special)) {
    const classLevel = getClassLevelForFeature(pers, feature);
    const match = [...special]
      .filter((entry): entry is FeatureUsesByLevelEntry & { lvl: number } => typeof entry?.lvl === "number" && classLevel >= entry.lvl)
      .sort((a, b) => b.lvl - a.lvl)[0];

    if (match && typeof match.uses === "number") return match.uses;
  }

  if (isFeatureUsesFormula(special) && special.equalsToClassLevel === true) {
    return getClassLevelForFeature(pers, feature);
  }

  if (isFeatureUsesFormula(special) && special.type === "FORMULA") {
    const operation = String(special.operation || "ADD").toUpperCase();
    const minimum = typeof special.minimum === "number" ? special.minimum : null;

    if (special.group === "STAT_BASED") {
      const base = Number(special.base ?? 0);
      const mod = getAbilityModFromPers(pers, String(special.stat ?? ""));
      const value = operation === "MULTIPLY" ? base * mod : base + mod;
      return minimum !== null ? Math.max(minimum, value) : value;
    }

    if (special.group === "LEVEL_BASED") {
      const classLevel = getClassLevelForFeature(pers, feature);
      const multiplier = Number(special.multiplier ?? 1);
      const base = Number(special.base ?? 0);
      const value = operation === "MULTIPLY" ? classLevel * multiplier : base + classLevel;
      return minimum !== null ? Math.max(minimum, value) : value;
    }

    if (special.group === "PROFICIENCY_BONUS") {
      const pb = getProficiencyBonus(Number(pers.level) || 1);
      const multiplier = Number(special.multiplier ?? 1);
      const base = Number(special.base ?? 0);
      const value = operation === "MULTIPLY" ? pb * multiplier : base + pb;
      return minimum !== null ? Math.max(minimum, value) : value;
    }
  }

  if (feature.usesCountDependsOnProficiencyBonus) {
    return getProficiencyBonus(Number(pers.level) || 1);
  }

  return typeof feature.usesCount === "number" ? feature.usesCount : null;
}