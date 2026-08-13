import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

export const sequence: LevelUpSequence = {
  id: "barbarian-1-to-20",
  why: "Одноклассовий Barbarian 1→20 — некастер із дефолтними ASI-рівнями [4,8,12,16,19] (на відміну від Fighter/Rogue), підклас на 3 рівні (Path of the Ancestral Guardian — жодних subclassChoiceOptions на жодному рівні, перевірено прямим запитом до сідів). Немає жодного ClassChoiceOption у Barbarian взагалі, тож послідовність тримає 'найпростіший' одноклассовий пайплайн у матриці.",
  maxLevel: 20,
  async startForm() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.BARBARIAN_2014),
      backgroundByName(BackgroundCategory.OUTLANDER),
    ]);
    return minimalForm({ raceId: race.raceId, classId: cls.classId, backgroundId: background.backgroundId });
  },
  async buildLevelUpData(nextLevel) {
    const cls = await classByName(Classes.BARBARIAN_2014);
    const data: { classId: number; subclassId?: number; customAsi?: Array<{ ability: string; value: number }> } = {
      classId: cls.classId,
    };

    if (nextLevel === 3) {
      const ancestralGuardian = await subclassByName(cls.classId, Subclasses.PATH_OF_THE_ANCESTRAL_GUARDIAN);
      data.subclassId = ancestralGuardian.subclassId;
    }

    if (ASI_LEVELS.has(nextLevel)) {
      data.customAsi = [
        { ability: "STR", value: 1 },
        { ability: "CON", value: 1 },
      ];
    }

    return data;
  },
};
