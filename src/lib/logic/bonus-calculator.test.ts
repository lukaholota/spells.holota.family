import { describe, expect, it } from "vitest";
import { Ability, SkillProficiencyType, Skills } from "@prisma/client";
import type { PersWithRelations } from "@/lib/actions/pers";
import {
  calculateFinalModifier,
  calculateFinalProficiency,
  calculateFinalSave,
  calculateFinalSkill,
  calculateFinalStat,
} from "./bonus-calculator";

type PersDraft = {
  level: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  skills: { name: Skills; proficiencyType: SkillProficiencyType }[];
  statBonuses?: Partial<Record<Ability, number>>;
  statModifierBonuses?: Partial<Record<Ability, number>>;
  saveBonuses?: Partial<Record<Ability, number>>;
  skillBonuses?: Partial<Record<Skills, number>>;
  additionalSaveProficiencies?: Ability[];
};

// PersWithRelations is inferred from a Prisma query with ~20 relations, so a
// literal fixture cannot satisfy it. The single cast is confined to here.
function buildPers(draft: Partial<PersDraft> = {}): PersWithRelations {
  return {
    level: 1,
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    skills: [],
    ...draft,
  } as unknown as PersWithRelations;
}

describe("calculateFinalProficiency", () => {
  // PHB 2014, Character Advancement table.
  const byLevel: [number, number][] = [
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ];

  it.each(byLevel)("рівень %i дає бонус майстерності +%i", (level, expected) => {
    expect(calculateFinalProficiency(buildPers({ level }))).toBe(expected);
  });
});

describe("calculateFinalModifier", () => {
  const byScore: [number, number][] = [
    [1, -5],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [15, 2],
    [16, 3],
    [20, 5],
  ];

  it.each(byScore)("характеристика %i дає модифікатор %i", (score, expected) => {
    expect(calculateFinalModifier(buildPers({ str: score }), Ability.STR)).toBe(expected);
  });

  it("statBonuses додаються до характеристики, а не до модифікатора", () => {
    const pers = buildPers({ str: 15, statBonuses: { STR: 2 } });

    expect(calculateFinalStat(pers, Ability.STR)).toBe(17);
    expect(calculateFinalModifier(pers, Ability.STR)).toBe(3);
  });

  it("непарна сума округлюється вниз", () => {
    const pers = buildPers({ str: 14, statBonuses: { STR: 1 } });

    expect(calculateFinalStat(pers, Ability.STR)).toBe(15);
    expect(calculateFinalModifier(pers, Ability.STR)).toBe(2);
  });

  it("statModifierBonuses додаються після округлення", () => {
    const pers = buildPers({ str: 15, statModifierBonuses: { STR: 1 } });

    expect(calculateFinalStat(pers, Ability.STR)).toBe(15);
    expect(calculateFinalModifier(pers, Ability.STR)).toBe(3);
  });
});

describe("calculateFinalSkill", () => {
  const athletics = (proficiencyType: SkillProficiencyType) =>
    buildPers({
      level: 5,
      str: 16,
      skills: [{ name: Skills.ATHLETICS, proficiencyType }],
    });

  it("без майстерності — тільки модифікатор характеристики", () => {
    expect(calculateFinalSkill(athletics(SkillProficiencyType.NONE), Skills.ATHLETICS).total).toBe(3);
  });

  it("майстерність додає повний бонус", () => {
    expect(calculateFinalSkill(athletics(SkillProficiencyType.PROFICIENT), Skills.ATHLETICS).total).toBe(6);
  });

  it("експертиза подвоює бонус майстерності", () => {
    expect(calculateFinalSkill(athletics(SkillProficiencyType.EXPERTISE), Skills.ATHLETICS).total).toBe(9);
  });

  it("половина бонусу округлюється вниз", () => {
    expect(calculateFinalSkill(athletics(SkillProficiencyType.HALF), Skills.ATHLETICS).total).toBe(4);
  });

  it("навичка без запису в skills вважається без майстерності", () => {
    const pers = buildPers({ level: 5, dex: 14, skills: [] });
    const result = calculateFinalSkill(pers, Skills.STEALTH);

    expect(result.proficiency).toBe("NONE");
    expect(result.total).toBe(2);
  });

  it("skillBonuses додаються поверх усього", () => {
    const pers = buildPers({
      level: 5,
      str: 16,
      skills: [{ name: Skills.ATHLETICS, proficiencyType: SkillProficiencyType.PROFICIENT }],
      skillBonuses: { ATHLETICS: 2 },
    });

    expect(calculateFinalSkill(pers, Skills.ATHLETICS).total).toBe(8);
  });
});

describe("calculateFinalSave", () => {
  it("бонус майстерності додається лише для рятівних кидків із майстерністю", () => {
    const pers = buildPers({
      level: 5,
      str: 16,
      dex: 16,
      additionalSaveProficiencies: [Ability.STR],
    });

    expect(calculateFinalSave(pers, Ability.STR)).toBe(6);
    expect(calculateFinalSave(pers, Ability.DEX)).toBe(3);
  });

  it("saveBonuses додаються незалежно від майстерності", () => {
    const pers = buildPers({ level: 1, con: 14, saveBonuses: { CON: 1 } });

    expect(calculateFinalSave(pers, Ability.CON)).toBe(3);
  });
});
