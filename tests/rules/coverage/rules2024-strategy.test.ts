import { describe, expect, it } from "vitest";
import { rules2024Strategy } from "@/rules/strategies";
import type { AbilityScores, BackgroundASIChoice, ClassProgression } from "@/rules/types";

describe("KR6.3 — rules2024Strategy: PHB 2024 character rules implementation", () => {
  describe("1. Subclass Selection (PHB 2024: always level 3 for all classes)", () => {
    it("requires subclass selection at level 3 regardless of Class.subclassLevel in content", () => {
      // 2014 Cleric / Sorcerer / Warlock had subclassLevel = 1
      const clericProgression: ClassProgression = { subclassLevel: 1 };
      expect(rules2024Strategy.needsSubclassSelection(clericProgression, false, 1)).toBe(false);
      expect(rules2024Strategy.needsSubclassSelection(clericProgression, false, 2)).toBe(false);
      expect(rules2024Strategy.needsSubclassSelection(clericProgression, false, 3)).toBe(true);

      // 2014 Wizard / Druid had subclassLevel = 2
      const wizardProgression: ClassProgression = { subclassLevel: 2 };
      expect(rules2024Strategy.needsSubclassSelection(wizardProgression, false, 1)).toBe(false);
      expect(rules2024Strategy.needsSubclassSelection(wizardProgression, false, 2)).toBe(false);
      expect(rules2024Strategy.needsSubclassSelection(wizardProgression, false, 3)).toBe(true);

      // Standard classes with subclassLevel = 3
      const fighterProgression: ClassProgression = { subclassLevel: 3 };
      expect(rules2024Strategy.needsSubclassSelection(fighterProgression, false, 3)).toBe(true);
      expect(rules2024Strategy.needsSubclassSelection(fighterProgression, false, 4)).toBe(true);
      expect(rules2024Strategy.needsSubclassSelection(fighterProgression, true, 3)).toBe(false);
      expect(rules2024Strategy.needsSubclassSelection(fighterProgression, true, 4)).toBe(false);
    });
  });

  describe("2. Class Progression & Epic Boon (PHB 2024: Feats at 4/8/12/16, Epic Boon at 19)", () => {
    it("identifies Feat/ASI levels (4, 8, 12, 16) and distinguishes Epic Boon at 19", () => {
      const standardClass: ClassProgression = {
        abilityScoreUpLevels: [4, 8, 12, 16, 19],
        epicBoonLevel: 19,
      };

      // Normal ASI/Feat levels
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(standardClass, 4)).toBe(true);
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(standardClass, 8)).toBe(true);
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(standardClass, 12)).toBe(true);
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(standardClass, 16)).toBe(true);

      // Non-ASI levels
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(standardClass, 1)).toBe(false);
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(standardClass, 5)).toBe(false);
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(standardClass, 20)).toBe(false);

      // Level 19 is Epic Boon, not standard ASI
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(standardClass, 19)).toBe(false);
      expect(rules2024Strategy.isEpicBoonLevel(standardClass, 19)).toBe(true);
      expect(rules2024Strategy.isEpicBoonLevel(standardClass, 18)).toBe(false);
      expect(rules2024Strategy.isEpicBoonLevel(standardClass, 20)).toBe(false);
    });

    it("supports Fighter extra Feat levels (6, 14) and Rogue extra Feat level (10)", () => {
      const fighter: ClassProgression = {
        abilityScoreUpLevels: [4, 6, 8, 12, 14, 16, 19],
        epicBoonLevel: 19,
      };
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(fighter, 6)).toBe(true);
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(fighter, 14)).toBe(true);
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(fighter, 19)).toBe(false);
      expect(rules2024Strategy.isEpicBoonLevel(fighter, 19)).toBe(true);

      const rogue: ClassProgression = {
        abilityScoreUpLevels: [4, 8, 10, 12, 16, 19],
        epicBoonLevel: 19,
      };
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(rogue, 10)).toBe(true);
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(rogue, 19)).toBe(false);
      expect(rules2024Strategy.isEpicBoonLevel(rogue, 19)).toBe(true);
    });
  });

  describe("3. Species ASI (PHB 2024: Species do not grant ASI)", () => {
    it("returns scores unchanged regardless of any species ASI data", () => {
      const baseScores: AbilityScores = { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };

      const withLegacyData = rules2024Strategy.applySpeciesASI(baseScores, {
        basic: { simple: { STR: 2, CON: 1 } },
      });
      expect(withLegacyData).toEqual(baseScores);

      const withEmptyData = rules2024Strategy.applySpeciesASI(baseScores, null);
      expect(withEmptyData).toEqual(baseScores);
    });
  });

  describe("4. Background ASI (PHB 2024: +2/+1 or +1/+1/+1 from 3 allowed abilities, cap 20)", () => {
    const allowed = ["STR", "CON", "CHA"] as const;
    const baseScores: AbilityScores = { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };

    it("applies valid +2/+1 choice correctly", () => {
      const choice: BackgroundASIChoice = {
        mode: "+2/+1",
        plusTwo: "STR",
        plusOne: "CON",
      };

      expect(rules2024Strategy.validateBackgroundASI(allowed, choice)).toBe(true);

      const result = rules2024Strategy.applyBackgroundASI(baseScores, allowed, choice);
      expect(result).toEqual({
        STR: 17, // 15 + 2
        DEX: 14,
        CON: 14, // 13 + 1
        INT: 12,
        WIS: 10,
        CHA: 8,
      });
    });

    it("applies valid +1/+1/+1 choice correctly", () => {
      const choice: BackgroundASIChoice = {
        mode: "+1/+1/+1",
        abilities: ["STR", "CON", "CHA"],
      };

      expect(rules2024Strategy.validateBackgroundASI(allowed, choice)).toBe(true);

      const result = rules2024Strategy.applyBackgroundASI(baseScores, allowed, choice);
      expect(result).toEqual({
        STR: 16, // 15 + 1
        DEX: 14,
        CON: 14, // 13 + 1
        INT: 12,
        WIS: 10,
        CHA: 9,  // 8 + 1
      });
    });

    it("clamps scores at 20 when background ASI would exceed 20", () => {
      const highScores: AbilityScores = { STR: 19, DEX: 14, CON: 20, INT: 10, WIS: 10, CHA: 8 };
      const choice: BackgroundASIChoice = {
        mode: "+2/+1",
        plusTwo: "STR",
        plusOne: "CON",
      };

      const result = rules2024Strategy.applyBackgroundASI(highScores, allowed, choice);
      expect(result.STR).toBe(20); // 19 + 2 capped at 20
      expect(result.CON).toBe(20); // 20 + 1 capped at 20
    });

    it("rejects +2/+1 choice with identical abilities", () => {
      const invalidChoice: BackgroundASIChoice = {
        mode: "+2/+1",
        plusTwo: "STR",
        plusOne: "STR",
      };

      expect(rules2024Strategy.validateBackgroundASI(allowed, invalidChoice)).toBe(false);
      expect(() => rules2024Strategy.applyBackgroundASI(baseScores, allowed, invalidChoice)).toThrow(
        "Invalid Background ASI choice for 2024 rules",
      );
    });

    it("rejects choices picking abilities outside allowed background options", () => {
      const invalidChoice: BackgroundASIChoice = {
        mode: "+2/+1",
        plusTwo: "STR",
        plusOne: "INT", // INT is not in ["STR", "CON", "CHA"]
      };

      expect(rules2024Strategy.validateBackgroundASI(allowed, invalidChoice)).toBe(false);
      expect(() => rules2024Strategy.applyBackgroundASI(baseScores, allowed, invalidChoice)).toThrow(
        "Invalid Background ASI choice for 2024 rules",
      );

      const invalidTripleChoice: BackgroundASIChoice = {
        mode: "+1/+1/+1",
        abilities: ["STR", "CON", "DEX"], // DEX not allowed
      };
      expect(rules2024Strategy.validateBackgroundASI(allowed, invalidTripleChoice)).toBe(false);
    });

    it("rejects +1/+1/+1 choice with duplicate abilities or wrong count", () => {
      const duplicateChoice: BackgroundASIChoice = {
        mode: "+1/+1/+1",
        abilities: ["STR", "STR", "CON"],
      };
      expect(rules2024Strategy.validateBackgroundASI(allowed, duplicateChoice)).toBe(false);

      const wrongCountChoice = {
        mode: "+1/+1/+1",
        abilities: ["STR", "CON"],
      } as unknown as BackgroundASIChoice;
      expect(rules2024Strategy.validateBackgroundASI(allowed, wrongCountChoice)).toBe(false);
    });
  });

  describe("5. Origin Feat Requirement (PHB 2024: background grants mandatory level 1 origin feat)", () => {
    it("returns required = true and provides the originFeatId", () => {
      expect(rules2024Strategy.getOriginFeatRequirement({ originFeatId: 42 })).toEqual({
        required: true,
        originFeatId: 42,
      });

      expect(rules2024Strategy.getOriginFeatRequirement({ originFeatId: null })).toEqual({
        required: true,
        originFeatId: null,
      });
    });
  });

  describe("6. Edge cases and error handling", () => {
    it("handles fallback default ASI levels when abilityScoreUpLevels is missing", () => {
      const emptyProgression: ClassProgression = {};
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(emptyProgression, 4)).toBe(true);
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(emptyProgression, 8)).toBe(true);
      expect(rules2024Strategy.isAbilityScoreIncreaseLevel(emptyProgression, 19)).toBe(false);
      expect(rules2024Strategy.isEpicBoonLevel(emptyProgression, 19)).toBe(true);
    });

    it("handles invalid or empty inputs in validateBackgroundASI", () => {
      expect(rules2024Strategy.validateBackgroundASI([], { mode: "+2/+1", plusTwo: "STR", plusOne: "CON" })).toBe(false);
      expect(rules2024Strategy.validateBackgroundASI(null as unknown as [], { mode: "+2/+1", plusTwo: "STR", plusOne: "CON" })).toBe(false);
      expect(rules2024Strategy.validateBackgroundASI(["STR"], null as unknown as BackgroundASIChoice)).toBe(false);
      expect(rules2024Strategy.validateBackgroundASI(["STR"], { mode: "UNKNOWN" as unknown as "+2/+1", plusTwo: "STR", plusOne: "STR" })).toBe(false);
    });
  });
});

