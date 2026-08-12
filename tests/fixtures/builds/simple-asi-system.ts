import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { ALL_SIMPLE_ASI, minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "simple-asi-system",
  why: "asiSystem='SIMPLE' — інша гілка ability-score вводу (character.ts:179-180, validData.simpleAsi замість validData.asi). Жоден інший білд у матриці не відходить від POINT_BUY (дефолт схеми).",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.BARBARIAN_2014),
      backgroundByName(BackgroundCategory.FOLK_HERO),
    ]);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      asiSystem: "SIMPLE",
      simpleAsi: ALL_SIMPLE_ASI,
      asi: [],
    });
  },
};
