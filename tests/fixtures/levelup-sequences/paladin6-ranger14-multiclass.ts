import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, classChoiceOptionIdsAtLevel, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const PALADIN_LEVELS = 6;
const PALADIN_ASI_CLASS_LEVELS = new Set([4]);
const RANGER_ASI_CLASS_LEVELS = new Set([4, 8, 12]);

export const sequence: LevelUpSequence = {
  id: "paladin6-ranger14-multiclass",
  why: "Paladin 1→6 → Ranger 1→14 мультиклас (з таблиці KR2.3) — два половинні кастери (HALF+HALF): PHB 164 округлює суму рівнів класів окремо для кожного половинного кастера перед підсумуванням, а не суму рівнів персонажа/2 — саме тут реалізації зазвичай помиляються. Oath of Devotion (Paladin, 3 рівень) і Beast Master Conclave (Ranger, 3 рівень) — без subclassChoiceOptions. Ranger після мультикласу проносить свої власні ClassChoiceOption крізь межу мультикласу: Бойовий стиль на 2 рівні класу (char 8), 'усвідомлення' на 3 (char 9, разом із підкласом), 'ховання' на 10 (char 16) — рахуються від classLevelAfter самого Ranger, не від рівня персонажа. Несподіванка проти одноклассового ranger-1-to-20: на 1 рівні класу через мультиклас (char 7) 'Налаштування Слідопита: ворог'/'місцевість' теж треба явно обрати — на відміну від рівня 1 персонажа, куди ці ж опції потрапляють через лояльну до пропусків валідацію createCharacter, рівень 1 нового класу під час мультикласу йде через levelUpCharacter, а той вимагає вибір суворо (validateChoiceSelections, 'Дооберіть опції').",
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
    if (nextLevel <= PALADIN_LEVELS) {
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

      if (PALADIN_ASI_CLASS_LEVELS.has(nextLevel)) {
        data.customAsi = [
          { ability: "STR", value: 1 },
          { ability: "CHA", value: 1 },
        ];
      }

      return data;
    }

    const rangerClassLevel = nextLevel - PALADIN_LEVELS;
    const cls = await classByName(Classes.RANGER_2014);
    const data: {
      classId: number;
      levelUpPath?: "MULTICLASS";
      subclassId?: number;
      customAsi?: Array<{ ability: string; value: number }>;
      classChoiceSelections?: Record<string, number>;
    } = { classId: cls.classId };

    if (rangerClassLevel === 1) {
      data.levelUpPath = "MULTICLASS";

      const [favoredEnemyId] = await classChoiceOptionIdsAtLevel(
        cls.classId,
        1,
        (co) => co.optionNameEng === "Favored Enemy",
      );
      const [naturalExplorerId] = await classChoiceOptionIdsAtLevel(
        cls.classId,
        1,
        (co) => co.optionNameEng === "Natural Explorer",
      );
      data.classChoiceSelections = {
        "Налаштування Слідопита: ворог": favoredEnemyId,
        "Налаштування Слідопита: місцевість": naturalExplorerId,
      };
    }

    if (rangerClassLevel === 2) {
      // Archery, not Dueling: "Бойовий стиль" ChoiceOption rows are shared across classes by
      // choiceOptionId — Paladin already owns Dueling from its own level-2 pick above, and
      // levelUpCharacter rejects re-selecting an already-owned option ("Ця опція вже обрана").
      const [archeryId] = await classChoiceOptionIdsAtLevel(cls.classId, 2, (co) => co.optionNameEng === "Archery");
      data.classChoiceSelections = { "Бойовий стиль": archeryId };
    }

    if (rangerClassLevel === 3) {
      const beastMaster = await subclassByName(cls.classId, Subclasses.BEAST_MASTER_CONCLAVE);
      data.subclassId = beastMaster.subclassId;

      const [primevalAwarenessId] = await classChoiceOptionIdsAtLevel(
        cls.classId,
        3,
        (co) => co.optionNameEng === "Primeval Awareness",
      );
      data.classChoiceSelections = { "Налаштування Слідопита: усвідомлення": primevalAwarenessId };
    }

    if (rangerClassLevel === 10) {
      const [hideInPlainSightId] = await classChoiceOptionIdsAtLevel(
        cls.classId,
        10,
        (co) => co.optionNameEng === "Hide in Plain Sight",
      );
      data.classChoiceSelections = { "Налаштування Слідопита: ховання": hideInPlainSightId };
    }

    if (RANGER_ASI_CLASS_LEVELS.has(rangerClassLevel)) {
      data.customAsi = [
        { ability: "DEX", value: 1 },
        { ability: "WIS", value: 1 },
      ];
    }

    return data;
  },
};
