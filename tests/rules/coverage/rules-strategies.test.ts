import { describe, expect, it } from "vitest";
import { isAbilityScoreIncreaseLevel, needsSubclassSelection } from "@/rules/progression";
import {
  getRulesStrategy,
  rules2014Strategy,
  rules2024Strategy,
} from "@/rules/strategies";

describe("KR5.3 / KR6.3 — ruleset strategy dispatch", () => {
  it("dispatches RULES_2014 and RULES_2024 to their own strategy objects", () => {
    expect(getRulesStrategy("RULES_2014")).toBe(rules2014Strategy);
    expect(getRulesStrategy("RULES_2024")).toBe(rules2024Strategy);
    expect(rules2014Strategy.ruleset).toBe("RULES_2014");
    expect(rules2024Strategy.ruleset).toBe("RULES_2024");
  });

  it("RULES_2014 strategy matches the existing 2014 progression rule byte-for-byte", () => {
    const cases: Array<[{ subclassLevel?: number | null }, boolean, number]> = [
      [{ subclassLevel: 1 }, false, 1],
      [{ subclassLevel: 2 }, false, 2],
      [{}, false, 3],
      [{ subclassLevel: 3 }, true, 3],
      [{ subclassLevel: 3 }, false, 2],
    ];

    for (const [progression, hasSubclass, level] of cases) {
      expect(rules2014Strategy.needsSubclassSelection(progression, hasSubclass, level)).toBe(
        needsSubclassSelection(progression, hasSubclass, level),
      );
    }

    const progression = { abilityScoreUpLevels: [4, 8, 12, 16, 19] };
    expect(rules2014Strategy.isAbilityScoreIncreaseLevel(progression, 4)).toBe(
      isAbilityScoreIncreaseLevel(progression, 4),
    );
    expect(rules2014Strategy.isAbilityScoreIncreaseLevel(progression, 5)).toBe(
      isAbilityScoreIncreaseLevel(progression, 5),
    );
    expect(rules2014Strategy.isEpicBoonLevel(progression, 19)).toBe(false);
  });

  it("RULES_2014 species and background ASI behaviors match 2014 expectations", () => {
    const initialScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
    const withSpecies = rules2014Strategy.applySpeciesASI(initialScores, { basic: { simple: { STR: 2 } } });
    expect(withSpecies.STR).toBe(12);

    expect(rules2014Strategy.applySpeciesASI(initialScores)).toEqual(initialScores);

    const withBg = rules2014Strategy.applyBackgroundASI(initialScores, ["STR", "CON", "CHA"], {
      mode: "+2/+1",
      plusTwo: "STR",
      plusOne: "CON",
    });
    expect(withBg).toEqual(initialScores);
    expect(
      rules2014Strategy.validateBackgroundASI(["STR", "CON", "CHA"], {
        mode: "+2/+1",
        plusTwo: "STR",
        plusOne: "CON",
      }),
    ).toBe(false);

    expect(rules2014Strategy.getOriginFeatRequirement({ originFeatId: 10 })).toEqual({
      required: false,
      originFeatId: null,
    });
  });
});

