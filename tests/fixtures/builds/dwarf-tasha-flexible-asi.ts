import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { flexibleGroupsFromAsi, pickAbilitiesForGroups } from "../../helpers/asi-shapes";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "dwarf-tasha-flexible-asi",
  why: "isDefaultASI=false (Tasha-стиль вільний розподіл ASI замість фіксованого расового +2 CON) — перевіряє character.ts:277-286, гілку racialBonusChoiceSchema.tashaChoices і extractFlexibleGroups(effectiveASI,'tasha'), яку жоден інший білд не зачіпає (усі інші лишають isDefaultASI=true).",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.DWARF_2014),
      classByName(Classes.FIGHTER_2014),
      backgroundByName(BackgroundCategory.GUILD_ARTISAN),
    ]);
    const groups = flexibleGroupsFromAsi(race.ASI, "tasha");
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      isDefaultASI: false,
      racialBonusChoiceSchema: { basicChoices: [], tashaChoices: pickAbilitiesForGroups(groups) },
    });
  },
};
