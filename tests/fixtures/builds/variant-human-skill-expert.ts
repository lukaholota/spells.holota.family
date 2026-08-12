import { BackgroundCategory, Classes, Feats, Races } from "@prisma/client";
import {
  backgroundByName,
  classByName,
  featChoiceOptionIds,
  featByName,
  firstRaceVariantForRace,
  raceByName,
} from "../../helpers/seed-lookup";
import { flexibleGroupsFromAsi, pickAbilitiesForGroups } from "../../helpers/asi-shapes";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "variant-human-skill-expert",
  why: "Риса з тричастинним вибором (Skill Expert: ASI + навичка + експертиза, кожна частина — окремий FeatChoiceOption з реальним effectKind у сідах). Перевіряє character.ts:295-311 (гілка effectKind === 'ASI'), :431-451 (extractSkillsFromChoiceOption/extractExpertisesFromChoiceOption для feat).",
  async form() {
    const [race, cls, background, skillExpert] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.WIZARD_2014),
      backgroundByName(BackgroundCategory.SAGE),
      featByName(Feats.SKILL_EXPERT),
    ]);
    const variant = await firstRaceVariantForRace(race.raceId);
    const groups = flexibleGroupsFromAsi(variant.overridesRaceASI, "basic");

    const [asiIds, profIds, expertiseIds] = await Promise.all([
      featChoiceOptionIds(Feats.SKILL_EXPERT, (co) => co.effectKind === "ASI" && co.effectAbility === "INT"),
      featChoiceOptionIds(Feats.SKILL_EXPERT, (co) => co.effectKind === "SKILL_PROFICIENCY" && co.effectSkill === "ARCANA"),
      featChoiceOptionIds(Feats.SKILL_EXPERT, (co) => co.effectKind === "SKILL_EXPERTISE" && co.effectSkill === "ARCANA"),
    ]);

    return minimalForm({
      raceId: race.raceId,
      raceVariantId: variant.raceVariantId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      featId: skillExpert.featId,
      featChoiceSelections: {
        asi: asiIds[0],
        skillProficiency: profIds[0],
        skillExpertise: expertiseIds[0],
      },
      racialBonusChoiceSchema: { basicChoices: pickAbilitiesForGroups(groups), tashaChoices: [] },
    });
  },
};
