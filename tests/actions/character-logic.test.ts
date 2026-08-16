import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCharacter } from "@/lib/actions/character";
import { getLevelUpSteps } from "@/lib/actions/character-logic";
import { minimalForm } from "../helpers/build-form";
import { backgroundByName, classByName, raceByName } from "../helpers/seed-lookup";
import { disconnectDatabase, resetUserData } from "../user-data";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("getLevelUpSteps", () => {
  it("показує Fighter 1 наступним рівнем 2 з поточним HP step", async () => {
    const user = await prisma.user.create({
      data: { email: "character-logic@golden.test", name: "Character Logic Test User" },
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

    await expect(getLevelUpSteps(created.persId)).resolves.toEqual({
      newLevel: 2,
      className: Classes.FIGHTER_2014,
      steps: [{ type: "ADD_HP", hitDie: 8, method: "roll" }],
    });
  });
});
