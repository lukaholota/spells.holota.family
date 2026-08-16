"use server";

import { prisma } from "@/lib/prisma";
import { fullCharacterSchema, PersFormData } from "@/lib/zod/schemas/persCreateSchema";
import { auth } from "@/lib/auth";
import { Ability, ArmorCategory, ArmorType, Feats, Language, SkillProficiencyType, Skills, ToolCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  formatArmorProficiencies,
  formatToolProficiencies,
  formatWeaponProficiencies,
  translateValue,
} from "@/lib/components/characterCreator/infoUtils";
import { extractExpertisesFromChoiceOption, extractSkillsFromChoiceOption } from "@/lib/logic/characterUtils";
import { SPELL_SLOT_PROGRESSION } from "@/lib/refs/static";
import { isRecord } from "@/rules/abilities";
import { isRules2024Allowed } from "@/rules/access";
import { buildInitialCharacterState } from "@/rules/character-creation";
import type { CreationFeatAbilityInput } from "@/rules/character-creation";
import type { AbilityKey, BackgroundASIChoice } from "@/rules/types";
import type { RulesetId } from "@/rules/strategies/types";
import type { Ruleset } from "@prisma/client";
import { loadCreationContent } from "@/server/db/creation-content";
import { findUserByEmail } from "@/server/db/users";
import { parseEnumArray, parseJsonRecord, parseOptionalNumber, parseStringArray, parseWeaponProficiencies, parseWeaponProficienciesSpecial } from "@/server/db/json";

export type CreateCharacterResult =
  | { error: string; details?: unknown; success?: undefined; persId?: undefined }
  | { error?: undefined; details?: undefined; success: true; persId: number };
type RequiredUser = { value: { id: number; email: string | null } } | { error: string };
type ParsedCreateInput = { value: PersFormData } | { error: string; details: unknown };
type LoadedCreationContent = Awaited<ReturnType<typeof loadCreationContent>>;
type RequiredCreationContent = LoadedCreationContent & {
  race: NonNullable<LoadedCreationContent["race"]>;
  background: NonNullable<LoadedCreationContent["background"]>;
  characterClass: NonNullable<LoadedCreationContent["characterClass"]>;
};
type CharacterBuild = {
  validData: PersFormData;
  content: RequiredCreationContent;
  scores: ReturnType<typeof buildInitialCharacterState>["scores"];
  savingThrows: Ability[];
  currentSpellSlots: number[];
  currentPactSlots: number;
  maxHp: number;
};
type CharacterBuildResult = CharacterBuild | { error: string };

export async function createCharacter(input: PersFormData): Promise<CreateCharacterResult> {
  const user = await requireUser();
  if ("error" in user) return { error: user.error };

  const data = parseCreateInput(input);
  if ("error" in data) return { error: data.error, details: data.details };

  if (data.value.ruleset === "RULES_2024" && !isRules2024Allowed(user.value)) {
    return { error: "Правила 2024 наразі доступні лише для адміністратора/власника." };
  }

  const content = await loadCreationContent(data.value);
  const character = buildCharacter(data.value, content);
  if ("error" in character) return character;
  return persistCharacter(user.value, character);
}

async function requireUser(): Promise<RequiredUser> {
  const session = await auth();

  if (!session || !session.user || !session.user.email) {
    return { error: "Unauthorized" };
  }

  const user = await findUserByEmail(session.user.email);

  if (!user) {
    return { error: "User not found" };
  }

  return { value: { id: user.id, email: user.email } };
}

function parseCreateInput(input: PersFormData): ParsedCreateInput {
  const validation = fullCharacterSchema.safeParse(input);

  if (!validation.success) {
    return { error: "Validation failed", details: validation.error.flatten() };
  }

  return { value: validation.data };
}

type LoadedCreationFeat = NonNullable<LoadedCreationContent["feat"]>;

function toCreationFeatInput(
  feat: LoadedCreationFeat | null,
  selections: Record<string, number | number[]>,
): CreationFeatAbilityInput[] {
  if (!feat) return [];
  return [{
    grantedASI: feat.grantedASI,
    selectedChoiceOptionIds: Object.values(selections),
    choiceOptions: feat.featChoiceOptions.flatMap((entry) => entry.choiceOption ? [{
      choiceOptionId: entry.choiceOptionId,
      optionNameEng: entry.choiceOption.optionNameEng,
      effectKind: entry.choiceOption.effectKind,
      effectAbility: entry.choiceOption.effectAbility,
      effectAmount: entry.choiceOption.effectAmount,
    }] : []),
    resilient: feat.name === Feats.RESILIENT,
  }];
}

