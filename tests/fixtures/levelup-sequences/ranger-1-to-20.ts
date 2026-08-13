import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, classChoiceOptionIdsAtLevel, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

export const sequence: LevelUpSequence = {
  id: "ranger-1-to-20",
  why: "Одноклассовий Ranger 1→20 — половинний кастер (HALF) із найбільшою кількістю власних ClassChoiceOption серед усіх класів матриці: Бойовий стиль на 2 рівні, 'Налаштування Слідопита: усвідомлення' на 3 (разом із підкласом), 'Налаштування Слідопита: ховання' на 10. Вибір на 1 рівні (два окремі ClassChoiceOption — 'ворог' і 'місцевість') свідомо не покритий: character.ts (створення) не валідує кількість вибраного на групу так, як levelup.ts, тож пропуск на 1 рівні не ламає пайплайн — на відміну від 2/3/10, де levelup.ts падає з 'Дооберіть опції' без явного вибору. Beast Master Conclave — жодних subclassChoiceOptions (на відміну від Hunter Conclave, 11 опцій на 4 рівнях).",
  maxLevel: 20,
  async startForm() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.RANGER_2014),
      backgroundByName(BackgroundCategory.OUTLANDER),
    ]);
    return minimalForm({ raceId: race.raceId, classId: cls.classId, backgroundId: background.backgroundId });
  },
  async buildLevelUpData(nextLevel) {
    const cls = await classByName(Classes.RANGER_2014);
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
      const beastMaster = await subclassByName(cls.classId, Subclasses.BEAST_MASTER_CONCLAVE);
      data.subclassId = beastMaster.subclassId;

      const [primevalAwarenessId] = await classChoiceOptionIdsAtLevel(
        cls.classId,
        3,
        (co) => co.optionNameEng === "Primeval Awareness",
      );
      data.classChoiceSelections = { "Налаштування Слідопита: усвідомлення": primevalAwarenessId };
    }

    if (nextLevel === 10) {
      const [hideInPlainSightId] = await classChoiceOptionIdsAtLevel(
        cls.classId,
        10,
        (co) => co.optionNameEng === "Hide in Plain Sight",
      );
      data.classChoiceSelections = { "Налаштування Слідопита: ховання": hideInPlainSightId };
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
