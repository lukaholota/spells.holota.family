import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, firstSubclassForClass, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "sorcerer-sorcerous-origin",
  why: "Другий клас, що бере підклас на 1 рівні (Sorcerous Origin) — повний кастер, на відміну від cleric-divine-domain, щоб не плутати 'підклас з 1 рівня' з 'повний кастер' як одну й ту саму вісь.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.SORCERER_2014),
      backgroundByName(BackgroundCategory.NOBLE),
    ]);
    const subclass = await firstSubclassForClass(cls.classId);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      subclassId: subclass.subclassId,
    });
  },
};