function buildCharacter(
  validData: PersFormData,
  content: LoadedCreationContent,
): CharacterBuildResult {
  const { race, variant, subrace, background, characterClass, subclass, feat, backgroundFeat } = content;
  if (!race) return { error: "Race not found" };
  if (!background) return { error: "Background not found" };
  if (!characterClass) return { error: "Class not found" };
  if (subclass && subclass.classId !== validData.classId) return { error: "Підклас не належить обраному класу" };

  const ruleset = (validData.ruleset ?? characterClass.ruleset ?? "RULES_2014") as RulesetId;

  const initialState = buildInitialCharacterState({
    ruleset,
    asiSystem: validData.asiSystem,
    pointBuy: validData.asi,
    simple: validData.simpleAsi,
    custom: validData.customAsi,
    isDefaultASI: validData.isDefaultASI,
    raceASI: race.ASI,
    variantASI: variant?.overridesRaceASI,
    subraceASI: subrace?.additionalASI,
    subraceReplacesASI: subrace?.replacesASI ?? false,
    racialChoices: validData.racialBonusChoiceSchema,
    raceChoiceAbilityBonuses: content.raceChoiceOptions.map((option) => ({ ASI: option.ASI })),
    backgroundAbilityOptions: background.abilityOptions as AbilityKey[] | undefined,
    backgroundAsiChoice: validData.backgroundAsiChoice as BackgroundASIChoice | undefined,
    feats: [
      ...toCreationFeatInput(feat, validData.featChoiceSelections),
      ...toCreationFeatInput(backgroundFeat, validData.backgroundFeatChoiceSelections),
    ],
    className: characterClass.name,
    spellcastingType: characterClass.spellcastingType,
    savingThrows: characterClass.savingThrows ?? [],
    hitDie: characterClass.hitDie,
    hasTough: feat?.name === Feats.TOUGH || backgroundFeat?.name === Feats.TOUGH,
    standardProgression: SPELL_SLOT_PROGRESSION.FULL,
    pactProgression: SPELL_SLOT_PROGRESSION.PACT,
  });

  return {
    validData,
    content: { ...content, race, background, characterClass },
    scores: initialState.scores,
    savingThrows: initialState.savingThrows.filter(isAbility),
    currentSpellSlots: initialState.currentSpellSlots,
    currentPactSlots: initialState.currentPactSlots,
    maxHp: initialState.maxHp,
  };
}

function isAbility(value: string): value is Ability {
  return Object.values(Ability).includes(value as Ability);
}

