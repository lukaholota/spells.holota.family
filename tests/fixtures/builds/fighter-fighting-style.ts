import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, classChoiceOptionIdsAtLevel, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "fighter-fighting-style",
  why: "Клас з ClassChoiceOption на 1 рівні (Fighting Style) — покриває гілку classChoiceSelections/choiceOptionsToConnect у character.ts:641-654, якої нема в контрольному білді.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.FIGHTER_2014),
      backgroundByName(BackgroundCategory.SOLDIER),
    ]);
    const fightingStyleIds = await classChoiceOptionIdsAtLevel(cls.classId, 1);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      classChoiceSelections: fightingStyleIds.length ? { "0": fightingStyleIds[0] } : {},
    });
  },
};
