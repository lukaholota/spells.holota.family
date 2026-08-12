import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, firstSubclassForClass, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "druid-early-subclass-BUG",
  why: "KNOWN-BUG характеризація: createCharacter ніде не перевіряє, що subclassId відповідає Class.subclassLevel (перевіряється лише subclass.classId === validData.classId, character.ts:245-247). Друїд у 2014 бере Коло на 2 рівні, але цей білд навмисно передає subclassId уже на створенні (рівень 1) — і це зараз ПРОХОДИТЬ без помилки. Golden фіксує факт: рефакторинг не має випадково 'полагодити' це мовчки — якщо полагодите, оновлюйте файл окремим комітом з посиланням на KNOWN-BUGS.md.",
  knownBugs: ["BUG-001"],
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.DRUID_2014),
      backgroundByName(BackgroundCategory.HERMIT),
    ]);
    const subclass = await firstSubclassForClass(cls.classId);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      subclassId: subclass.subclassId,
    });
  },
};
