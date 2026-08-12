import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, classChoiceOptionIdsAtLevel, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "ranger-half-caster",
  why: "Половинний кастер (SpellcastingType.HALF) на 1 рівні — тримає гілку calculateCasterLevel для HALF окремо від FULL/PACT/NONE. Якщо в сідах є ClassChoiceOption на 1 рівні (Fighting Style/Deft Explorer варіант) — підбирається динамічно, а не вгадується.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.RANGER_2014),
      backgroundByName(BackgroundCategory.OUTLANDER),
    ]);
    const level1ChoiceIds = await classChoiceOptionIdsAtLevel(cls.classId, 1);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      classChoiceSelections: level1ChoiceIds.length ? { "0": level1ChoiceIds[0] } : {},
    });
  },
};
