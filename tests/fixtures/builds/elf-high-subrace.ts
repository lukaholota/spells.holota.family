import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, firstSubraceForRace, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "elf-high-subrace",
  why: "Типова підраса: replacesASI=false, additionalASI — фіксований плюсовий бонус без вибору (High Elf +1 INT). Контрольна пара до elf-eladrin-mpmm-subrace, де replacesASI=true — щоб два різні режими субраси не плуталися в одному білді.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.ELF_2014),
      classByName(Classes.WIZARD_2014),
      backgroundByName(BackgroundCategory.SAGE),
    ]);
    const subrace = await firstSubraceForRace(race.raceId);
    return minimalForm({
      raceId: race.raceId,
      subraceId: subrace.subraceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
    });
  },
};
