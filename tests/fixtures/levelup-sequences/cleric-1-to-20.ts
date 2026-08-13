import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

export const sequence: LevelUpSequence = {
  id: "cleric-1-to-20",
  why: "Одноклассовий Cleric 1→20 — повний кастер із підкласом на 1 рівні (Class.subclassLevel === 1, тож Divine Domain обирається одразу на створенні, як cleric-divine-domain.ts у KR2.2). Life Domain обраний ЗАМІСТЬ Knowledge Domain: останній єдиний з підкласів Cleric, що має subclassChoiceOptions (4 на 1 рівні — мови Blessing of Knowledge).",
  maxLevel: 20,
  async startForm() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.CLERIC_2014),
      backgroundByName(BackgroundCategory.ACOLYTE),
    ]);
    const lifeDomain = await subclassByName(cls.classId, Subclasses.LIFE_DOMAIN);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      subclassId: lifeDomain.subclassId,
    });
  },
  async buildLevelUpData(nextLevel) {
    const cls = await classByName(Classes.CLERIC_2014);
    const data: { classId: number; customAsi?: Array<{ ability: string; value: number }> } = { classId: cls.classId };

    if (ASI_LEVELS.has(nextLevel)) {
      data.customAsi = [
        { ability: "WIS", value: 1 },
        { ability: "CON", value: 1 },
      ];
    }

    return data;
  },
};
