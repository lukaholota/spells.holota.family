import { prisma } from "@/lib/prisma";
import type { PersFormData } from "@/lib/zod/schemas/persCreateSchema";
import type { Ruleset } from "@prisma/client";

// KR6.3: hardcoded until the edition switch (O6 Крок 5) lets pers.ruleset drive this.
const ACTIVE_RULESET: Ruleset = "RULES_2014";

export function loadCharacterCreatorOptions() {
  return Promise.all([
    prisma.race.findMany({ where: { ruleset: ACTIVE_RULESET }, include: { raceChoiceOptions: { include: { traits: { include: { feature: true } } } }, subraces: { include: { traits: { include: { feature: true } } } }, raceVariants: { include: { traits: { include: { feature: true } } } }, traits: { include: { feature: true } } }, orderBy: [{ sortOrder: "asc" }, { raceId: "asc" }] }),
    prisma.class.findMany({ where: { ruleset: ACTIVE_RULESET }, include: { subclasses: { include: { features: { include: { feature: true } }, subclassChoiceOptions: { include: { choiceOption: { include: { features: { include: { feature: true } } } } } }, expandedSpells: true } }, startingEquipmentOption: { include: { equipmentPack: true, weapon: true, armor: true } }, classChoiceOptions: { include: { choiceOption: { include: { features: { include: { feature: true } } } } } }, classOptionalFeatures: { include: { feature: true, replacesFeatures: { include: { replacedFeature: true } }, appearsOnlyIfChoicesTaken: true } }, features: { include: { feature: true } } }, orderBy: [{ sortOrder: "asc" }, { classId: "asc" }] }),
    prisma.background.findMany({ where: { ruleset: ACTIVE_RULESET }, include: { gainsFeats: true } }),
    prisma.weapon.findMany({ where: { ruleset: ACTIVE_RULESET }, orderBy: [{ sortOrder: "asc" }, { weaponId: "asc" }] }),
    prisma.feat.findMany({ where: { ruleset: ACTIVE_RULESET }, include: { grantsFeature: true, featChoiceOptions: { include: { choiceOption: { include: { features: { include: { feature: true } } } } } } }, orderBy: [{ name: "asc" }] }),
  ]);
}

