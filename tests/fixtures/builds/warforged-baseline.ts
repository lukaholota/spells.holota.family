import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";
import { minimalForm } from "../../helpers/build-form";
import type { Build } from "./types";

export const build: Build = {
  id: "warforged-baseline",
  why: "Warforged у сідах має race.ac.consistentBonus=1, а character.ts:189-192 навмисно пише initialRaceStaticAcBonus=0 при створенні — перевірено, це НЕ баг: existує окрема дія updateRaceStaticAcBonus (equipment-actions.ts:284-303) і тумблер на аркуші персонажа (CombatSlide.tsx), який гравець вмикає вручну після створення. Golden фіксує raceStaticAcBonus:0 як очікуваний стан щойно створеного персонажа, не як розбіжність із правилами. Заразом перевірено: 4 расові риси Warforged мають нормальні engName — попередня підозра на биту seed-назву не підтвердилась.",
  async form() {
    const [race, cls, background] = await Promise.all([
      raceByName(Races.WARFORGED_EBERRON),
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
