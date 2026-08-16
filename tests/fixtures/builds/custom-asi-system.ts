import { BackgroundCategory, Classes, Races } from "@prisma/client";
import type { PersFormData } from "@/lib/zod/schemas/persCreateSchema";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { ALL_CUSTOM_ASI, minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "custom-asi-system",
  why: "asiSystem='CUSTOM' — третя гілка ability-score вводу (character.ts:181-182, validData.customAsi з рядкових значень через Number()). Замикає вісь 'система ASI' (POINT_BUY/SIMPLE/CUSTOM) усіма трьома значеннями.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.SORCERER_2014),
      backgroundByName(BackgroundCategory.URCHIN),
    ]);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      asiSystem: "CUSTOM",
      customAsi: ALL_CUSTOM_ASI as unknown as PersFormData["customAsi"],
      asi: [],
    });
  },
};