export async function loadCreationContent(data: PersFormData) {
  const [race, variant, subrace, background, characterClass, subclass, feat, backgroundFeat] = await Promise.all([
    prisma.race.findUnique({ where: { raceId: data.raceId } }),
    data.raceVariantId ? prisma.raceVariant.findUnique({ where: { raceVariantId: data.raceVariantId } }) : null,
    data.subraceId ? prisma.subrace.findUnique({ where: { subraceId: data.subraceId } }) : null,
    prisma.background.findUnique({ where: { backgroundId: data.backgroundId } }),
    prisma.class.findUnique({
      where: { classId: data.classId },
      select: {
        name: true,
        spellcastingType: true,
        savingThrows: true,
        armorProficiencies: true,
        weaponProficiencies: true,
        weaponProficienciesSpecial: true,
        toolProficiencies: true,
        toolToChooseCount: true,
        languages: true,
        languagesToChooseCount: true,
        hitDie: true,
      },
    }),
    data.subclassId
      ? prisma.subclass.findUnique({
          where: { subclassId: data.subclassId },
          select: {
            subclassId: true,
            classId: true,
            armorProficiencies: true,
            weaponProficiencies: true,
          },
        })
      : null,
    data.featId
      ? prisma.feat.findUnique({
          where: { featId: data.featId },
          include: { featChoiceOptions: { include: { choiceOption: true } } },
        })
      : null,
    data.backgroundFeatId
      ? prisma.feat.findUnique({
          where: { featId: data.backgroundFeatId },
          include: { featChoiceOptions: { include: { choiceOption: true } } },
        })
      : null,
  ] as const);

  const acceptedOptionalFeatureIds = Object.entries(data.classOptionalFeatureSelections ?? {})
    .filter(([, accepted]) => accepted === true)
    .map(([id]) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
  const selectedChoiceOptionIds = uniquePositiveIds([
    ...Object.values(data.classChoiceSelections),
    ...Object.values(data.subclassChoiceSelections),
  ] as const);
  const selectedEquipmentOptionIds = uniquePositiveIds(
    Object.values(data.equipmentSchema?.choiceGroupToId ?? {}).flat(),
  );
  const raceChoiceOptionIds = uniquePositiveIds(Object.values(data.raceChoiceSelections ?? {}));
  const equipmentOptions = selectedEquipmentOptionIds.length
    ? await prisma.classStartingEquipmentOption.findMany({
        where: { optionId: { in: selectedEquipmentOptionIds } },
        include: { equipmentPack: true },
      })
    : [];

  const [classFeatures, raceFeatures, subraceFeatures, subclassFeatures, optionalFeatures, selectedChoiceOptions, choiceOptionFeatures, raceChoiceOptions, raceChoiceTraits] = await Promise.all([
    prisma.classFeature.findMany({ where: { classId: data.classId, levelGranted: 1 }, select: { featureId: true } }),
    prisma.raceTrait.findMany({ where: { raceId: data.raceId }, select: { featureId: true } }),
    data.subraceId
      ? prisma.subraceTrait.findMany({ where: { subraceId: data.subraceId }, select: { featureId: true } })
      : [],
    data.subclassId
      ? prisma.subclassFeature.findMany({ where: { subclassId: data.subclassId, levelGranted: 1 }, select: { featureId: true } })
      : [],
    acceptedOptionalFeatureIds.length
      ? prisma.classOptionalFeature.findMany({
          where: { optionalFeatureId: { in: acceptedOptionalFeatureIds } },
          include: { replacesFeatures: true },
        })
      : [],
    selectedChoiceOptionIds.length
      ? prisma.choiceOption.findMany({
          where: { choiceOptionId: { in: selectedChoiceOptionIds } },
          select: { choiceOptionId: true, effectKind: true, effectSkill: true },
        })
      : [],
    selectedChoiceOptionIds.length
      ? prisma.choiceOptionFeature.findMany({
          where: { choiceOptionId: { in: selectedChoiceOptionIds } },
          select: { featureId: true },
        })
      : [],
    raceChoiceOptionIds.length
      ? prisma.raceChoiceOption.findMany({ where: { optionId: { in: raceChoiceOptionIds } } })
      : [],
    raceChoiceOptionIds.length
      ? prisma.raceChoiceOptionTrait.findMany({
          where: { optionId: { in: raceChoiceOptionIds } },
          select: { featureId: true },
        })
      : [],
  ] as const);

  const initialFeatureIds = [
    ...classFeatures.map((feature) => feature.featureId),
    ...raceFeatures.map((feature) => feature.featureId),
    ...subraceFeatures.map((feature) => feature.featureId),
    ...subclassFeatures.map((feature) => feature.featureId),
  ].filter((id) => Number.isFinite(id));
  const optionalGrantedFeatureIds = optionalFeatures
    .map((feature) => feature.featureId)
    .filter((id): id is number => typeof id === "number" && Number.isFinite(id) && id > 0);
  const optionalReplacedFeatureIds = uniquePositiveIds(
    optionalFeatures.flatMap((feature) => feature.replacesFeatures.map((replacement) => replacement.replacedFeatureId)),
  );
  const choiceOptionFeatureIds = choiceOptionFeatures
    .map((feature) => feature.featureId)
    .filter((id) => Number.isFinite(id) && id > 0);
  const raceChoiceTraitFeatureIds = raceChoiceTraits
    .map((feature) => feature.featureId)
    .filter((id) => Number.isFinite(id) && id > 0);
  const allFeatureIds = uniquePositiveIds([
    ...initialFeatureIds,
    ...optionalGrantedFeatureIds,
    ...choiceOptionFeatureIds,
    ...raceChoiceTraitFeatureIds,
  ]);
  const features = allFeatureIds.length
    ? await prisma.feature.findMany({
        where: { featureId: { in: allFeatureIds } },
        select: {
          featureId: true,
          skillProficiencies: true,
          armorProficiencies: true,
          weaponProficiencies: true,
          weaponProficienciesSpecial: true,
          toolProficiencies: true,
          skillExpertises: true,
          givesLanguages: true,
        },
      })
    : [];

  return {
    race,
    variant,
    subrace,
    background,
    characterClass,
    subclass,
    feat,
    backgroundFeat,
    acceptedOptionalFeatureIds,
    selectedChoiceOptionIds,
    selectedEquipmentOptionIds,
    raceChoiceOptionIds,
    initialFeatureIds,
    optionalGrantedFeatureIds,
    optionalReplacedFeatureIds,
    choiceOptionFeatureIds,
    raceChoiceTraitFeatureIds,
    equipmentOptions,
    selectedChoiceOptions,
    raceChoiceOptions,
    features,
  };
}

function uniquePositiveIds(values: Array<number | number[] | undefined>): number[] {
  return Array.from(new Set(values.flatMap((value) => (Array.isArray(value) ? value : [value]))))
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0);
}