async function persistCharacter(
  user: { id: number },
  character: CharacterBuild,
): Promise<CreateCharacterResult> {
  const { validData, content, scores, savingThrows, currentSpellSlots, currentPactSlots, maxHp } = character;

  const {
    race,
    subrace,
    background,
    characterClass: cls,
    subclass,
    feat,
    backgroundFeat,
    acceptedOptionalFeatureIds,
    selectedChoiceOptionIds,
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
  } = content;

  // If race defines a Warforged-style static AC bonus (consistent bonus), initialize toggleable pers field.
    // Race static AC bonuses (e.g. Warforged +1) must be explicitly enabled via the UI toggle.
    // So we initialize it to 0 even if the race defines a consistentBonus.
    const initialRaceStaticAcBonus = 0;

  // Prepare Skills
  const allSkills = new Set<string>(validData.skills);

  // From Schema
  if (validData.skillsSchema) {
      if (validData.skillsSchema.isTasha) {
          validData.skillsSchema.tashaChoices.forEach(s => allSkills.add(s));
      } else {
          validData.skillsSchema.basicChoices.race.forEach(s => allSkills.add(s));
          validData.skillsSchema.basicChoices.selectedClass.forEach(s => allSkills.add(s));
      }
  }

  // From Race (Fixed)
  if (race && race.skillProficiencies && Array.isArray(race.skillProficiencies)) {
      (race.skillProficiencies as string[]).forEach(s => allSkills.add(s));
  }

  // From Subrace (Fixed)
  if (subrace) {
    parseStringArray(subrace.skillProficiencies).forEach((skill) => allSkills.add(skill));
  }
  
  // From Background (Fixed)
  if (background.skillProficiencies && Array.isArray(background.skillProficiencies)) {
    (background.skillProficiencies as string[]).forEach((s) => allSkills.add(s));
  }

  // From Feat (if selected) - now processed AFTER base skills
  const expertiseFromFeat = new Set<string>();
  if (feat) {
    if (feat.grantedSkills && Array.isArray(feat.grantedSkills)) {
      (feat.grantedSkills as string[]).forEach((s) => allSkills.add(s));
    }

    if (validData.featChoiceSelections) {
      for (const rawId of Object.values(validData.featChoiceSelections)) {
        const ids = Array.isArray(rawId) ? rawId : [rawId];
        for (const choiceOptionId of ids) {
          const featChoice = feat.featChoiceOptions?.find((fco) => fco.choiceOptionId === Number(choiceOptionId));
          const option = featChoice?.choiceOption;
          if (!option) continue;

          extractSkillsFromChoiceOption(option).forEach((skillCode) => {
            if (Object.values(Skills).includes(skillCode as Skills)) {
              allSkills.add(skillCode);
            }
          });
          extractExpertisesFromChoiceOption(option).forEach((skillCode) => {
            if (Object.values(Skills).includes(skillCode as Skills)) {
              expertiseFromFeat.add(skillCode);
            }
          });
        }
      }
    }
  }

  if (backgroundFeat) {
    if (backgroundFeat.grantedSkills && Array.isArray(backgroundFeat.grantedSkills)) {
      (backgroundFeat.grantedSkills as string[]).forEach((s) => allSkills.add(s));
    }

    if (validData.backgroundFeatChoiceSelections) {
      for (const rawId of Object.values(validData.backgroundFeatChoiceSelections)) {
        const ids = Array.isArray(rawId) ? rawId : [rawId];
        for (const choiceOptionId of ids) {
          const featChoice = backgroundFeat.featChoiceOptions?.find((fco) => fco.choiceOptionId === Number(choiceOptionId));
          const option = featChoice?.choiceOption;
          if (!option) continue;

          extractSkillsFromChoiceOption(option).forEach((skillCode) => {
            if (Object.values(Skills).includes(skillCode as Skills)) {
              allSkills.add(skillCode);
            }
          });
          extractExpertisesFromChoiceOption(option).forEach((skillCode) => {
            if (Object.values(Skills).includes(skillCode as Skills)) {
              expertiseFromFeat.add(skillCode);
            }
          });
        }
      }
    }
  }

  const uniqueFeatureIds = Array.from(new Set(initialFeatureIds));

  // 2. Prepare Equipment
  const weaponsToCreate: { weaponId: number }[] = [];
  const armorsToCreate: { armorId: number }[] = [];
  const customEquipmentLines: string[] = [];

  const moneyFromBackground = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  const applyMoneyToken = (name: string, quantity: number): boolean => {
    const key = String(name || "").trim().toLowerCase();
    const qty = Number.isFinite(quantity) ? Math.max(0, Math.trunc(quantity)) : 0;
    if (!qty) return false;
    // UA abbreviations in seeds: зм=gp, см=sp, мм=cp, ем=ep, пм=pp
    if (key === "зм") {
      moneyFromBackground.gp += qty;
      return true;
    }
    if (key === "см") {
      moneyFromBackground.sp += qty;
      return true;
    }
    if (key === "мм") {
      moneyFromBackground.cp += qty;
      return true;
    }
    if (key === "ем") {
      moneyFromBackground.ep += qty;
      return true;
    }
    if (key === "пм") {
      moneyFromBackground.pp += qty;
      return true;
    }
    return false;
  };

  const backgroundItems = background.items;
  if (Array.isArray(backgroundItems)) {
    for (const item of backgroundItems as unknown[]) {
      if (!isRecord(item)) continue;
      const name = typeof item.name === "string" ? item.name : null;
      const quantity =
        typeof item.quantity === "number"
          ? item.quantity
          : typeof item.quantity === "string"
            ? Number(item.quantity)
            : NaN;
      if (name && Number.isFinite(quantity)) {
        // Persist starting money separately (Pers.gp/sp/...) instead of storing coins as "equipment".
        if (!applyMoneyToken(name, quantity)) {
          customEquipmentLines.push(`${name} x${quantity}`);
        }
      }
    }
  }

  if (validData.equipmentSchema) {
      const { choiceGroupToId, anyWeaponSelection } = validData.equipmentSchema;
      const equipmentOptionById = new Map(equipmentOptions.map((option) => [option.optionId, option]));

      // Choice Groups
      for (const ids of Object.values(choiceGroupToId)) {
          for (const id of ids) {
              const opt = equipmentOptionById.get(id);
              if (opt) {
                  if (opt.weaponId) {
                    const qty = Number.isFinite(opt.quantity) ? Math.max(1, Math.trunc(opt.quantity)) : 1;
                    for (let i = 0; i < qty; i++) weaponsToCreate.push({ weaponId: opt.weaponId });
                  }
                  if (opt.armorId) armorsToCreate.push({ armorId: opt.armorId });
                  if (typeof opt.item === "string" && opt.item.trim()) {
                    const qty = Number.isFinite(opt.quantity) ? opt.quantity : 1;
                    customEquipmentLines.push(`${opt.item} x${qty}`);
                  }
                  if (opt.equipmentPack && Array.isArray(opt.equipmentPack.items)) {
                      for (const item of opt.equipmentPack.items as unknown[]) {
                        if (!isRecord(item)) continue;
                        const name = typeof item.name === "string" ? item.name : null;
                        const quantity =
                          typeof item.quantity === "number"
                            ? item.quantity
                            : typeof item.quantity === "string"
                              ? Number(item.quantity)
                              : NaN;

                        if (name && Number.isFinite(quantity)) {
                          customEquipmentLines.push(`${name} x${quantity}`);
                        }
                      }
                  }
              }
          }
      }

      // Any Weapon
      for (const ids of Object.values(anyWeaponSelection)) {
          ids.forEach(id => weaponsToCreate.push({ weaponId: id }));
      }
  }

  // 3. Prepare Choices
  const uniqueChoiceOptionsToConnect = selectedChoiceOptionIds.map((choiceOptionId) => ({ choiceOptionId }));

  const expertiseFromClassSubclassChoices = new Set<string>();
  for (const opt of selectedChoiceOptions) {
    const effectKind = String(opt.effectKind ?? "").trim();
    const skillCode = String(opt.effectSkill ?? "").trim();
    if (!Object.values(Skills).includes(skillCode as Skills)) continue;
    const skill = skillCode as Skills;

    if (effectKind === "SKILL_PROFICIENCY") {
      allSkills.add(skill);
    } else if (effectKind === "SKILL_EXPERTISE") {
      allSkills.add(skill);
      expertiseFromClassSubclassChoices.add(skill);
    }
  }

  for (const opt of raceChoiceOptions) {
    parseStringArray(opt.skillProficiencies).forEach((skill) => allSkills.add(skill));
  }

  const languagesKnown = new Set<string>();
  (race.languages ?? []).forEach((l) => languagesKnown.add(translateValue(String(l))));
  (cls.languages ?? []).forEach((l) => languagesKnown.add(translateValue(String(l))));
  (subrace?.additionalLanguages ?? []).forEach((l: Language) => languagesKnown.add(translateValue(String(l))));
  (feat?.grantedLanguages ?? []).forEach((l: Language) => languagesKnown.add(translateValue(String(l))));
  (backgroundFeat?.grantedLanguages ?? []).forEach((l: Language) => languagesKnown.add(translateValue(String(l))));

  for (const opt of raceChoiceOptions) {
    parseStringArray(opt.languages).forEach((language) => languagesKnown.add(translateValue(language)));
  }

  if (validData.languagesSchema?.languages) {
    validData.languagesSchema.languages.forEach((l) => languagesKnown.add(translateValue(String(l))));
  }

  const profLines: string[] = [];
  const armorAll = [
    ...(race.armorProficiencies ?? []),
    ...((cls.armorProficiencies ?? []) as ArmorType[]),
    ...(subclass ? parseEnumArray(subclass.armorProficiencies, ArmorType) : []),
    ...(subrace ? parseEnumArray(subrace.armorProficiencies, ArmorType) : []),
    ...(feat ? parseEnumArray(feat.grantedArmorProficiencies, ArmorType) : []),
    ...(backgroundFeat ? parseEnumArray(backgroundFeat.grantedArmorProficiencies, ArmorType) : []),
  ];
  const armorText = formatArmorProficiencies(Array.from(new Set(armorAll)));
  if (armorText && armorText !== "—") profLines.push(armorText);

  const toolTextParts = [
    formatToolProficiencies(parseStringArray(race.toolProficiencies), parseOptionalNumber(race.toolToChooseCount)),
    formatToolProficiencies(parseEnumArray(cls.toolProficiencies, ToolCategory), parseOptionalNumber(cls.toolToChooseCount)),
    formatToolProficiencies(subrace ? parseEnumArray(subrace.toolProficiencies, ToolCategory) : [], subrace ? parseOptionalNumber(subrace.toolToChooseCount) : undefined),
    parseStringArray(background.toolProficiencies).length
      ? parseStringArray(background.toolProficiencies)
          .map((t) => translateValue(t))
          .filter(Boolean)
          .join(", ")
      : "—",
    formatToolProficiencies(feat ? parseEnumArray(feat.grantedToolProficiencies, ToolCategory) : [], undefined),
    formatToolProficiencies(backgroundFeat ? parseEnumArray(backgroundFeat.grantedToolProficiencies, ToolCategory) : [], undefined),
  ].filter((x) => x && x !== "—");
  if (toolTextParts.length) profLines.push(toolTextParts.join("\n"));

  const weaponTextParts = [
    formatWeaponProficiencies(parseWeaponProficiencies(race.weaponProficiencies)),
    formatWeaponProficiencies(
      parseWeaponProficiencies(cls.weaponProficiencies),
      parseWeaponProficienciesSpecial(cls.weaponProficienciesSpecial)
    ),
    formatWeaponProficiencies(subclass ? parseWeaponProficiencies(subclass.weaponProficiencies) : null),
    formatWeaponProficiencies(subrace ? parseWeaponProficiencies(subrace.weaponProficiencies) : null),
    formatWeaponProficiencies(feat ? parseWeaponProficiencies(feat.grantedWeaponProficiencies) : null),
    formatWeaponProficiencies(backgroundFeat ? parseWeaponProficiencies(backgroundFeat.grantedWeaponProficiencies) : null),
  ].filter((x) => x && x !== "—");
  if (weaponTextParts.length) profLines.push(weaponTextParts.join("\n"));

  const allFeatureIdsToCreate = Array.from(new Set([
    ...uniqueFeatureIds,
    ...optionalGrantedFeatureIds,
    ...choiceOptionFeatureIds,
    ...raceChoiceTraitFeatureIds,
  ])).filter((id) => Number.isFinite(id) && id > 0);

  const featureProficiencyLines: string[] = [];
  if (allFeatureIdsToCreate.length > 0) {
    for (const f of features) {
      parseStringArray(f.skillProficiencies).forEach((skill) => allSkills.add(skill));

      const armorText = formatArmorProficiencies((f.armorProficiencies ?? []) as ArmorType[]);
      if (armorText && armorText !== "—") featureProficiencyLines.push(armorText);

      const toolText = formatToolProficiencies(parseEnumArray(f.toolProficiencies, ToolCategory), null);
      if (toolText && toolText !== "—") featureProficiencyLines.push(toolText);

      const weaponText = formatWeaponProficiencies(
        parseWeaponProficiencies(f.weaponProficiencies),
        parseWeaponProficienciesSpecial(f.weaponProficienciesSpecial)
      );
      if (weaponText && weaponText !== "—") featureProficiencyLines.push(weaponText);
    }
  }

  if (featureProficiencyLines.length) {
    const existing = new Set(profLines);
    for (const line of featureProficiencyLines) {
      if (!line || line === "—" || existing.has(line)) continue;
      existing.add(line);
      profLines.push(line);
    }
  }

  const customProficiencies = profLines.join("\n");

  // Check if any feature grants proficiency via skillExpertises.getProficiencyAsWell
  const selectedExpertisesForProficiencyCheck = validData.expertiseSchema?.expertises || [];
  for (const f of features) {
    const se = parseJsonRecord(f.skillExpertises);
    if (se?.getProficiencyAsWell && Array.isArray(se.options)) {
      for (const skill of selectedExpertisesForProficiencyCheck) {
        if (se.options.includes(skill)) {
           allSkills.add(skill);
        }
      }
    }
  }

  if (allFeatureIdsToCreate.length > 0) {
    for (const f of features) {
      (f.givesLanguages || []).forEach((l) => languagesKnown.add(translateValue(String(l))));
    }
  }

  const languageChoiceLines: string[] = [];
  const appendChoiceCount = (count?: number | null) => {
    const n = typeof count === "number" ? count : 0;
    if (n > 0) languageChoiceLines.push(`Обери ще ${n}`);
  };

  // If the user picked languages in the form, don't keep "choose more" prompts.
  const hasLanguageSelections = Boolean(validData.languagesSchema?.languages?.length);
  if (!hasLanguageSelections) {
    appendChoiceCount(parseOptionalNumber(race.languagesToChooseCount));
    appendChoiceCount(subrace ? parseOptionalNumber(subrace.languagesToChooseCount) : undefined);
    appendChoiceCount(parseOptionalNumber(background.languagesToChooseCount));
    appendChoiceCount(feat ? parseOptionalNumber(feat.grantedLanguageCount) : undefined);
    appendChoiceCount(backgroundFeat ? parseOptionalNumber(backgroundFeat.grantedLanguageCount) : undefined);
    appendChoiceCount(parseOptionalNumber(cls.languagesToChooseCount));
    for (const opt of raceChoiceOptions) {
      appendChoiceCount(parseOptionalNumber(opt.languagesToChooseCount));
    }
  }

  const customLanguagesKnown = [
    Array.from(languagesKnown).filter(Boolean).join("\n"),
    languageChoiceLines.join("\n"),
  ]
    .filter((x) => x && x.trim())
    .join("\n");


  try {
    const newPers = await prisma.$transaction(async (tx) => {
      const ruleset = (validData.ruleset ?? cls.ruleset ?? "RULES_2014") as Ruleset;
      const createdPers = await tx.pers.create({
        data: {
          userId: user.id,
          name: validData.name,
          ruleset,
          raceId: validData.raceId,
          subraceId: validData.subraceId,
          classId: validData.classId,
          subclassId: validData.subclassId,
          backgroundId: validData.backgroundId,

          currentSpellSlots,
          currentPactSlots,

          raceStaticAcBonus: initialRaceStaticAcBonus,

          customLanguagesKnown,
          customProficiencies,

          // Starting money from background
          cp: String(moneyFromBackground.cp),
          sp: String(moneyFromBackground.sp),
          ep: String(moneyFromBackground.ep),
          gp: String(moneyFromBackground.gp),
          pp: String(moneyFromBackground.pp),

          // Save proficiency source-of-truth (prefill from class at creation)
          additionalSaveProficiencies: savingThrows,

          str: scores.STR,
          dex: scores.DEX,
          con: scores.CON,
          int: scores.INT,
          wis: scores.WIS,
          cha: scores.CHA,

          // Placeholder, updated below once we know class hit die
          currentHp: 10,
          maxHp: 10,

          customEquipment: customEquipmentLines.join("\n"),

          raceVariants: validData.raceVariantId
            ? {
                connect: { raceVariantId: validData.raceVariantId },
              }
            : undefined,

          raceChoiceOptions:
            raceChoiceOptionIds.length > 0
              ? {
                  connect: raceChoiceOptionIds.map((optionId) => ({ optionId })),
                }
              : undefined,

          features:
            allFeatureIdsToCreate.length > 0
              ? {
                  createMany: {
                    data: allFeatureIdsToCreate.map((featureId) => ({ featureId })),
                    skipDuplicates: true,
                  },
                }
              : undefined,
          choiceOptions:
            uniqueChoiceOptionsToConnect.length > 0
              ? {
                  connect: uniqueChoiceOptionsToConnect,
                }
              : undefined,
          classOptionalFeatures:
            acceptedOptionalFeatureIds.length > 0
              ? {
                  connect: acceptedOptionalFeatureIds.map((optionalFeatureId) => ({ optionalFeatureId })),
                }
              : undefined,
        },
      });

      if (optionalReplacedFeatureIds.length > 0) {
        await tx.persFeature.deleteMany({
          where: {
            persId: createdPers.persId,
            featureId: { in: optionalReplacedFeatureIds },
          },
        });
      }

      // Save Feat + Feat choices AFTER Pers exists
      if (validData.featId) {
        const persFeat = await tx.persFeat.create({
          data: {
            persId: createdPers.persId,
            featId: validData.featId,
          },
        });

        const entries = Object.entries(validData.featChoiceSelections ?? {});
        if (entries.length > 0) {
          await tx.persFeatChoice.createMany({
            data: entries
              .map(([, choiceOptionId]) => Number(choiceOptionId))
              .filter((choiceOptionId) => Number.isFinite(choiceOptionId) && choiceOptionId > 0)
              .map((choiceOptionId) => ({
                persFeatId: persFeat.persFeatId,
                choiceOptionId,
              })),
            skipDuplicates: true,
          });
        }
      }

      // Save Background Feat + choices
      const effectiveBgFeatId = validData.backgroundFeatId ?? background.originFeatId;
      if (effectiveBgFeatId) {
        const persBgFeat = await tx.persFeat.create({
          data: {
            persId: createdPers.persId,
            featId: effectiveBgFeatId,
          },
        });

        const bgEntries = Object.entries(validData.backgroundFeatChoiceSelections ?? {});
        if (bgEntries.length > 0) {
          await tx.persFeatChoice.createMany({
            data: bgEntries
              .map(([, choiceOptionId]) => Number(choiceOptionId))
              .filter((choiceOptionId) => Number.isFinite(choiceOptionId) && choiceOptionId > 0)
              .map((choiceOptionId) => ({
                persFeatId: persBgFeat.persFeatId,
                choiceOptionId,
              })),
            skipDuplicates: true,
          });
        }
      }

      // Save skills AFTER Pers exists (createMany + skipDuplicates)
      const skillRows = Array.from(allSkills)
        .filter((skillName) => Object.values(Skills).includes(skillName as Skills))
        .map((skillName) => {
          const skillEnum = skillName as Skills;
          const skillIndex = Object.values(Skills).indexOf(skillEnum);
          return {
            persId: createdPers.persId,
            name: skillEnum,
            skillId: skillIndex + 1,
            proficiencyType: SkillProficiencyType.PROFICIENT,
          };
        })
        .filter((row) => row.skillId > 0);

      if (skillRows.length > 0) {
        await tx.persSkill.createMany({
          data: skillRows,
          skipDuplicates: true,
        });
      }

      // Update expertise skills (upsert so it's safe even if missing)
      const expertiseSkills = new Set<string>([
        ...(validData.expertiseSchema?.expertises ?? []),
        ...expertiseFromFeat,
        ...expertiseFromClassSubclassChoices,
      ]);

      for (const skillName of expertiseSkills) {
        if (!Object.values(Skills).includes(skillName as Skills)) continue;
        const skillEnum = skillName as Skills;
        const skillIndex = Object.values(Skills).indexOf(skillEnum);
        await tx.persSkill.upsert({
          where: {
            persId_name: {
              persId: createdPers.persId,
              name: skillEnum,
            },
          },
          update: {
            proficiencyType: SkillProficiencyType.EXPERTISE,
          },
          create: {
            persId: createdPers.persId,
            name: skillEnum,
            skillId: skillIndex + 1,
            proficiencyType: SkillProficiencyType.EXPERTISE,
          },
        });
      }

      // Save weapons AFTER Pers exists
      if (weaponsToCreate.length > 0) {
        await tx.persWeapon.createMany({
          data: weaponsToCreate.map((w) => ({
            persId: createdPers.persId,
            weaponId: w.weaponId,
          })),
          skipDuplicates: true,
        });
      }

      // Save armors AFTER Pers exists
      if (armorsToCreate.length > 0) {
        const armorMetas = await tx.armor.findMany({
          where: { armorId: { in: armorsToCreate.map((a) => a.armorId) } },
          select: { armorId: true, abilityBonuses: true, abilityBonusType: true },
        });
        const metaById = new Map<number, { abilityBonuses: any; abilityBonusType: any }>(
          armorMetas.map((m) => [m.armorId, { abilityBonuses: m.abilityBonuses ?? [], abilityBonusType: m.abilityBonusType }])
        );

        await tx.persArmor.createMany({
          data: armorsToCreate.map((a, index) => ({
            persId: createdPers.persId,
            armorId: a.armorId,
            abilityBonuses: metaById.get(a.armorId)?.abilityBonuses ?? [],
            abilityBonusType: metaById.get(a.armorId)?.abilityBonusType,
            equipped: race.name === "TORTLE_MPMM" ? false : index === 0,
          })),
          skipDuplicates: true,
        });
      }

      // Explicit AC sources as equipable armor entries (seeded, translated)
      // Tortle: 17.
      // Monk UD: 10 + DEX + WIS.
      // Barbarian UD: 10 + DEX + CON.
      // Some races: natural armor base formula (e.g., 13+DEX, 12+DEX, 12+CON).
      try {
        const isTortle = race.name === "TORTLE_MPMM";

        const raceAc = parseJsonRecord(race.ac);
        const getSeededNaturalArmorName = (): string | null => {
          if (!raceAc || typeof raceAc !== "object") return null;
          if (typeof raceAc.base === "number") {
            const base = Math.trunc(raceAc.base);
            const bonus = raceAc.bonus;
            if (base === 17 && (bonus === null || bonus === undefined)) return "NATURAL_ARMOR_TORTLE";
            if (base === 13 && bonus === "DEX") return "NATURAL_ARMOR_13_DEX";
            if (base === 12 && bonus === "DEX") return "NATURAL_ARMOR_12_DEX";
            if (base === 12 && bonus === "CON") return "NATURAL_ARMOR_12_CON";
          }
          return null;
        };

        const seededArmorNames = new Set<string>();

        const naturalArmorName = getSeededNaturalArmorName();
        if (naturalArmorName) seededArmorNames.add(naturalArmorName);
        if (cls.name === "MONK_2014") seededArmorNames.add("UNARMORED_DEFENSE_MONK");
        if (cls.name === "BARBARIAN_2014") seededArmorNames.add("UNARMORED_DEFENSE_BARBARIAN");

        if (seededArmorNames.size > 0) {
          const rows = await tx.armor.findMany({
            where: { name: { in: Array.from(seededArmorNames).filter((name): name is ArmorCategory => Object.values(ArmorCategory).includes(name as ArmorCategory)) } },
            select: { armorId: true, name: true, abilityBonuses: true, abilityBonusType: true },
          });

          const byName = new Map<string, { armorId: number; abilityBonuses: any; abilityBonusType: any }>(
            rows.map((r) => [String(r.name), { armorId: r.armorId, abilityBonuses: r.abilityBonuses ?? [], abilityBonusType: r.abilityBonusType }])
          );

          const specialArmorsToCreate: Array<{
            persId: number;
            armorId: number;
            abilityBonuses: any;
            abilityBonusType: any;
            miscACBonus: number;
            isProficient: boolean;
            equipped: boolean;
          }> = [];

          // Race natural armor
          if (naturalArmorName && byName.has(naturalArmorName)) {
            const meta = byName.get(naturalArmorName)!;
            specialArmorsToCreate.push({
              persId: createdPers.persId,
              armorId: meta.armorId,
              abilityBonuses: meta.abilityBonuses,
              abilityBonusType: meta.abilityBonusType,
              miscACBonus: 0,
              isProficient: true,
              equipped: isTortle,
            });
          }

          // Class unarmored defenses
          if (cls.name === "MONK_2014" && byName.has("UNARMORED_DEFENSE_MONK")) {
            const meta = byName.get("UNARMORED_DEFENSE_MONK")!;
            specialArmorsToCreate.push({
              persId: createdPers.persId,
              armorId: meta.armorId,
              abilityBonuses: meta.abilityBonuses,
              abilityBonusType: meta.abilityBonusType,
              miscACBonus: 0,
              isProficient: true,
              equipped: !isTortle && armorsToCreate.length === 0,
            });
          }
          if (cls.name === "BARBARIAN_2014" && byName.has("UNARMORED_DEFENSE_BARBARIAN")) {
            const meta = byName.get("UNARMORED_DEFENSE_BARBARIAN")!;
            specialArmorsToCreate.push({
              persId: createdPers.persId,
              armorId: meta.armorId,
              abilityBonuses: meta.abilityBonuses,
              abilityBonusType: meta.abilityBonusType,
              miscACBonus: 0,
              isProficient: true,
              equipped: !isTortle && armorsToCreate.length === 0,
            });
          }

          // If we have a non-tortle natural armor and the character otherwise has no armor,
          // equip the natural armor by default.
          if (!isTortle && armorsToCreate.length === 0 && naturalArmorName && naturalArmorName !== "NATURAL_ARMOR_TORTLE") {
            const idx = specialArmorsToCreate.findIndex((a) => {
              const name = Array.from(byName.entries()).find(([, meta]) => meta.armorId === a.armorId)?.[0];
              return name === naturalArmorName;
            });
            if (idx >= 0) {
              specialArmorsToCreate[idx] = { ...specialArmorsToCreate[idx], equipped: true };
            }
          }

          if (specialArmorsToCreate.length > 0) {
            await tx.persArmor.createMany({
              data: specialArmorsToCreate,
            });
          }
        }
      } catch {
        // Best-effort; character creation should not fail if we can't create special AC sources.
      }

      await tx.pers.update({
        where: { persId: createdPers.persId },
        data: {
          maxHp,
          currentHp: maxHp,
        },
      });

      return createdPers;
    });

    revalidatePath("/char");
    return { success: true, persId: newPers.persId };
  } catch (error) {
    console.error("Error creating character:", error);
    return { error: "Database error" };
  }
}
