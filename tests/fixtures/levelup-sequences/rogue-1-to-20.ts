import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const ASI_LEVELS = new Set([4, 8, 10, 12, 16, 19]);

export const sequence: LevelUpSequence = {
  id: "rogue-1-to-20",
  why: "Одноклассовий Rogue 1→20 — другий клас (крім Fighter) із нестандартними ASI-рівнями: Class.abilityScoreUpLevels = [4,8,10,12,16,19], зайвий 10 рівень замість дефолтного набору. Assassin обраний підкласом на 3 рівні — жодних subclassChoiceOptions. Другий Expertise-вибір Rogue на 10 рівні (як і другий на 1 — rogue-expertise.ts) свідомо не покритий: expertiseSchema ніде не валідується сервером на кількість, тож пропуск не ламає пайплайн.",
  maxLevel: 20,
  async startForm() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.ROGUE_2014),
      backgroundByName(BackgroundCategory.CRIMINAL),
    ]);
    return minimalForm({ raceId: race.raceId, classId: cls.classId, backgroundId: background.backgroundId });
  },
  async buildLevelUpData(nextLevel) {
    const cls = await classByName(Classes.ROGUE_2014);
    const data: { classId: number; subclassId?: number; customAsi?: Array<{ ability: string; value: number }> } = {
      classId: cls.classId,
    };

    if (nextLevel === 3) {
      const assassin = await subclassByName(cls.classId, Subclasses.ASSASSIN);
      data.subclassId = assassin.subclassId;
    }

    if (ASI_LEVELS.has(nextLevel)) {
      data.customAsi = [
        { ability: "DEX", value: 1 },
        { ability: "INT", value: 1 },
      ];
    }

    return data;
  },
};
