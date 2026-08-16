export function calculateInitialHitPoints(hitDie: number, constitutionModifier: number): number {
  return hitDie + constitutionModifier;
}

export function calculateAverageHitPointIncrease(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1;
}

export function calculateLevelUpHitPoints(input: {
  currentHitPoints: number;
  hitDieIncrease: number;
  constitutionModifier: number;
  toughBonus: number;
  retroactiveConstitutionBonus: number;
}): number {
  return input.currentHitPoints + input.hitDieIncrease + input.constitutionModifier + input.toughBonus + input.retroactiveConstitutionBonus;
}
