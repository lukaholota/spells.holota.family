import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

export const sequence: LevelUpSequence = {
  id: "druid-1-to-20",
  why: "Одноклассовий Druid 1→20 — повний кастер із підкласом на 2 рівні (Class.subclassLevel === 2, на створенні підкласу коректно немає — druid-no-subclass.ts у KR2.2). Circle of the Moon обраний ЗАМІСТЬ Circle of the Land: останній єдиний з підкласів Druid, що має subclassChoiceOptions (8 на 3 рівні — вибір типу місцевості).",
  maxLevel: 20,
  async startForm() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.DRUID_2014),
      backgroundByName(BackgroundCategory.HERMIT),
    ]);
    return minimalForm({ raceId: race.raceId, classId: cls.classId, backgroundId: background.backgroundId });
  },
  async buildLevelUpData(nextLevel) {
    const cls = await classByName(Classes.DRUID_2014);
    const data: { classId: number; subclassId?: number; customAsi?: Array<{ ability: string; value: number }> } = {
      classId: cls.classId,
    };

    if (nextLevel === 2) {
      const circleOfTheMoon = await subclassByName(cls.classId, Subclasses.CIRCLE_OF_THE_MOON);
      data.subclassId = circleOfTheMoon.subclassId;
    }

    if (ASI_LEVELS.has(nextLevel)) {
      data.customAsi = [
        { ability: "WIS", value: 1 },
        { ability: "CON", value: 1 },
      ];
    }

    return data;
  },
};
