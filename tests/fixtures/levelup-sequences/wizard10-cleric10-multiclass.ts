import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const WIZARD_ASI_CLASS_LEVELS = new Set([4, 8]);
const CLERIC_ASI_CLASS_LEVELS = new Set([4, 8]);
const WIZARD_LEVELS = 10;

export const sequence: LevelUpSequence = {
  id: "wizard10-cleric10-multiclass",
  why: "Wizard 1→10 → Cleric 1→10 мультиклас (з таблиці KR2.3) — два повних кастери (FULL+FULL), що ділять спільну таблицю прогресії слотів (SPELL_SLOT_PROGRESSION.FULL за сумарним casterLevel, calculateCasterLevel), на відміну від Fighter→Wizard, де третинний і повний кастер рахуються окремо. School of Evocation (Wizard, 2 рівень) і Life Domain (Cleric, 1 рівень, узятий одразу в момент мультикласу — Cleric.subclassLevel === 1) — обидва без жодних subclassChoiceOptions.",
  maxLevel: 20,
  async startForm() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.WIZARD_2014),
      backgroundByName(BackgroundCategory.SAGE),
    ]);
    return minimalForm({ raceId: race.raceId, classId: cls.classId, backgroundId: background.backgroundId });
  },
  async buildLevelUpData(nextLevel) {
    if (nextLevel <= WIZARD_LEVELS) {
      const cls = await classByName(Classes.WIZARD_2014);
      const data: { classId: number; subclassId?: number; customAsi?: Array<{ ability: string; value: number }> } = {
        classId: cls.classId,
      };

      if (nextLevel === 2) {
        const evocation = await subclassByName(cls.classId, Subclasses.SCHOOL_OF_EVOCATION);
        data.subclassId = evocation.subclassId;
      }

      if (WIZARD_ASI_CLASS_LEVELS.has(nextLevel)) {
        data.customAsi = [
          { ability: "INT", value: 1 },
          { ability: "CON", value: 1 },
        ];
      }

      return data;
    }

    const clericClassLevel = nextLevel - WIZARD_LEVELS;
    const cls = await classByName(Classes.CLERIC_2014);
    const data: {
      classId: number;
      levelUpPath?: "MULTICLASS";
      subclassId?: number;
      customAsi?: Array<{ ability: string; value: number }>;
    } = { classId: cls.classId };

    if (clericClassLevel === 1) {
      data.levelUpPath = "MULTICLASS";
      const lifeDomain = await subclassByName(cls.classId, Subclasses.LIFE_DOMAIN);
      data.subclassId = lifeDomain.subclassId;
    }

    if (CLERIC_ASI_CLASS_LEVELS.has(clericClassLevel)) {
      data.customAsi = [
        { ability: "WIS", value: 1 },
        { ability: "CON", value: 1 },
      ];
    }

    return data;
  },
};
