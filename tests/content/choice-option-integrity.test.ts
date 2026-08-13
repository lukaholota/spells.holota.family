import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { extractSkillsFromChoiceOption } from "@/lib/logic/characterUtils";
import { Skills } from "@prisma/client";
import knownNoOps from "./known-no-op-choice-options.json";

/**
 * Not a golden test: an invariant check over ALL 370+ ChoiceOption rows attached to a
 * feat/class/subclass. createCharacter grants an option's effect through exactly three
 * channels — a linked ChoiceOptionFeature, an ASI (effectKind="ASI" or legacy name-substring
 * match), or a skill/expertise (extractSkillsFromChoiceOption, same fallback the real action
 * uses). An option matching none of the three does literally nothing when picked — a silent
 * no-op the player has no way to notice, and confirmed live: 733/8572 prod characters
 * (2026-08-13 audit) hold one of the 29 feats affected by BUG-004.
 *
 * Known offenders are pinned in known-no-op-choice-options.json (BUG-004, BUG-005 in
 * docs/KNOWN-BUGS.md) so this test stays green while still catching any NEW no-op — the same
 * "pin current state, flag drift" idea as the golden tests, applied to a correctness invariant
 * instead of a behavior snapshot.
 */

const ABILITY_SUBSTRINGS = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];

function hasAsiEffect(option: { effectKind: string | null; effectAbility: string | null; optionNameEng: string }) {
  if (option.effectKind === "ASI" && option.effectAbility) return true;
  return ABILITY_SUBSTRINGS.some((word) => option.optionNameEng.includes(word));
}

function hasSkillEffect(option: { effectKind: string | null; effectSkill: string | null; optionNameEng: string; optionName: string }) {
  return extractSkillsFromChoiceOption(option).some((skill) => Object.values(Skills).includes(skill as Skills));
}

type Context = { source: string; label: string; choiceOptionId: number };

async function findNoOpOptions(): Promise<Array<Context & { optionNameEng: string }>> {
  const [classOptions, subclassOptions, featOptions] = await Promise.all([
    prisma.classChoiceOption.findMany({
      include: { choiceOption: { include: { features: true } }, class: { select: { name: true } } },
    }),
    prisma.subclassChoiceOption.findMany({
      include: { choiceOption: { include: { features: true } }, subclass: { select: { name: true } } },
    }),
    prisma.featChoiceOption.findMany({
      include: { choiceOption: { include: { features: true } }, feat: { select: { name: true } } },
    }),
  ]);

  const rows: Array<Context & { option: (typeof classOptions)[number]["choiceOption"] }> = [
    ...classOptions.map((r) => ({ source: "ClassChoiceOption", label: r.class.name, choiceOptionId: r.choiceOptionId, option: r.choiceOption })),
    ...subclassOptions.map((r) => ({ source: "SubclassChoiceOption", label: r.subclass.name, choiceOptionId: r.choiceOptionId, option: r.choiceOption })),
    ...featOptions.map((r) => ({ source: "FeatChoiceOption", label: r.feat.name, choiceOptionId: r.choiceOptionId, option: r.choiceOption })),
  ];

  return rows
    .filter(({ option }) => option.features.length === 0 && !hasAsiEffect(option) && !hasSkillEffect(option))
    .map(({ source, label, choiceOptionId, option }) => ({ source, label, choiceOptionId, optionNameEng: option.optionNameEng }))
    .sort((a, b) => a.choiceOptionId - b.choiceOptionId);
}

describe("KR2.1+ — цілісність ChoiceOption: жоден вибір не має бути порожнім", () => {
  it("нові безрезультатні вибори не з'являються поза зафіксованим списком BUG-004/BUG-005", async () => {
    const found = await findNoOpOptions();
    const foundIds = new Set(found.map((r) => r.choiceOptionId));
    const knownIds = new Set(knownNoOps.map((r) => r.choiceOptionId));

    const newOnes = found.filter((r) => !knownIds.has(r.choiceOptionId));
    const resolvedOnes = knownNoOps.filter((r) => !foundIds.has(r.choiceOptionId));

    if (newOnes.length > 0) {
      const report = newOnes.map((r) => `  [${r.source}] ${r.label} → "${r.optionNameEng}" (choiceOptionId=${r.choiceOptionId})`).join("\n");
      throw new Error(
        `Знайдено ${newOnes.length} НОВИХ вибір(ів), що нічого не дають при виборі — не в пінованому списку:\n${report}\n` +
          "Якщо це справжня знахідка — додати в KNOWN-BUGS.md і в known-no-op-choice-options.json.",
      );
    }

    if (resolvedOnes.length > 0) {
      const report = resolvedOnes.map((r) => `  [${r.source}] ${r.label} → "${r.optionNameEng}" (choiceOptionId=${r.choiceOptionId}, ${r.knownBug})`).join("\n");
      throw new Error(
        `${resolvedOnes.length} раніше зафіксован(их) но-оп вибір(ів) більше НЕ но-оп — схоже, хтось це виправив:\n${report}\n` +
          "Онови докладно KNOWN-BUGS.md (перенеси у «Виправлені») і прибери рядок(и) з known-no-op-choice-options.json.",
      );
    }

    expect(newOnes).toEqual([]);
    expect(resolvedOnes).toEqual([]);
  });
});
