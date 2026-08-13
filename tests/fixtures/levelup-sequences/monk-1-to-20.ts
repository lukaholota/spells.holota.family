import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

export const sequence: LevelUpSequence = {
  id: "monk-1-to-20",
  why: "Одноклассовий Monk 1→20 — дефолтні ASI-рівні, підклас на 3 рівні. Way of the Open Hand обраний свідомо ЗАМІСТЬ Way of the Four Elements: останній єдиний з підкласів Monk, що має subclassChoiceOptions (Дисципліни чотирьох елементів, choicePoolRules.ts) — уникнення цього підкласу тримає послідовність фокусованою на базовому пайплайні, а не на конкретній дисципліні вибору.",
  maxLevel: 20,
  async startForm() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.MONK_2014),
      backgroundByName(BackgroundCategory.HERMIT),
    ]);
    return minimalForm({ raceId: race.raceId, classId: cls.classId, backgroundId: background.backgroundId });
  },
  async buildLevelUpData(nextLevel) {
    const cls = await classByName(Classes.MONK_2014);
    const data: { classId: number; subclassId?: number; customAsi?: Array<{ ability: string; value: number }> } = {
      classId: cls.classId,
    };

    if (nextLevel === 3) {
      const openHand = await subclassByName(cls.classId, Subclasses.WAY_OF_THE_OPEN_HAND);
      data.subclassId = openHand.subclassId;
    }

    if (ASI_LEVELS.has(nextLevel)) {
      data.customAsi = [
        { ability: "DEX", value: 1 },
        { ability: "WIS", value: 1 },
      ];
    }

    return data;
  },
};
