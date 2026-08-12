import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "druid-no-subclass",
  why: "Клас, що бере підклас на 2 рівні (Circle) — на створенні (рівень 1) підкласу коректно немає. Контрольна пара до druid-early-subclass-BUG: тут subclassId не передається взагалі.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.DRUID_2014),
      backgroundByName(BackgroundCategory.HERMIT),
    ]);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
    });
  },
};
