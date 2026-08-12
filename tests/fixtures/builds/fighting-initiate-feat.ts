import { BackgroundCategory, Classes, Feats, Races } from "@prisma/client";
import { backgroundByName, classByName, featByName, featChoiceOptionIds, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "fighting-initiate-feat",
  why: "Риса, що перевикористовує спільну групу ChoiceOption 'Бойовий стиль' замість власної (Fighting Initiate, XGtE) — на відміну від fighter-fighting-style, де той самий пул опцій приходить через ClassChoiceOption, тут — через FeatChoiceOption. Golden показує, чи character.ts трактує обидва джерела однаково (обидва йдуть у choiceOptionsToConnect/featChoiceSelections окремими шляхами).",
  async form() {
    const [race, cls, background, fightingInitiate] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.WIZARD_2014),
      backgroundByName(BackgroundCategory.SAGE),
      featByName(Feats.FIGHTING_INITIATE),
    ]);
    const duelingIds = await featChoiceOptionIds(Feats.FIGHTING_INITIATE, (co) =>
      co.optionNameEng.includes("Dueling"),
    );
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      featId: fightingInitiate.featId,
      featChoiceSelections: duelingIds.length ? { "0": duelingIds[0] } : {},
    });
  },
};
