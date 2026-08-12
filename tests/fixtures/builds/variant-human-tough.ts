import { BackgroundCategory, Classes, Feats, Races } from "@prisma/client";
import { backgroundByName, classByName, featByName, firstRaceVariantForRace, raceByName } from "../../helpers/seed-lookup";
import { flexibleGroupsFromAsi, pickAbilitiesForGroups } from "../../helpers/asi-shapes";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "variant-human-tough",
  why: "raceVariantId з overridesRaceASI=true (Human Variant, +1/+1 на вибір) + featId без вибору (TOUGH) → перевіряє character.ts:196-201 (variant override), :271-286 (basicChoices на варіантну гілку) і hasTough (+2 maxHp, character.ts:1254-1257).",
  async form() {
    const [race, cls, background, tough] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.FIGHTER_2014),
      backgroundByName(BackgroundCategory.SOLDIER),
      featByName(Feats.TOUGH),
    ]);
    const variant = await firstRaceVariantForRace(race.raceId);
    const groups = flexibleGroupsFromAsi(variant.overridesRaceASI, "basic");
    return minimalForm({
      raceId: race.raceId,
      raceVariantId: variant.raceVariantId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      featId: tough.featId,
      racialBonusChoiceSchema: { basicChoices: pickAbilitiesForGroups(groups), tashaChoices: [] },
    });
  },
};
