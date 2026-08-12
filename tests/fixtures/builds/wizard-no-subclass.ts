import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "wizard-no-subclass",
  why: "Повний кастер, що бере підклас (Arcane Tradition) на 2 рівні — на створенні підкласу немає. Разом з druid-no-subclass покриває 'клас без підкласу на 1 рівні' як типовий, а не лише крайній, випадок.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.WIZARD_2014),
      backgroundByName(BackgroundCategory.SAGE),
    ]);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
    });
  },
};
