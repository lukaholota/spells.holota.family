import { BackgroundCategory, Classes, Feats, Races } from "@prisma/client";
import { backgroundByName, classByName, featByName, featChoiceOptionIds, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "athlete-feat-BUG",
  why: "KNOWN-BUG характеризація (BUG-004): Athlete → STR обирається, але STR не зростає. Емпірично підтверджено: Human дає базовий +1 до всіх характеристик (15→16), Athlete мав би додати ще +1 (→17) — golden фіксує 16, не 17. Корінь — Feat.grantedASI має складений ключ {STR_OR_DEX:1}, який isAbilityKey (character.ts) не розпізнає, а FeatChoiceOption-рядки без effectKind/effectAbility і з абревіатурою в optionNameEng не рятують. Деталі — docs/KNOWN-BUGS.md BUG-004.",
  knownBugs: ["BUG-004"],
  async form() {
    const [race, cls, background, athlete] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.FIGHTER_2014),
      backgroundByName(BackgroundCategory.SOLDIER),
      featByName(Feats.ATHLETE),
    ]);
    const strChoiceIds = await featChoiceOptionIds(Feats.ATHLETE, (co) => co.optionNameEng.includes("(STR)"));
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      featId: athlete.featId,
      featChoiceSelections: strChoiceIds.length ? { "0": strChoiceIds[0] } : {},
    });
  },
};
