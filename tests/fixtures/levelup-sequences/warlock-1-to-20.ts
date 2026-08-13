import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, classChoiceOptionIdsAtLevel, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);
const INVOCATION_LEVELS: Record<number, string[]> = {
  2: ["Agonizing Blast", "Armor of Shadows"],
  5: ["Beguiling Influence"],
  7: ["Beast Speech"],
  9: ["Devil's Sight"],
  12: ["Eldritch Sight"],
  15: ["Eldritch Mind"],
  18: ["Eldritch Spear"],
};

export const sequence: LevelUpSequence = {
  id: "warlock-1-to-20",
  why: "Одноклассовий Warlock 1→20 — PACT-кастер, підклас на 1 рівні (Fiend — жодних subclassChoiceOptions, як усі 9 патронів Warlock). Єдиний клас, де choicePoolRules.ts (WARLOCK_INVOCATIONS) незалежний від підкласу: 'Потойбічні виклики' — це ClassChoiceOption самого класу, тож жоден вибір підкласу не дає уникнути явного вибору на 2/5/7/9/12/15/18 рівнях. Дар пакту (Pact of the Tome) обраний на 3 рівні окремою групою — 1 пік за замовчуванням (не в choicePoolRules, тому picksAtLevelForGroup повертає дефолтні 1). Усі викликані інвокації навмисно без prerequisites.pact/level, щоб не залежати від того, який пакт обрано, і не впертися в 'Цей виклик недоступний на цьому рівні'.",
  maxLevel: 20,
  async startForm() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.WARLOCK_2014),
      backgroundByName(BackgroundCategory.HERMIT),
    ]);
    const fiend = await subclassByName(cls.classId, Subclasses.FIEND);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      subclassId: fiend.subclassId,
    });
  },
  async buildLevelUpData(nextLevel) {
    const cls = await classByName(Classes.WARLOCK_2014);
    const data: {
      classId: number;
      customAsi?: Array<{ ability: string; value: number }>;
      classChoiceSelections?: Record<string, number | number[]>;
    } = { classId: cls.classId };

    const invocationNames = INVOCATION_LEVELS[nextLevel];
    if (invocationNames) {
      const invocationIds = await classChoiceOptionIdsAtLevel(cls.classId, nextLevel, (co) =>
        invocationNames.includes(co.optionNameEng),
      );
      data.classChoiceSelections = { "Потойбічні виклики": invocationIds };
    }

    if (nextLevel === 3) {
      const [pactOfTheTomeId] = await classChoiceOptionIdsAtLevel(
        cls.classId,
        3,
        (co) => co.optionNameEng === "Pact of the Tome",
      );
      data.classChoiceSelections = { ...data.classChoiceSelections, "Дар пакту": pactOfTheTomeId };
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
