import { BackgroundCategory, Classes, Feats, Races } from "@prisma/client";
import {
  backgroundByName,
  classByName,
  featByName,
  featChoiceOptionIds,
  raceByName,
} from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "background-rewarded-skilled",
  why: "backgroundFeat, що реально надає вибір навички (SKILLED — законний вибір з REWARDED.gainsFeats, на відміну від background-feat-mismatch-BUG). Покриває character.ts:454-480 (extractSkillsFromChoiceOption/extractExpertisesFromChoiceOption для backgroundFeat) на щасливому шляху — жоден інший білд цю гілку не займав.",
  async form() {
    const [race, cls, background, skilled] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.PALADIN_2014),
      backgroundByName(BackgroundCategory.REWARDED),
      featByName(Feats.SKILLED),
    ]);
    const athleticsIds = await featChoiceOptionIds(Feats.SKILLED, (co) => co.optionNameEng.includes("(ATHLETICS)"));
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      backgroundFeatId: skilled.featId,
      backgroundFeatChoiceSelections: athleticsIds.length ? { "0": athleticsIds[0] } : {},
    });
  },
};
