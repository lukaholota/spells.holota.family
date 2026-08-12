import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, firstSubclassForClass, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "warlock-pact-patron",
  why: "PACT caster — єдиний клас з SpellcastingType.PACT, бере Patron (підклас) на 1 рівні. Тримає гілку calculateCasterLevel → SPELL_SLOT_PROGRESSION.PACT (character.ts:854-857), яку жоден інший білд у матриці не зачіпає.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.WARLOCK_2014),
      backgroundByName(BackgroundCategory.HERMIT),
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
