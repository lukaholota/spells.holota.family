import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

export const sequence: LevelUpSequence = {
  id: "wizard-1-to-20",
  why: "Одноклассовий Wizard 1→20 — повний кастер із підкласом на 2 рівні (на створенні підкласу немає — wizard-no-subclass.ts у KR2.2). School of Evocation — той самий підклас, що й у fighter6-wizard14-multiclass, узятий для узгодженості між послідовностями; жодних subclassChoiceOptions немає в жодного з 13 підкласів Wizard узагалі (перевірено — унікальний випадок серед усіх класів матриці), і жодного ClassChoiceOption на рівні класу.",
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
    const cls = await classByName(Classes.WIZARD_2014);
    const data: { classId: number; subclassId?: number; customAsi?: Array<{ ability: string; value: number }> } = {
      classId: cls.classId,
    };

    if (nextLevel === 2) {
      const evocation = await subclassByName(cls.classId, Subclasses.SCHOOL_OF_EVOCATION);
      data.subclassId = evocation.subclassId;
    }

    if (ASI_LEVELS.has(nextLevel)) {
      data.customAsi = [
        { ability: "INT", value: 1 },
        { ability: "CON", value: 1 },
      ];
    }

    return data;
  },
};
