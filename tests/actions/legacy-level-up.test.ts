import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCharacter } from "@/lib/actions/character";
import { getLevelUpInfo } from "@/app/actions/level-up";
import { minimalForm } from "../helpers/build-form";
import { backgroundByName, classByName, raceByName } from "../helpers/seed-lookup";
import { disconnectDatabase, resetUserData } from "../user-data";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("legacy level-up action", () => {
  it("lists Fighter level-two class features in display order", async () => {
    const user = await prisma.user.create({
      data: { email: "legacy-level-up@golden.test", name: "Legacy Level-up Test User" },
    });
    vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);
    const [race, characterClass, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.FIGHTER_2014),
      backgroundByName(BackgroundCategory.SOLDIER),
    ]);
    const created = await createCharacter(
      minimalForm({ raceId: race.raceId, classId: characterClass.classId, backgroundId: background.backgroundId }),
    );
    if ("error" in created) throw new Error(created.error);

    await expect(getLevelUpInfo(created.persId, 2)).resolves.toMatchObject({
      targetLevel: 2,
      classId: characterClass.classId,
      className: "FIGHTER_2014",
      features: [{ name: "Сплеск дій" }],
    });
  });
});
