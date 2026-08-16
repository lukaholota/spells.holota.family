import { describe, expect, it } from "vitest";
import { getAbilityMod, getProficiencyBonus } from "@/lib/logic/utils";

describe("KR2.5 — character advancement за PHB 2014", () => {
  // PHB 2014, с. 15 «Character Advancement».
  it.each([
    [1, 2], [2, 2], [3, 2], [4, 2],
    [5, 3], [6, 3], [7, 3], [8, 3],
    [9, 4], [10, 4], [11, 4], [12, 4],
    [13, 5], [14, 5], [15, 5], [16, 5],
    [17, 6], [18, 6], [19, 6], [20, 6],
  ])("рівень %i дає бонус майстерності +%i", (level, expected) => {
    expect(getProficiencyBonus(level)).toBe(expected);
  });

  // PHB 2014, с. 13 «Ability Scores and Modifiers».
  it.each([
    [1, -5], [2, -4], [3, -4], [8, -1], [9, -1],
    [10, 0], [11, 0], [12, 1], [19, 4], [20, 5],
  ])("характеристика %i дає модифікатор %i", (score, expected) => {
    expect(getAbilityMod(score)).toBe(expected);
  });
});
