import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, firstRaceVariantForRace, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "tiefling-fiend-variant",
  why: "Другий приклад overridesRaceASI=true, але з фіксованим (не flexible) заміщенням — Tiefling fiend-patron варіанти в сідах задають ASI напряму, без вибору гравця. Тримає гілку isDefaultASI без racialBonusChoiceSchema поруч із variant-human-tough, де вибір є.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.TIEFLING_2014),
      classByName(Classes.WARLOCK_2014),
      backgroundByName(BackgroundCategory.CHARLATAN),
    ]);
    const variant = await firstRaceVariantForRace(race.raceId);
    return minimalForm({
      raceId: race.raceId,
      raceVariantId: variant.raceVariantId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
    });
  },
};
