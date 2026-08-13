import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import {
  backgroundByName,
  classByName,
  raceByName,
  subclassByName,
  subclassChoiceOptionIdsAtLevel,
} from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const ASI_LEVELS = new Set([4, 6, 8, 12, 14, 16, 19]);

export const sequence: LevelUpSequence = {
  id: "fighter-1-to-20",
  why: "Одноклассовий Fighter 1→20 — доводить пайплайн levelUpCharacter end-to-end: усі 7 ASI-рівнів (4,6,8,12,14,16,19 — Class.abilityScoreUpLevels, не дефолтні [4,8,12,16,19]), підклас на 3 рівні (Champion — обраний саме тому, що не має жодних subclassChoiceOptions, окрім одного пункту на 10 рівні), додатковий бойовий стиль Champion на 10 рівні. Заміну бойового стилю (ClassOptionalFeatureReplacesFeature) свідомо не чіпаємо — вона опційна, її пропуск ніде сервером не вимагається (перевірено читанням коду).",
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
    const cls = await classByName(Classes.FIGHTER_2014);
    const data: { classId: number; subclassId?: number; customAsi?: Array<{ ability: string; value: number }>; subclassChoiceSelections?: Record<string, number> } = {
      classId: cls.classId,
    };

    if (nextLevel === 3) {
      const champion = await subclassByName(cls.classId, Subclasses.CHAMPION);
      data.subclassId = champion.subclassId;
    }

    if (ASI_LEVELS.has(nextLevel)) {
      data.customAsi = [
        { ability: "STR", value: 1 },
        { ability: "CON", value: 1 },
      ];
    }

    if (nextLevel === 10) {
      const champion = await subclassByName(cls.classId, Subclasses.CHAMPION);
      const [duelingId] = await subclassChoiceOptionIdsAtLevel(
        champion.subclassId,
        10,
        (co) => co.optionNameEng === "Dueling",
      );
      data.subclassChoiceSelections = { "Бойовий стиль": duelingId };
    }

    return data;
  },
};
