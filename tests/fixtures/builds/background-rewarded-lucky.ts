import { BackgroundCategory, Classes, Feats, Races } from "@prisma/client";
import { backgroundByName, classByName, featByName, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "background-rewarded-lucky",
  why: "Походження з кількома можливими рисами (REWARDED → SKILLED/MAGIC_INITIATE/LUCKY, background.gainsFeats — незамовлений m2m без chooseCount у схемі) і законний вибір однієї з них (LUCKY, без вибору всередині). Перевіряє character.ts:342-394,1030-1051 (backgroundFeat + backgroundFeatId) на щасливому шляху.",
  async form() {
    const [race, cls, background, lucky] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.CLERIC_2014),
      backgroundByName(BackgroundCategory.REWARDED),
      featByName(Feats.LUCKY),
    ]);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      backgroundFeatId: lucky.featId,
    });
  },
};
