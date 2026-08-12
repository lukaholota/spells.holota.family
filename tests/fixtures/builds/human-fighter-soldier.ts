import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "human-fighter-soldier",
  why: "Контрольна група: жодної опційної гілки (без варіанта/підраси/риси/підкласу на 1 рівні). Golden-файл цього білда — база, з якою звіряють, що вибіркові гілки в інших білдах ДОДАЮТЬ, а не змінюють нейтральний стан.",
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
    });
  },
};
