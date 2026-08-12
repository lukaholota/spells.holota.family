import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "tortle-baseline",
  why: "Tortle: race.ac = {base:17, bonus:null} — точний збіг патерну getSeededNaturalArmorName() у character.ts:1147-1158 → NATURAL_ARMOR_TORTLE. Єдина раса, де armorsToCreate.equipped навмисно false (character.ts:1132), а натуральна броня рівно навпаки — equipped:true (character.ts:1197). Тримає весь try/catch-блок природної броні під реальні дані, а не лише під Barbarian/Monk unarmored defense.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.TORTLE_MPMM),
      classByName(Classes.RANGER_2014),
      backgroundByName(BackgroundCategory.OUTLANDER),
    ]);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
    });
  },
};
