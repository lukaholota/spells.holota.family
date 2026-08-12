import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "fighter-optional-feature-early-BUG",
  why: "KNOWN-BUG характеризація, той самий клас проблеми, що й druid-early-subclass-BUG: character.ts:518-521 приймає classOptionalFeatureSelections без перевірки ClassOptionalFeature.grantedOnLevels проти рівня персонажа (тут — 1). У сідах усі 19 рядків ClassOptionalFeature мають grantedOnLevels від 4 і вище (Fighter 'Замінити бойовий стиль?' — [4,6,8,12,14,16,19]) — на створенні (рівень 1) жоден не мав би бути доступний, але цей білд навмисно передає optionalFeatureId=17 і golden фіксує, що це ПРОХОДИТЬ.",
  knownBugs: ["BUG-002"],
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.FIGHTER_2014),
      backgroundByName(BackgroundCategory.SOLDIER),
    ]);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      classOptionalFeatureSelections: { "17": true },
    });
  },
};
