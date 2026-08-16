import { describe, expect, it } from "vitest";
import {
  calculateAverageHitPointIncrease,
  calculateInitialHitPoints,
  calculateLevelUpHitPoints,
} from "@/rules/health";
import { calculateAbilityModifier } from "@/rules/abilities";

describe("KR2.5 — hit points за PHB 2014", () => {
  // PHB 2014, с. 15 «Hit Points and Hit Dice».
  it("на 1 рівні додає весь hit die і модифікатор CON", () => {
    const conMod = calculateAbilityModifier(14); // 14 CON -> +2
    const fighterHitDie = 10;
    const initialHp = calculateInitialHitPoints(fighterHitDie, conMod);
    expect(initialHp).toBe(12);
  });

  // PHB 2014, с. 15 «Hit Points and Hit Dice».
  it("на левелапі додає середній hit die, округлений вгору, і CON", () => {
    const conMod = calculateAbilityModifier(14); // +2
    const fighterHitDie = 10;
    const initialHp = calculateInitialHitPoints(fighterHitDie, conMod); // 12
    const avgHitDie = calculateAverageHitPointIncrease(fighterHitDie); // 6
    const level2Hp = calculateLevelUpHitPoints({
      currentHitPoints: initialHp,
      hitDieIncrease: avgHitDie,
      constitutionModifier: conMod,
      toughBonus: 0,
      retroactiveConstitutionBonus: 0,
    });
    expect(level2Hp).toBe(20);
  });
});

