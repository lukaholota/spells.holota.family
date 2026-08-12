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
  id: "background-feat-mismatch-BUG",
  why: "KNOWN-BUG характеризація: createCharacter ніде не перевіряє, що backgroundFeatId справді входить у background.gainsFeats обраного походження (character.ts:260-269 читає Feat лише за featId, без join на background). Цей білд навмисно бере SOLDIER (яке не дає RESILIENT) і все одно передає backgroundFeatId=RESILIENT з вибором рятівного кидка WIS — golden фіксує, що це зараз ПРОХОДИТЬ. Заразом тримає рідкісну гілку: featChoiceOption з effectKind=null для Resilient (легасі-фолбек по optionNameEng, character.ts:368-387) — на живих сідах ці ChoiceOption-рядки досі без effectKind.",
  knownBugs: ["BUG-003"],
  async form() {
    const [race, cls, background, resilient] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.FIGHTER_2014),
      backgroundByName(BackgroundCategory.SOLDIER),
      featByName(Feats.RESILIENT),
    ]);
    const wisdomChoiceIds = await featChoiceOptionIds(Feats.RESILIENT, (co) =>
      co.optionNameEng.includes("Wisdom"),
    );
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      backgroundFeatId: resilient.featId,
      backgroundFeatChoiceSelections: wisdomChoiceIds.length ? { "0": wisdomChoiceIds[0] } : {},
    });
  },
};
