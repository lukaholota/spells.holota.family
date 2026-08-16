import { prisma } from "@/lib/prisma";
import { FeatPrisma } from "@/lib/types/model-types";
import { unstable_cache } from "next/cache";
import type { Ruleset } from "@prisma/client";

// KR6.3: hardcoded until the edition switch (O6 Крок 5) lets pers.ruleset drive this.
const ACTIVE_RULESET: Ruleset = "RULES_2014";

const getAllClassesCached = unstable_cache(
  async () =>
    prisma.class.findMany({
      where: { ruleset: ACTIVE_RULESET },
      include: {
        subclasses: { include: { features: { include: { feature: true } }, subclassChoiceOptions: { include: { choiceOption: { include: { features: { include: { feature: true } } } } } } } },
        classChoiceOptions: { include: { choiceOption: { include: { features: { include: { feature: true } } } } } },
        classOptionalFeatures: { include: { feature: true, replacesFeatures: { include: { replacedFeature: true } }, appearsOnlyIfChoicesTaken: true } },
        features: { include: { feature: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { classId: "asc" }],
    }),
  ["levelup:classes:v5"],
  { revalidate: 60 * 60 * 24 },
);

const getAllFeatsCached = unstable_cache(
  async () => prisma.feat.findMany({
    where: { ruleset: ACTIVE_RULESET },
    include: { grantsFeature: true, featChoiceOptions: { include: { choiceOption: { include: { features: { include: { feature: true } } } } } } },
    orderBy: [{ name: "asc" }],
  }) as unknown as Promise<FeatPrisma[]>,
  ["levelup:feats:v5"],
  { revalidate: 60 * 60 * 24 },
);

const getAllInfusionsCached = unstable_cache(
  async () => prisma.infusion.findMany({
    where: { ruleset: ACTIVE_RULESET },
    include: {
      feature: { select: { name: true, description: true, shortDescription: true } },
      replicatedMagicItem: { select: { magicItemId: true, name: true, engName: true, itemType: true, rarity: true, requiresAttunement: true, description: true, shortDescription: true, bonusToAC: true, bonusToRangedDamage: true, bonusToSavingThrows: true, noArmorOrShieldForACBonus: true, givesSpells: { select: { spellId: true, name: true, engName: true, level: true } } } },
    },
    orderBy: [{ minArtificerLevel: "asc" }, { name: "asc" }],
  }),
  ["levelup:infusions:v4"],
  { revalidate: 60 * 60 * 24 },
);

export async function loadLevelUpBaseContent(persId: number) {
  const pers = await prisma.pers.findUnique({
    where: { persId },
    include: {
      class: true,
      subclass: true,
      choiceOptions: true,
      features: { select: { featureId: true } },
      skills: { select: { name: true, proficiencyType: true } },
      persInfusions: { select: { infusionId: true } },
      multiclasses: { include: { class: true, subclass: true } },
      race: true, subrace: true, feats: { include: { feat: true } },
    },
  });
  const [classes, feats, infusions] = await Promise.all([getAllClassesCached(), getAllFeatsCached(), getAllInfusionsCached()]);
  return { pers, classes, feats, infusions };
}

export async function loadLevelUpChoiceContent(choiceOptionIds: readonly number[]) {
  const selectedIds = uniquePositiveIds(choiceOptionIds);
  if (!selectedIds.length) return { choiceOptions: [], choiceOptionFeatures: [] };

  const [choiceOptions, choiceOptionFeatures] = await Promise.all([
    prisma.choiceOption.findMany({
      where: { choiceOptionId: { in: selectedIds } },
      select: {
        choiceOptionId: true,
        groupName: true,
        prerequisites: true,
        optionNameEng: true,
        effectKind: true,
        effectSkill: true,
        effectAbility: true,
        effectAmount: true,
      },
    }),
    prisma.choiceOptionFeature.findMany({
      where: { choiceOptionId: { in: selectedIds } },
      select: { choiceOptionId: true, featureId: true },
    }),
  ]);

  return { choiceOptions, choiceOptionFeatures };
}

export async function loadLevelUpFeatureEffects(featureIds: readonly number[]) {
  const selectedIds = uniquePositiveIds(featureIds);
  if (!selectedIds.length) return [];

  return prisma.feature.findMany({
    where: { featureId: { in: selectedIds } },
    select: {
      featureId: true,
      name: true,
      skillProficiencies: true,
      armorProficiencies: true,
      weaponProficiencies: true,
      weaponProficienciesSpecial: true,
      toolProficiencies: true,
      givesLanguages: true,
      skillExpertises: true,
    },
  });
}

export async function loadLevelUpOptionalFeatures(optionalFeatureIds: readonly number[]) {
  const selectedIds = uniquePositiveIds(optionalFeatureIds);
  if (!selectedIds.length) return [];

  return prisma.classOptionalFeature.findMany({
    where: { optionalFeatureId: { in: selectedIds } },
    include: { replacesFeatures: true },
  });
}

function uniquePositiveIds(ids: readonly number[]): number[] {
  return Array.from(new Set(ids)).filter((id) => Number.isFinite(id) && id > 0);
}
