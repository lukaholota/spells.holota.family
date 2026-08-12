import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "artificer-baseline",
  why: "13-й клас (ARTIFICER_2014, TCE/Eberron) — Classes enum має 13 значень, не 12, як спершу вважав план KR2.1. Half-caster на рівні 1: у 2014 RAW артифайсер фактично не має слотів на 1 рівні — golden фіксує, що зараз рахує calculateCasterLevel, byte-у-byte. Інфузії (levelup.ts) сюди не входять — вони недосяжні зі створення.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.ARTIFICER_2014),
      backgroundByName(BackgroundCategory.GUILD_ARTISAN),
    ]);
    return minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
    });
  },
};
