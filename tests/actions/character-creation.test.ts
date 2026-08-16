import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCharacter } from "@/lib/actions/character";
import { minimalForm } from "../helpers/build-form";
import { backgroundByName, classByName, raceByName } from "../helpers/seed-lookup";
import { disconnectDatabase, resetUserData } from "../user-data";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("createCharacter", () => {
  it("зберігає всі наявні в race JSON dwarven tool proficiencies", async () => {
    const user = await prisma.user.create({
      data: { email: "dwarf-tools@actions.test", name: "Dwarf Tools Test User" },
    });
    vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

    const [race, characterClass, background] = await Promise.all([
      raceByName(Races.DWARF_2014),
      classByName(Classes.FIGHTER_2014),
      backgroundByName(BackgroundCategory.GUILD_ARTISAN),
    ]);
    const created = await createCharacter(
      minimalForm({ raceId: race.raceId, classId: characterClass.classId, backgroundId: background.backgroundId }),
    );
    if ("error" in created) throw new Error(created.error);

    await expect(prisma.pers.findUniqueOrThrow({
      where: { persId: created.persId },
      select: { customProficiencies: true },
    })).resolves.toMatchObject({
      customProficiencies: expect.stringContaining(
        "Ковальські інструменти, Пивоварні приладдя, Каменярські інструменти",
      ),
    });
  });
});
