import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import {
  backgroundByName,
  classByName,
  classChoiceOptionIdsAtLevel,
  raceByName,
  subclassByName,
} from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const PALADIN_LEVELS = 2;
const FIGHTER_LEVELS = 4;
const FIGHTER_ASI_CLASS_LEVELS = new Set([4]);
const WIZARD_ASI_CLASS_LEVELS = new Set([4, 8, 12]);

export const sequence: LevelUpSequence = {
  id: "paladin2-fighter4-wizard14-multiclass",
  why: "Paladin 1→2 → MULTICLASS Fighter 1→4 (Eldritch Knight на Fighter class-level 3) → MULTICLASS Wizard 1→14, char 1→20 — три PersMulticlass-релевантні рядки одночасно з ТРЬОМА різними кастерними рівнями: Paladin HALF (spellcastingType класу, звірено в БД), Eldritch Knight THIRD (spellcastingType підкласу — сам Fighter NONE), Wizard FULL. Це найскладніший випадок PHB 164 (calculateCasterLevel у spell-logic.ts:61-117 рахує floor(level/2)/floor(level/3)/level ОКРЕМО на кожному class-level рядку перед сумуванням, а не суму рівнів персонажа/2) — досі жоден мультикласовий golden не тримав три релевантні рядки одразу. Знімки spellSlots на кожному рівні фіксують поточну поведінку для подальшого рецензування, а не звіряються вручну проти PHB тут. Побічний ефект: MULTICLASS Fighter на class-level 1 (char 3) вимагає явного вибору 'Бойовий стиль' — той самий шов, що BUG-009 для Ranger, лише тепер для Fighter.",
  maxLevel: 20,
  async startForm() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.PALADIN_2014),
      backgroundByName(BackgroundCategory.NOBLE),
    ]);
    return minimalForm({ raceId: race.raceId, classId: cls.classId, backgroundId: background.backgroundId });
  },
  async buildLevelUpData(nextLevel) {
    if (nextLevel <= PALADIN_LEVELS) {
      const cls = await classByName(Classes.PALADIN_2014);
      const data: { classId: number; classChoiceSelections?: Record<string, number> } = { classId: cls.classId };

      if (nextLevel === 2) {
        const [duelingId] = await classChoiceOptionIdsAtLevel(cls.classId, 2, (co) => co.optionNameEng === "Dueling");
        data.classChoiceSelections = { "Бойовий стиль": duelingId };
      }

      return data;
    }

    if (nextLevel <= PALADIN_LEVELS + FIGHTER_LEVELS) {
      const fighterClassLevel = nextLevel - PALADIN_LEVELS;
      const cls = await classByName(Classes.FIGHTER_2014);
      const data: {
        classId: number;
        levelUpPath?: "MULTICLASS";
        subclassId?: number;
        customAsi?: Array<{ ability: string; value: number }>;
        classChoiceSelections?: Record<string, number>;
      } = { classId: cls.classId };

      if (fighterClassLevel === 1) {
        data.levelUpPath = "MULTICLASS";
        // Archery, not Dueling: Paladin вже взяв Dueling на своєму рівні 2 вище — ChoiceOption-рядки
        // "Бойовий стиль" спільні між класами, повторний вибір тієї самої опції відхиляється сервером.
        const [archeryId] = await classChoiceOptionIdsAtLevel(cls.classId, 1, (co) => co.optionNameEng === "Archery");
        data.classChoiceSelections = { "Бойовий стиль": archeryId };
      }

      if (fighterClassLevel === 3) {
        const eldritchKnight = await subclassByName(cls.classId, Subclasses.ELDRITCH_KNIGHT);
        data.subclassId = eldritchKnight.subclassId;
      }

      if (FIGHTER_ASI_CLASS_LEVELS.has(fighterClassLevel)) {
        data.customAsi = [
          { ability: "STR", value: 1 },
          { ability: "INT", value: 1 },
        ];
      }

      return data;
    }

    const wizardClassLevel = nextLevel - PALADIN_LEVELS - FIGHTER_LEVELS;
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
