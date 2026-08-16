import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCharacter } from "@/lib/actions/character";
import { getMulticlassInfo } from "@/lib/logic/multiclass-resolver";
import { minimalForm } from "../helpers/build-form";
import { backgroundByName, classByName, raceByName } from "../helpers/seed-lookup";
import { disconnectDatabase, resetUserData } from "../user-data";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("getMulticlassInfo", () => {
  it("returns the current single-class Fighter projection", async () => {
    const user = await prisma.user.create({
      data: { email: "multiclass-resolver@golden.test", name: "Multiclass Resolver Test User" },
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

    await expect(getMulticlassInfo(created.persId)).resolves.toEqual({
      persId: created.persId,
      totalLevel: 1,
      classes: [{ classId: characterClass.classId, className: Classes.FIGHTER_2014, classLevel: 1, hitDie: 10 }],
    });
  });
});
