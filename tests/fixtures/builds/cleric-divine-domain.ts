import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, firstSubclassForClass, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "cleric-divine-domain",
  why: "Клас, що бере підклас на 1 рівні (Class.subclassLevel === 1, Divine Domain) — покриває subclassId branch: validData.subclassId != null → SubclassFeature findMany levelGranted:1 (character.ts:505-511), і перевірку 'підклас належить класу' (character.ts:245-247) на позитивному шляху.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.CLERIC_2014),
      backgroundByName(BackgroundCategory.ACOLYTE),
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
