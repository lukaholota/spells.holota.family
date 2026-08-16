import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCharacter } from "@/lib/actions/character";
import { confirmLevelUp } from "@/lib/actions/character-transaction";
import { confirmMulticlassLevelUp } from "@/lib/actions/character-transaction-multiclass";
import { minimalForm } from "../helpers/build-form";
import { backgroundByName, classByName, raceByName } from "../helpers/seed-lookup";
import { disconnectDatabase, resetUserData } from "../user-data";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("legacy level-up transactions", () => {
  it("persists selected subclass and increments total level through both entry points", async () => {
    const user = await prisma.user.create({
      data: { email: "character-transaction@golden.test", name: "Character Transaction Test User" },
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

    const subclass = await prisma.subclass.findFirst({ where: { classId: characterClass.classId } });
    if (!subclass) throw new Error("Expected Fighter subclass content");

    await expect(confirmLevelUp({
      persId: created.persId,
      newLevel: 2,
      choices: [{ stepType: "SELECT_SUBCLASS", subclassId: subclass.subclassId }],
    })).resolves.toEqual({ success: true });
    await expect(confirmMulticlassLevelUp({ persId: created.persId, choices: [] })).resolves.toEqual({ success: true });

    await expect(prisma.pers.findUnique({
      where: { persId: created.persId },
      select: { level: true, subclassId: true },
    })).resolves.toEqual({ level: 3, subclassId: subclass.subclassId });
  });
});
