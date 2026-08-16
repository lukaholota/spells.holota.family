import { describe, expect, it } from "vitest";
import { applyLevelUp, mergeUniqueLines } from "@/rules/levelup";

describe("KR3.3 — applyLevelUp", () => {
  it("applies ASI, retroactive CON HP, standard slots and Pact Magic separately", () => {
    const before = {
      level: 5,
      scores: { STR: 10, DEX: 10, CON: 13, INT: 10, WIS: 10, CHA: 10 },
      maxHp: 35,
      currentHp: 30,
      currentSpellSlots: [1, 0],
      currentPactSlots: 1,
      spellcasting: { level: 5, characterClass: { name: "WARLOCK_2014", spellcastingType: "PACT" as const } },
      featureIds: [10],
      proficientSkills: ["ARCANA"],
      expertiseSkills: [],
      additionalSaveProficiencies: ["CON"],
    };
    const after = applyLevelUp(before, {
      scores: { ...before.scores, CON: 14 },
      hitDieIncrease: 5,
      hasTough: false,
      takesTough: false,
      spellcastingAfter: { level: 6, characterClass: { name: "WARLOCK_2014", spellcastingType: "PACT" as const } },
      featureIdsToAdd: [10, 20],
      featureIdsToRemove: [10],
      proficientSkillsToAdd: ["ARCANA", "STEALTH"],
      expertiseSkillsToAdd: ["ARCANA"],
      saveProficienciesToAdd: ["CON", "WIS"],
    }, {
      standardProgression: { 0: [], 1: [2] },
      pactProgression: { 0: { slots: 0, level: 0 }, 5: { slots: 2, level: 3 }, 6: { slots: 2, level: 3 } },
    });

    expect(after).toMatchObject({ level: 6, maxHp: 47, currentHp: 42, currentSpellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0], currentPactSlots: 1, featureIds: [20], proficientSkills: ["ARCANA", "STEALTH"], expertiseSkills: ["ARCANA"], additionalSaveProficiencies: ["CON", "WIS"] });
    expect(applyLevelUp(before, { ...{ scores: before.scores, hasTough: false, takesTough: false, spellcastingAfter: before.spellcasting }, hitDieIncrease: -4 }, { standardProgression: { 0: [] }, pactProgression: { 0: { slots: 0, level: 0 } } }).maxHp).toBe(36);
    expect(mergeUniqueLines("Common\nElvish", ["Elvish", "  Draconic "])).toBe("Common\nElvish\nDraconic");
  });
});
