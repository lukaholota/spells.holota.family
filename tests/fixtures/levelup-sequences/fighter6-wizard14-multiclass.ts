import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const FIGHTER_ASI_LEVELS = new Set([4, 6]);
const WIZARD_ASI_CLASS_LEVELS = new Set([4, 8, 12]);
const FIGHTER_LEVELS = 6;

export const sequence: LevelUpSequence = {
  id: "fighter6-wizard14-multiclass",
  why: "Fighter 1→6 → Wizard 1→14 мультиклас (мінімум з таблиці KR2.3) — Eldritch Knight на Fighter, третинний кастер, поруч із Wizard, повним кастером: перевіряє мультикласові слоти заклинань (PHB 164) і головне — чи 'customProficiencies' взагалі змінюється в момент мультикласу у Wizard (знахідка з розвідки: Class.armorProficiencies/weaponProficiencies/toolProficiencies/skillProficiencies ніде не читаються в levelup.ts).",
  maxLevel: 20,
  async startForm() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.FIGHTER_2014),
      backgroundByName(BackgroundCategory.SOLDIER),
    ]);
    return minimalForm({ raceId: race.raceId, classId: cls.classId, backgroundId: background.backgroundId });
  },
  async buildLevelUpData(nextLevel) {
    if (nextLevel <= FIGHTER_LEVELS) {
      const cls = await classByName(Classes.FIGHTER_2014);
      const data: { classId: number; subclassId?: number; customAsi?: Array<{ ability: string; value: number }> } = {
        classId: cls.classId,
      };

      if (nextLevel === 3) {
        const eldritchKnight = await subclassByName(cls.classId, Subclasses.ELDRITCH_KNIGHT);
        data.subclassId = eldritchKnight.subclassId;
      }

      if (FIGHTER_ASI_LEVELS.has(nextLevel)) {
        data.customAsi = [
          { ability: "STR", value: 1 },
          { ability: "INT", value: 1 },
        ];
      }

      return data;
    }

    const wizardClassLevel = nextLevel - FIGHTER_LEVELS;
    const cls = await classByName(Classes.WIZARD_2014);
    const data: {
      classId: number;
      levelUpPath?: "MULTICLASS";
      subclassId?: number;
      customAsi?: Array<{ ability: string; value: number }>;
    } = { classId: cls.classId };

    if (wizardClassLevel === 1) {
      data.levelUpPath = "MULTICLASS";
    }

    if (wizardClassLevel === 2) {
      const evocation = await subclassByName(cls.classId, Subclasses.SCHOOL_OF_EVOCATION);
      data.subclassId = evocation.subclassId;
    }

    if (WIZARD_ASI_CLASS_LEVELS.has(wizardClassLevel)) {
      data.customAsi = [
        { ability: "INT", value: 1 },
        { ability: "WIS", value: 1 },
      ];
    }

    return data;
  },
};
