import { BackgroundCategory, Classes, Races, Subclasses } from "@prisma/client";
import { backgroundByName, classByName, classChoiceOptionIdsAtLevel, raceByName, subclassByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { LevelUpSequence } from "./types";

const WARLOCK_LEVELS = 5;
const WARLOCK_INVOCATION_LEVELS: Record<number, string[]> = {
  2: ["Agonizing Blast", "Armor of Shadows"],
  5: ["Beguiling Influence"],
};
const SORCERER_ASI_CLASS_LEVELS = new Set([4, 8, 12]);
const SORCERER_METAMAGIC_LEVELS: Record<number, string[]> = {
  3: ["Careful Spell", "Distant Spell"],
  10: ["Empowered Spell"],
};

export const sequence: LevelUpSequence = {
  id: "warlock5-sorcerer15-multiclass",
  why: "Warlock 1→5 → Sorcerer 1→15 мультиклас (з таблиці KR2.3) — пактові слоти (calculateCasterLevel.pactLevel, SPELL_SLOT_PROGRESSION.PACT) поруч зі стандартними слотами повного кастера (SPELL_SLOT_PROGRESSION.FULL за сумарним casterLevel): персонаж має обидві прогресії одночасно з 6 рівня. Fiend (Warlock, 1 рівень) і Wild Magic (Sorcerer, 1 рівень, узятий у момент мультикласу — Sorcerer.subclassLevel === 1) — без subclassChoiceOptions. Обидва class-scoped choice-пули (WARLOCK_INVOCATIONS, SORCERER_METAMAGIC) зачіпаються в одній послідовності, кожен по свій бік межі мультикласу: інвокації 2/5 рівня Warlock ще до переходу, метамагія 3/10 рівня Sorcerer (17 не досягається — максимальний рівень класу тут 15) уже після.",
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
    if (nextLevel <= WARLOCK_LEVELS) {
      const cls = await classByName(Classes.WARLOCK_2014);
      const data: {
        classId: number;
        customAsi?: Array<{ ability: string; value: number }>;
        classChoiceSelections?: Record<string, number | number[]>;
      } = { classId: cls.classId };

      const invocationNames = WARLOCK_INVOCATION_LEVELS[nextLevel];
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

      if (nextLevel === 4) {
        data.customAsi = [
          { ability: "CHA", value: 1 },
          { ability: "CON", value: 1 },
        ];
      }

      return data;
    }

    const sorcererClassLevel = nextLevel - WARLOCK_LEVELS;
    const cls = await classByName(Classes.SORCERER_2014);
    const data: {
      classId: number;
      levelUpPath?: "MULTICLASS";
      subclassId?: number;
      customAsi?: Array<{ ability: string; value: number }>;
      classChoiceSelections?: Record<string, number[]>;
    } = { classId: cls.classId };

    if (sorcererClassLevel === 1) {
      data.levelUpPath = "MULTICLASS";
      const wildMagic = await subclassByName(cls.classId, Subclasses.WILD_MAGIC);
      data.subclassId = wildMagic.subclassId;
    }

    const metamagicNames = SORCERER_METAMAGIC_LEVELS[sorcererClassLevel];
    if (metamagicNames) {
      const metamagicIds = await classChoiceOptionIdsAtLevel(cls.classId, sorcererClassLevel, (co) =>
        metamagicNames.includes(co.optionNameEng),
      );
      data.classChoiceSelections = { Метамагія: metamagicIds };
    }

    if (SORCERER_ASI_CLASS_LEVELS.has(sorcererClassLevel)) {
      data.customAsi = [
        { ability: "CHA", value: 1 },
        { ability: "CON", value: 1 },
      ];
    }

    return data;
  },
};
