import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName, raceChoiceOptionsFor } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "half-elf-race-choices",
  why: "Раса з RaceChoiceOption (Half-Elf: вибіркові навички/мови за расу) — перевіряє character.ts:693-727,742-744 (raceChoiceSelections → raceChoiceOptions → бонуси ASI/навички/мови). Якщо в сідах опцій немає, білд лишається валідним, але вісь тоді не покрита — видно в golden порожнім масивом raceChoiceOptions.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HALF_ELF_2014),
      classByName(Classes.BARD_2014),
      backgroundByName(BackgroundCategory.CHARLATAN),
    ]);
    const options = await raceChoiceOptionsFor(race.raceId);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      raceChoiceSelections: options.length ? { "0": options[0].optionId } : {},
    });
  },
};
