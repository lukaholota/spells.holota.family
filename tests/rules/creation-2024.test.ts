import { describe, expect, it } from "vitest";
import { buildCreationAbilityScores } from "@/rules/character-creation";

describe("PHB 2024 Character Creation Rules", () => {
  const basePointBuy = [
    { ability: "STR", value: 15 },
    { ability: "DEX", value: 14 },
    { ability: "CON", value: 13 },
    { ability: "INT", value: 12 },
    { ability: "WIS", value: 10 },
    { ability: "CHA", value: 8 },
  ];

  it("applies 0 species ASI in 2024 even if raceASI is provided", () => {
    const result2024 = buildCreationAbilityScores({
      ruleset: "RULES_2024",
      asiSystem: "POINT_BUY",
      pointBuy: basePointBuy,
      simple: [],
      isDefaultASI: true,
      raceASI: { STR: 2, CON: 1 }, // 2014-style race ASI
      subraceReplacesASI: false,
      feats: [],
    });

    // In 2024, species does not give ASI
    expect(result2024.scores).toEqual({
      STR: 15,
      DEX: 14,
      CON: 13,
      INT: 12,
      WIS: 10,
      CHA: 8,
    });
  });

  it("applies 2014 race ASI when ruleset is RULES_2014", () => {
    const result2014 = buildCreationAbilityScores({
      ruleset: "RULES_2014",
      asiSystem: "POINT_BUY",
      pointBuy: basePointBuy,
      simple: [],
      isDefaultASI: true,
      raceASI: { STR: 2, CON: 1 },
      subraceReplacesASI: false,
      feats: [],
    });

    // In 2014, race adds STR +2, CON +1
    expect(result2014.scores.STR).toBe(17);
    expect(result2014.scores.CON).toBe(14);
  });

  it("applies 2024 background ASI in +2/+1 mode", () => {
    const result2024 = buildCreationAbilityScores({
      ruleset: "RULES_2024",
      asiSystem: "POINT_BUY",
      pointBuy: basePointBuy,
      simple: [],
      isDefaultASI: true,
      raceASI: null,
      subraceReplacesASI: false,
      backgroundAbilityOptions: ["STR", "CON", "CHA"],
      backgroundAsiChoice: {
        mode: "+2/+1",
        plusTwo: "STR",
        plusOne: "CON",
      },
      feats: [],
    });

    expect(result2024.scores.STR).toBe(17); // 15 + 2
    expect(result2024.scores.CON).toBe(14); // 13 + 1
    expect(result2024.scores.DEX).toBe(14); // unchanged
    expect(result2024.scores.CHA).toBe(8);  // unchanged
  });

  it("applies 2024 background ASI in +1/+1/+1 mode", () => {
    const result2024 = buildCreationAbilityScores({
      ruleset: "RULES_2024",
      asiSystem: "POINT_BUY",
      pointBuy: basePointBuy,
      simple: [],
      isDefaultASI: true,
      raceASI: null,
      subraceReplacesASI: false,
      backgroundAbilityOptions: ["STR", "DEX", "CON"],
      backgroundAsiChoice: {
        mode: "+1/+1/+1",
        abilities: ["STR", "DEX", "CON"],
      },
      feats: [],
    });

    expect(result2024.scores.STR).toBe(16); // 15 + 1
    expect(result2024.scores.DEX).toBe(15); // 14 + 1
    expect(result2024.scores.CON).toBe(14); // 13 + 1
  });

  it("enforces cap of 20 when applying background ASI", () => {
    const highScores = [
      { ability: "STR", value: 19 },
      { ability: "DEX", value: 10 },
      { ability: "CON", value: 10 },
      { ability: "INT", value: 10 },
      { ability: "WIS", value: 10 },
      { ability: "CHA", value: 10 },
    ];

    const result2024 = buildCreationAbilityScores({
      ruleset: "RULES_2024",
      asiSystem: "CUSTOM",
      pointBuy: [],
      simple: [],
      custom: highScores,
      isDefaultASI: true,
      raceASI: null,
      subraceReplacesASI: false,
      backgroundAbilityOptions: ["STR", "CON", "CHA"],
      backgroundAsiChoice: {
        mode: "+2/+1",
        plusTwo: "STR",
        plusOne: "CON",
      },
      feats: [],
    });

    expect(result2024.scores.STR).toBe(20); // 19 + 2 capped at 20
    expect(result2024.scores.CON).toBe(11); // 10 + 1
  });
});
