import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createCharacter } from "@/lib/actions/character";
import { applyHpChange, setDeathSaves } from "@/lib/actions/combat-actions";
import { minimalForm } from "../helpers/build-form";
import { backgroundByName, classByName, raceByName } from "../helpers/seed-lookup";
import { disconnectDatabase, resetUserData } from "../user-data";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("combat actions", () => {
  it("uses temporary HP first and stabilizes after three death-save successes", async () => {
    const user = await prisma.user.create({
      data: { email: "combat-actions@golden.test", name: "Combat Actions Test User" },
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

    await prisma.pers.update({
      where: { persId: created.persId },
      data: { currentHp: 10, maxHp: 10, tempHp: 4 },
    });

    await expect(applyHpChange({ persId: created.persId, mode: "damage", amount: 6 }))
      .resolves.toMatchObject({ success: true, currentHp: 8, tempHp: 0 });
    await expect(setDeathSaves({ persId: created.persId, successes: 3, failures: 1 }))
      .resolves.toMatchObject({
        success: true,
        currentHp: 1,
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
        isDead: false,
      });
  });
});
