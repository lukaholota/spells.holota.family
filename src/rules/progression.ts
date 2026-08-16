import type { ClassProgression } from "./types";

export function needsSubclassSelection(progression: ClassProgression, hasSubclass: boolean, level: number): boolean {
  return !hasSubclass && level >= (progression.subclassLevel ?? 3);
}

export function isAbilityScoreIncreaseLevel(progression: ClassProgression, level: number): boolean {
  return progression.abilityScoreUpLevels?.includes(level) ?? false;
}
