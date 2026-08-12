import { BackgroundCategory, Classes, Races, Subraces } from "@prisma/client";
import { backgroundByName, classByName, raceByName, subraceByName } from "../../helpers/seed-lookup";
import { flexibleGroupsFromAsi, pickAbilitiesForGroups } from "../../helpers/asi-shapes";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "elf-eladrin-mpmm-subrace",
  why: "Підраса з replacesASI=true (MPMM Eladrin) — рідкісна гілка: з 9 PHB-підрас 2014 жодна не replacesASI, лише дві MPMM-підраси мають його. Тримає character.ts:207-210 (subraceReplacesAsi) і :284 (extraGroups з subrace.additionalASI). Eladrin-JSON має лише 'tasha.flexible', без 'basic' — тест лишає isDefaultASI=true, щоб зафіксувати fallback-нормалізацію normalizeASI (tasha → basic.flexible), а не судити, чи це навмисно.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.ELF_2014),
      classByName(Classes.RANGER_2014),
      backgroundByName(BackgroundCategory.OUTLANDER),
    ]);
    const subrace = await subraceByName(Subraces.ELF_ELADRIN_MPMM);
    const groups = flexibleGroupsFromAsi(subrace.additionalASI, "basic");
    return minimalForm({
      raceId: race.raceId,
      subraceId: subrace.subraceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      racialBonusChoiceSchema: { basicChoices: pickAbilitiesForGroups(groups), tashaChoices: [] },
    });
  },
};
