import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, classChoiceOptionIdsAtLevel, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

export const sequence: LevelUpSequence = {
  id: "paladin-1-to-20",
  why: "Одноклассовий Paladin 1→20 — половинний кастер (HALF) із підкласом на 3 рівні (на створенні підкласу немає — paladin-baseline.ts у KR2.2). Oath of Devotion — жодних subclassChoiceOptions. Paladin, на відміну від Fighter, отримує Бойовий стиль (ClassChoiceOption) не на 1, а на 2 рівні — це єдиний ClassChoiceOption у Paladin узагалі, і levelup.ts вимагає його явно (validateChoiceSelections падає з 'Дооберіть опції', якщо пропустити).",
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
    const cls = await classByName(Classes.PALADIN_2014);
    const data: {
      classId: number;
      subclassId?: number;
      customAsi?: Array<{ ability: string; value: number }>;
      classChoiceSelections?: Record<string, number>;
    } = { classId: cls.classId };

    if (nextLevel === 2) {
      const [duelingId] = await classChoiceOptionIdsAtLevel(cls.classId, 2, (co) => co.optionNameEng === "Dueling");
      data.classChoiceSelections = { "Бойовий стиль": duelingId };
    }

    if (nextLevel === 3) {
      const oathOfDevotion = await subclassByName(cls.classId, Subclasses.OATH_OF_DEVOTION);
      data.subclassId = oathOfDevotion.subclassId;
    }

    if (ASI_LEVELS.has(nextLevel)) {
      data.customAsi = [
        { ability: "STR", value: 1 },
        { ability: "CHA", value: 1 },
      ];
    }

    return data;
  },
};
