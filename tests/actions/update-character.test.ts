import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCharacter } from "@/lib/actions/character";
import { updateCharacterAction } from "@/lib/actions/update-character";
import { minimalForm } from "../helpers/build-form";
import { backgroundByName, classByName, raceByName } from "../helpers/seed-lookup";
import { disconnectDatabase, resetUserData } from "../user-data";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("updateCharacterAction", () => {
  it("зберігає owner fields з поточною normalization XP, alignment і coins", async () => {
    const user = await prisma.user.create({
      data: { email: "update-character@golden.test", name: "Update Character Test User" },
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

    await expect(updateCharacterAction({
      persId: created.persId,
      data: {
        notes: "Refactored without changing this text",
        alignment: "L".repeat(101),
        xp: 17.9,
        cp: "-5",
        gp: "42 gold",
      },
    })).resolves.toEqual({ success: true });

    await expect(prisma.pers.findUnique({
      where: { persId: created.persId },
      select: { notes: true, alignment: true, xp: true, cp: true, gp: true },
    })).resolves.toEqual({
      notes: "Refactored without changing this text",
      alignment: "L".repeat(100),
      xp: 17,
      cp: "0",
      gp: "42",
    });
  });
});
