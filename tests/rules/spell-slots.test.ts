import { describe, expect, it } from "vitest";
import {
  calculateCasterLevel,
  getMaximumStandardSpellSlots,
  getMaximumPactSpellSlots,
  applySpellSlotMaximumDelta,
} from "@/rules/spellcasting";
import { SPELL_SLOT_PROGRESSION } from "@/lib/refs/static";

describe("KR2.5 — spell slots за PHB 2014", () => {
  // PHB 2014, с. 164 «Multiclassing → Spell Slots».
  it("повний кастер додає всі рівні класу", () => {
    const result = calculateCasterLevel({
      level: 20,
      characterClass: { name: "WIZARD_2014", spellcastingType: "FULL" },
      subclass: null,
      multiclasses: [],
    });
    expect(result.casterLevel).toBe(20);
    expect(result.pactLevel).toBe(0);
  });

  // PHB 2014, с. 164 «Multiclassing → Spell Slots».
  it("половинний і третинний кастери округлюються вниз до сумування", () => {
    const pers = {
      level: 14,
      characterClass: { name: "PALADIN_2014", spellcastingType: "HALF" as const },
      subclass: null,
      multiclasses: [
        {
          classLevel: 6,
          characterClass: { name: "FIGHTER_2014", spellcastingType: "NONE" as const },
          subclass: { spellcastingType: "THIRD" as const },
        },
        {
          classLevel: 3,
          characterClass: { name: "WIZARD_2014", spellcastingType: "FULL" as const },
          subclass: null,
        },
      ],
    };

    expect(calculateCasterLevel(pers).casterLevel).toBe(7);
  });

  // PHB 2014, с. 164-165 «Multiclassing → Spell Slots»; BUG-010.
  it("некастер не має стандартних слотів", () => {
    const fighter = {
      level: 2,
      characterClass: { name: "FIGHTER_2014", spellcastingType: "NONE" as const },
      subclass: null,
      multiclasses: [],
    };
    const maxSlots = getMaximumStandardSpellSlots(fighter, SPELL_SLOT_PROGRESSION.FULL);
    expect(maxSlots).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("відокремлює пактову магію від стандартних слотів", () => {
    const warlockWizard = {
      level: 10,
      characterClass: { name: "WIZARD_2014", spellcastingType: "FULL" as const },
      subclass: null,
      multiclasses: [
        {
          classLevel: 5,
          characterClass: { name: "WARLOCK_2014", spellcastingType: "PACT" as const },
          subclass: null,
        },
      ],
    };
    const casterLevel = calculateCasterLevel(warlockWizard);
    expect(casterLevel).toEqual({ casterLevel: 5, pactLevel: 5 });
    expect(getMaximumStandardSpellSlots(warlockWizard, SPELL_SLOT_PROGRESSION.FULL)).toEqual([
      4, 3, 2, 0, 0, 0, 0, 0, 0,
    ]);
    expect(getMaximumPactSpellSlots(warlockWizard, SPELL_SLOT_PROGRESSION.PACT)).toBe(2);
  });

  it("правильно коригує слоти при підвищенні рівня", () => {
    const currentSlots = [2, 0, 0, 0, 0, 0, 0, 0, 0];
    const beforeMax = [2, 0, 0, 0, 0, 0, 0, 0, 0];
    const afterMax = [3, 0, 0, 0, 0, 0, 0, 0, 0];
    const updatedSlots = applySpellSlotMaximumDelta(currentSlots, beforeMax, afterMax);
    expect(updatedSlots).toEqual([3, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
});

