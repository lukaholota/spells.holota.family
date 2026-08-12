import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "fighter-equipment-choices",
  why: "equipmentSchema.choiceGroupToId — жоден інший білд не чіпав стартове спорядження, тож character.ts:592-636 (ClassStartingEquipmentOption → зброя/броня/предмети, включно з груповим пакетом із кількох рядків на одну літеру вибору) лишався непокритим. Group 3 option 'a' у Fighter — навмисно два рядки (арбалет + болти) під одним вибором, щоб перевірити саме груповий випадок.",
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
      equipmentSchema: {
        choiceGroupToId: { "1": [1], "2": [6], "3": [8, 9] },
        anyWeaponSelection: {},
      },
    });
  },
};
