import { describe, expect, it } from "vitest";
import { parseLevelUpInput } from "@/lib/zod/schemas/levelUpSchema";

describe("KR3.3 — level-up input schema", () => {
  it("normalizes legacy optional payload fields without widening the input type", () => {
    const parsed = parseLevelUpInput({
      classId: "41",
      levelUpPath: "unexpected",
      featChoiceSelections: { feat: ["3", 4] },
      expertiseSchema: { expertises: ["ARCANA"] },
      levelUpHpIncrease: "6",
    });

    expect(parsed.classId).toBe(41);
    expect(parsed.levelUpPath).toBe("EXISTING");
    expect(parsed.featChoiceSelections).toEqual({ feat: [3, 4] });
    expect(parsed.expertiseSchema).toEqual({ expertises: ["ARCANA"] });
    expect(parsed.levelUpHpIncrease).toBeUndefined();
  });
});
