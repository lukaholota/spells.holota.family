import { BackgroundCategory, Classes, Races, Skills, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

export const sequence: LevelUpSequence = {
  id: "bard-1-to-20",
  why: "Одноклассовий Bard 1→20 — повний кастер (FULL) з підкласом на 3 рівні. College of Lore обраний ЗАМІСТЬ College of Swords: останній єдиний з підкласів Bard, що має subclassChoiceOptions (2 на 3 рівні). Другий Expertise-вибір Bard на 10 рівні свідомо не покритий — той самий аргумент, що в rogue-1-to-20 (expertiseSchema не валідується сервером на кількість).",
  maxLevel: 20,
  async startForm() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.BARD_2014),
      backgroundByName(BackgroundCategory.ENTERTAINER),
    ]);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      skills: [Skills.PERFORMANCE, Skills.PERSUASION],
      expertiseSchema: { expertises: [Skills.PERFORMANCE, Skills.PERSUASION] },
    });
  },
  async buildLevelUpData(nextLevel) {
    const cls = await classByName(Classes.BARD_2014);
    const data: { classId: number; subclassId?: number; customAsi?: Array<{ ability: string; value: number }> } = {
      classId: cls.classId,
    };

    if (nextLevel === 3) {
      const collegeOfLore = await subclassByName(cls.classId, Subclasses.COLLEGE_OF_LORE);
      data.subclassId = collegeOfLore.subclassId;
    }

    if (ASI_LEVELS.has(nextLevel)) {
      data.customAsi = [
        { ability: "CHA", value: 1 },
        { ability: "CON", value: 1 },
      ];
    }

    return data;
  },
};
