import type { AbilityKey, ArmorAbilityBonusType, ArmorClassInput } from "./types";

export function calculateArmorClass(input: ArmorClassInput): number {
  const baseArmorClass = calculateBaseArmorClass(input);
  const shieldBonus = input.wearsShield ? 2 + input.shieldArmorClassBonus : 0;

  return baseArmorClass
    + calculateFiniteBonus(input.raceStaticArmorClassBonus)
    + shieldBonus
    + input.simpleArmorClassBonus
    + input.featureArmorClassBonus
    + input.magicItemArmorClassBonus;
}

function calculateBaseArmorClass(input: ArmorClassInput): number {
  if (Number.isFinite(input.baseArmorClassOverride)) return Math.trunc(input.baseArmorClassOverride as number);
  if (!input.equippedArmor) return 10 + input.dexterityModifier;

  const armor = input.equippedArmor;
  const bonusType = resolveArmorAbilityBonusType(armor);
  const abilities = resolveArmorAbilities(armor, bonusType);
  const armorBase = armor.characterOverrideBaseArmorClass ?? armor.baseArmorClass;
  return armorBase + calculateArmorAbilityBonus(input.abilityModifiers, bonusType, abilities) + (armor.miscArmorClassBonus ?? 0);
}

function resolveArmorAbilityBonusType(armor: NonNullable<ArmorClassInput["equippedArmor"]>): ArmorAbilityBonusType {
  if (armor.armorAbilityBonusType && armor.characterAbilityBonusType === "FULL" && !armor.characterAbilityBonuses?.length) {
    return armor.armorAbilityBonusType;
  }
  return armor.characterAbilityBonusType ?? armor.armorAbilityBonusType ?? "FULL";
}

function resolveArmorAbilities(armor: NonNullable<ArmorClassInput["equippedArmor"]>, bonusType: ArmorAbilityBonusType): AbilityKey[] {
  if (bonusType === "NONE") return armor.characterAbilityBonuses ?? [];
  return armor.characterAbilityBonuses?.length ? armor.characterAbilityBonuses : armor.armorAbilityBonuses ?? [];
}

function calculateArmorAbilityBonus(
  abilityModifiers: Partial<Record<AbilityKey, number>>,
  bonusType: ArmorAbilityBonusType,
  abilities: AbilityKey[],
): number {
  if (bonusType === "NONE") return 0;
  return [...new Set(abilities)].reduce((sum, ability) => {
    const modifier = abilityModifiers[ability] ?? 0;
    return sum + (bonusType === "MAX2" && ability === "DEX" ? Math.min(modifier, 2) : modifier);
  }, 0);
}

function calculateFiniteBonus(bonus: number | null | undefined): number {
  return typeof bonus === "number" && Number.isFinite(bonus) ? Math.trunc(bonus) : 0;
}
