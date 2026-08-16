import { describe, expect, it } from "vitest";
import { buildCreationAbilityScores } from "@/rules/character-creation";

describe("PHB 2024 Character Creation Rules (Coverage)", () => {
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
      raceASI: { STR: 2, CON: 1 },
      subraceReplacesASI: false,
      feats: [],
    });

    expect(result2024.scores).toEqual({
      STR: 15,
      DEX: 14,
      CON: 13,
      INT: 12,
      WIS: 10,
      CHA: 8,
    });
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

    expect(result2024.scores.STR).toBe(17);
    expect(result2024.scores.CON).toBe(14);
    expect(result2024.scores.DEX).toBe(14);
    expect(result2024.scores.CHA).toBe(8);
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

    expect(result2024.scores.STR).toBe(16);
    expect(result2024.scores.DEX).toBe(15);
    expect(result2024.scores.CON).toBe(14);
  });
});
