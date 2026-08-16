import { describe, expect, it } from "vitest";
import { Ability, Classes } from "@prisma/client";
import type { PersWithRelations } from "@/lib/actions/pers";
import { getSpellcastingCountsLines } from "@/lib/logic/spellcasting-progression";

const PREPARED_SPELL_CASES = [
  // PHB 2014, с. 58 «The Cleric → Preparing and Casting Spells».
  { className: Classes.CLERIC_2014, level: 3, ability: Ability.WIS, score: 18, expected: 7 },
  // PHB 2014, с. 66 «The Druid → Preparing and Casting Spells».
  { className: Classes.DRUID_2014, level: 1, ability: Ability.WIS, score: 8, expected: 1 },
  // PHB 2014, с. 84 «The Paladin → Preparing and Casting Spells».
  { className: Classes.PALADIN_2014, level: 3, ability: Ability.CHA, score: 8, expected: 1 },
  // Tasha's Cauldron of Everything, с. 10 «The Artificer → Preparing and Casting Spells».
  { className: Classes.ARTIFICER_2014, level: 3, ability: Ability.INT, score: 8, expected: 1 },
  // PHB 2014, с. 114 «The Wizard → Preparing and Casting Spells».
  { className: Classes.WIZARD_2014, level: 1, ability: Ability.INT, score: 18, expected: 5 },
] as const;

describe("KR2.5 — prepared spells за PHB 2014 і TCoE", () => {
  it.each(PREPARED_SPELL_CASES)("$className на $level рівні готує $expected заклинань", (testCase) => {
    expect(preparedSpellCount(testCase)).toBe(testCase.expected);
  });
});

function preparedSpellCount(testCase: (typeof PREPARED_SPELL_CASES)[number]): number {
  const line = getSpellcastingCountsLines(buildPers(testCase))[0];
  if (!line || line.spells.kind !== "formula" || line.spells.value === undefined) {
    throw new Error(`${testCase.className} не повернув формулу підготовлених заклинань.`);
  }
  return line.spells.value;
}

function buildPers(testCase: (typeof PREPARED_SPELL_CASES)[number]): PersWithRelations {
  const abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  abilities[testCase.ability.toLowerCase() as keyof typeof abilities] = testCase.score;

  return {
    level: testCase.level,
    ...abilities,
    class: { name: testCase.className, primaryCastingStat: testCase.ability },
    subclass: null,
    multiclasses: [],
  } as unknown as PersWithRelations;
}
