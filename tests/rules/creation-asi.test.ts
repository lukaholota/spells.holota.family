import { describe, expect, it } from "vitest";
import {
  applyRacialChoices,
  extractFlexibleGroups,
  getPlainBonuses,
  getSimpleBonuses,
  normalizeASI,
  plainAsiChoiceGroups,
} from "@/rules/abilities";

describe("KR3.2 — pure creation ASI rules", () => {
  it("normalizes a tasha-only MPMM ASI payload as basic choices without mutating the input", () => {
    const asi = { tasha: { flexible: { groups: [{ value: 1, choiceCount: 2 }] } } };

    expect(normalizeASI(asi)).toEqual({
      basic: { simple: {}, flexible: { groups: [{ value: 1, choiceCount: 2 }] } },
      tasha: { flexible: { groups: [{ value: 1, choiceCount: 2 }] } },
    });
    expect(extractFlexibleGroups(asi, "basic")).toEqual([{ value: 1, choiceCount: 2 }]);
    expect(asi).toEqual({ tasha: { flexible: { groups: [{ value: 1, choiceCount: 2 }] } } });
  });

  it("converts fixed bonuses into Tasha-style choice groups", () => {
    expect(getPlainBonuses({ STR: "2", DEX: 1, OTHER: 3 })).toEqual({ STR: 2, DEX: 1 });
    expect(plainAsiChoiceGroups({ STR: 2, DEX: 1, CON: 1 })).toEqual([
      { groupName: "+2 до 1", value: 2, choiceCount: 1, unique: true },
      { groupName: "+1 до 2", value: 1, choiceCount: 2, unique: true },
    ]);
  });

  it("adds racial choices immutably", () => {
    const scores = { STR: 10, DEX: 10 };
    const updated = applyRacialChoices(scores, [{ groupIndex: 0, selectedAbilities: ["DEX"] }], [{ value: 2 }]);

    expect(updated).toEqual({ STR: 10, DEX: 12 });
    expect(scores).toEqual({ STR: 10, DEX: 10 });
  });

  it("reads simple bonuses only from normalized basic ASI", () => {
    expect(getSimpleBonuses({ basic: { simple: { CON: 2, WIS: "1" } } })).toEqual({ CON: 2, WIS: 1 });
  });
});
