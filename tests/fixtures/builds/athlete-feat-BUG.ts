import { BackgroundCategory, Classes, Feats, Races } from "@prisma/client";
import { backgroundByName, classByName, featByName, featChoiceOptionIds, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "athlete-feat-BUG",
  why: "KNOWN-BUG характеризація (BUG-004) — УВАГА, це навмисно МЕРТВИЙ шлях, не те, що реально відбувається з гравцями: Athlete має ДВІ дубльовані ChoiceOption-групи ('Характеристика ATHLETE' — робоча, повне слово 'Strength'; 'Атлет (здібність)' — мертва, абревіатура '(STR)'). Цей білд навмисно бере choiceOptionId саме з мертвої групи ('(STR)'), щоб зафіксувати, що вона справді нічого не додає (STR лишається 16, не 17). Реальний UI (FeatChoiceOptionsForm.tsx) дедублікує групи й завжди віддає перевагу робочій — перевірено проти прод-даних: 100% реальних гравців мають вибір саме з робочої групи. Деталі — docs/KNOWN-BUGS.md BUG-004.",
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
