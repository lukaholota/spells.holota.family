import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "paladin-baseline",
  why: "Другий половинний кастер (HALF), підклас (Sacred Oath) на 3 рівні в 2014 — на створенні його немає. Разом з ranger-half-caster закриває вісь 'тип кастера' для HALF двома різними класами.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.PALADIN_2014),
      backgroundByName(BackgroundCategory.NOBLE),
    ]);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
    });
  },
};
