import { BackgroundCategory, Classes, Races, Skills } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "bard-full-caster",
  why: "Повний кастер на 1 рівні (calculateCasterLevel → SPELL_SLOT_PROGRESSION.FULL) + expertiseSchema: Bard у 2014 отримує Expertise на 1 рівні, і в цих сідах вона не CHOICE_EXPERTISE-механіка, а вільне поле expertiseSchema.expertises — тест фіксує саме цей шлях (character.ts:1076-1103).",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.BARD_2014),
      backgroundByName(BackgroundCategory.ENTERTAINER),
    ]);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      skills: [Skills.PERFORMANCE, Skills.PERSUASION],
      expertiseSchema: { expertises: [Skills.PERFORMANCE, Skills.PERSUASION] },
    });
  },
};
